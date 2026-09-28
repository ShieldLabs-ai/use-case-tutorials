import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { hashPassword } from './passwords.js';

// The welcome bonus matches a first deposit 100%, up to this cap.
const MATCH_BONUS_CAP_CENTS = 10_000;

// Creates an account and signs the session in immediately.
export async function signUp({ email, password }) {
  email = String(email ?? '').trim().toLowerCase();
  password = String(password ?? '');
  if (!email || !password) {
    return { success: false, message: 'Enter an email and a password.' };
  }
  if (findAccount(email)) {
    return { success: false, message: 'An account with that email already exists.' };
  }

  db.prepare('INSERT INTO accounts (email, password_hash, balance_cents) VALUES (?, ?, 0)').run(
    email,
    hashPassword(password),
  );

  return { ...startSession(email), message: `Account created for ${email}.` };
}

// Deposits into the signed-in account's balance. The account's first deposit
// also credits a 100% match bonus, up to $100, once.
export async function deposit(token, { amountCents }) {
  const account = accountForToken(token);
  if (!account) {
    return { success: false, message: 'Sign in first.' };
  }

  amountCents = Math.round(Number(amountCents));
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { success: false, message: 'Enter a deposit amount greater than zero.' };
  }

  // One welcome bonus per account.
  let bonusCents = 0;
  if (!db.prepare('SELECT 1 FROM bonus_claims WHERE email = ?').get(account.email)) {
    bonusCents = Math.min(amountCents, MATCH_BONUS_CAP_CENTS);
    db.prepare('INSERT INTO bonus_claims (email, claimed_at) VALUES (?, ?)').run(account.email, Date.now());
  }

  db.prepare('UPDATE accounts SET balance_cents = balance_cents + ? WHERE email = ?').run(
    amountCents + bonusCents,
    account.email,
  );

  const newBalanceCents = account.balance_cents + amountCents + bonusCents;
  const message =
    bonusCents > 0
      ? `Deposit of ${money(amountCents)} confirmed. ${money(bonusCents)} welcome bonus credited (100% match, up to $100). New balance: ${money(newBalanceCents)}.`
      : `Deposit of ${money(amountCents)} confirmed. Your welcome bonus was already claimed, so no match this time. New balance: ${money(newBalanceCents)}.`;

  return { success: true, message };
}

// The signed-in account behind a session cookie.
export function getAccount(token) {
  const account = accountForToken(token);
  if (!account) return { signedIn: false };
  return { signedIn: true, email: account.email, balance: account.balance_cents / 100 };
}

export function signOut(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token ?? '');
}

// --- Helpers ---

function findAccount(email) {
  return db.prepare('SELECT email FROM accounts WHERE email = ?').get(email);
}

function accountForToken(token) {
  return token
    ? db
        .prepare(
          `SELECT accounts.email, accounts.balance_cents FROM sessions
           JOIN accounts ON accounts.email = sessions.email WHERE sessions.token = ?`,
        )
        .get(token)
    : null;
}

function startSession(email) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, email, created_at) VALUES (?, ?, ?)').run(
    token,
    email,
    Date.now(),
  );
  return { success: true, token };
}

function money(cents) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
