import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { verifyPassword } from './passwords.js';

// Signs in and starts a session. The plan allows one active session per account,
// so the newest sign-in replaces the session that is already active.
export async function signIn({ email, password }) {
  const account = findAccount(email);
  if (!account || !verifyPassword(String(password ?? ''), account.password_hash)) {
    return { success: false, message: 'Incorrect email or password.' };
  }

  endActiveSessions(account.email, 'replaced');
  const token = createSession(account.email);
  return { success: true, token, email: account.email, message: `Signed in as ${account.email}.` };
}

// Returns the state of the session behind a cookie.
export function getSession(token) {
  const session = token
    ? db.prepare('SELECT email, ended_at FROM sessions WHERE token = ?').get(token)
    : null;
  if (!session || session.ended_at) return { signedIn: false };
  return { signedIn: true, email: session.email };
}

export function signOut(token) {
  db.prepare(
    'UPDATE sessions SET ended_at = ?, ended_reason = ? WHERE token = ? AND ended_at IS NULL',
  ).run(Date.now(), 'signed_out', token ?? '');
}

// --- Helpers ---

function findAccount(email) {
  return db
    .prepare('SELECT email, password_hash FROM accounts WHERE email = ?')
    .get(String(email ?? '').trim().toLowerCase());
}

function createSession(email) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, email, created_at) VALUES (?, ?, ?)').run(
    token,
    email,
    Date.now(),
  );
  return token;
}

function endActiveSessions(email, reason) {
  db.prepare(
    'UPDATE sessions SET ended_at = ?, ended_reason = ? WHERE email = ? AND ended_at IS NULL',
  ).run(Date.now(), reason, email);
}
