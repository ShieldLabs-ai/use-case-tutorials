import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { verifyPassword } from './passwords.js';

// Signs in with an email and a password.
export async function signIn({ email, password }) {
  const account = findAccount(email);
  if (!account || !verifyPassword(String(password ?? ''), account.password_hash)) {
    return { success: false, message: 'Incorrect email or password.' };
  }

  return startSession(account.email);
}

// The signed-in account behind a session cookie.
export function getAccount(token) {
  const account = token
    ? db
        .prepare(
          `SELECT accounts.email, accounts.balance_cents FROM sessions
           JOIN accounts ON accounts.email = sessions.email WHERE sessions.token = ?`,
        )
        .get(token)
    : null;
  if (!account) return { signedIn: false };
  return { signedIn: true, email: account.email, balance: account.balance_cents / 100 };
}

export function signOut(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token ?? '');
}

// --- Helpers ---

function findAccount(email) {
  return db
    .prepare('SELECT email, password_hash FROM accounts WHERE email = ?')
    .get(String(email ?? '').trim().toLowerCase());
}

function startSession(email) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, email, created_at) VALUES (?, ?, ?)').run(
    token,
    email,
    Date.now(),
  );
  return { success: true, token, message: `Signed in as ${email}.` };
}
