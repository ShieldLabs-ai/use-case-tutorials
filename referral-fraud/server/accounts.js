import { randomBytes } from 'node:crypto';
import { db } from './db.js';

const REWARD_CENTS = 1000; // $10

// Creates an account and, if a referral code was entered, credits the reward:
// $10 to the new signup and $10 to the code's owner. Nothing here checks whether
// the two accounts are really two different people, so the same person can farm
// the reward by signing up "friends" from their own browser.
export async function signUp({ email, referralCode }) {
  email = String(email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Enter a valid email address.' };
  }
  if (findAccount(email)) {
    return { success: false, message: 'An account with that email already exists.' };
  }

  const code = referralCode ? String(referralCode).trim().toUpperCase() : null;
  const referrer = code ? findByReferralCode(code) : null;

  let creditCents = 0;
  let message = 'Account created.';
  if (code && !referrer) {
    message = 'Account created. That referral code was not recognized.';
  } else if (referrer) {
    creditCents = REWARD_CENTS;
    creditAccount(referrer.email, REWARD_CENTS);
    message = 'Account created. You and your friend both earned $10 for the referral.';
  }

  const ownReferralCode = generateReferralCode(email);
  db.prepare(
    'INSERT INTO accounts (email, referral_code, credit_cents, created_at) VALUES (?, ?, ?, ?)',
  ).run(email, ownReferralCode, creditCents, Date.now());

  const token = createSession(email);
  return { success: true, token, email, referralCode: ownReferralCode, creditCents, message };
}

// Returns the state of the session behind a cookie.
export function getSession(token) {
  const session = token ? db.prepare('SELECT email FROM sessions WHERE token = ?').get(token) : null;
  const account = session ? findAccount(session.email) : null;
  if (!account) return { signedIn: false };
  return {
    signedIn: true,
    email: account.email,
    referralCode: account.referral_code,
    creditCents: account.credit_cents,
  };
}

export function endSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token ?? '');
}

// --- Helpers ---

function findAccount(email) {
  return db.prepare('SELECT * FROM accounts WHERE email = ?').get(email);
}

function findByReferralCode(code) {
  return db.prepare('SELECT * FROM accounts WHERE referral_code = ?').get(code);
}

function creditAccount(email, cents) {
  db.prepare('UPDATE accounts SET credit_cents = credit_cents + ? WHERE email = ?').run(cents, email);
}

function createSession(email) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, email, created_at) VALUES (?, ?, ?)').run(token, email, Date.now());
  return token;
}

// The account's own referral code: the email's local part, uppercased, plus 3
// random digits, for example RILEY482.
function generateReferralCode(email) {
  const local = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase() || 'MEMBER';
  let code;
  do {
    code = `${local}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  } while (findByReferralCode(code));
  return code;
}
