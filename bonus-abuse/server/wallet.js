import { createHash, randomBytes } from 'node:crypto';
import { db } from './db.js';
import { hashPassword } from './passwords.js';
import { verifyIdentification } from './shieldlabs.js';

// The welcome bonus matches a first deposit 100%, up to this cap.
const MATCH_BONUS_CAP_CENTS = 10_000;

// Creates an account and signs the session in immediately.
export async function signUp({ email, password, requestId }) {
  email = String(email ?? '').trim().toLowerCase();
  password = String(password ?? '');
  if (!email || !password) {
    return { success: false, message: 'Enter an email and a password.' };
  }

  // Read the identification behind this signup. Unverified, automated and
  // Dangerous signups are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Signup refused: ${check.message}` };
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

// Deposits into the signed-in account's balance. The first deposit made from a
// device also credits a 100% match bonus, up to $100, once, no matter which
// account it lands on. The Device ID stays the same when cookies are cleared,
// in an incognito window and on a new IP address.
export async function deposit(token, { amountCents, requestId }) {
  const account = accountForToken(token);
  if (!account) {
    return { success: false, message: 'Sign in first.' };
  }

  // Read the identification behind this deposit. Unverified, automated and
  // Dangerous deposits are refused.
  const check = await verifyIdentification(requestId, { expectedUserHid: hashUserId(account.email) });
  if (!check.ok) {
    return { success: false, message: `Deposit refused: ${check.message}` };
  }
  const { device_id: deviceId } = check.identification;

  amountCents = Math.round(Number(amountCents));
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { success: false, message: 'Enter a deposit amount greater than zero.' };
  }

  // One welcome bonus per device.
  let bonusCents = 0;
  if (!db.prepare('SELECT 1 FROM bonus_claims WHERE device_id = ?').get(deviceId)) {
    bonusCents = Math.min(amountCents, MATCH_BONUS_CAP_CENTS);
    db.prepare('INSERT OR IGNORE INTO bonus_claims (device_id, email, claimed_at) VALUES (?, ?, ?)').run(
      deviceId,
      account.email,
      Date.now(),
    );
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
  return {
    signedIn: true,
    email: account.email,
    balance: account.balance_cents / 100,
    userHid: hashUserId(account.email),
  };
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

// The hashed account id the signed-in page passes to the snippet, never the email
// itself. In production, use an HMAC with a secret from your configuration.
function hashUserId(email) {
  return createHash('sha256').update(`acme-wallet:${email}`).digest('hex').slice(0, 32);
}
