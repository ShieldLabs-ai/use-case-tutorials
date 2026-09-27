import { createHash, randomBytes } from 'node:crypto';
import { db } from './db.js';
import { verifyPassword } from './passwords.js';
import { verifyIdentification } from './shieldlabs.js';

// Signs in and starts a session. The plan allows one device at a time: a sign-in
// from a device other than the one already signed in is refused, unless the user
// chooses to sign that device out.
export async function signIn({ email, password, requestId, signOutOtherDevice = false }) {
  // Read the identification behind this sign-in. Unverified, automated and
  // Dangerous sign-ins are refused before the password is checked.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Sign-in refused: ${check.message}` };
  }
  const deviceId = check.identification.device_id;

  const account = findAccount(email);
  if (!account || !verifyPassword(String(password ?? ''), account.password_hash)) {
    return { success: false, message: 'Incorrect email or password.' };
  }

  // Compare with the device of the session that is active now. The Device ID stays
  // the same when cookies are cleared and in an incognito window, so the owner
  // signing in again on the same device is not mistaken for a second device.
  const active = db
    .prepare('SELECT device_id FROM sessions WHERE email = ? AND ended_at IS NULL ORDER BY created_at DESC LIMIT 1')
    .get(account.email);

  if (active && active.device_id !== deviceId) {
    if (!signOutOtherDevice) {
      return {
        success: false,
        otherDevice: true,
        message: 'This account is signed in on another device. Sign out there first, or sign that device out.',
      };
    }
    endActiveSessions(account.email, 'signed_out_elsewhere');
  } else {
    endActiveSessions(account.email, 'replaced');
  }

  const token = createSession(account.email, deviceId);
  return { success: true, token, email: account.email, message: `Signed in as ${account.email}.` };
}

// Returns the state of the session behind a cookie.
export function getSession(token) {
  const session = token
    ? db.prepare('SELECT email, ended_at, ended_reason FROM sessions WHERE token = ?').get(token)
    : null;
  if (!session || session.ended_at) {
    return { signedIn: false, signedOutElsewhere: session?.ended_reason === 'signed_out_elsewhere' };
  }
  return { signedIn: true, email: session.email, userHid: hashUserId(session.email) };
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

function createSession(email, deviceId) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, email, device_id, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    email,
    deviceId,
    Date.now(),
  );
  return token;
}

function endActiveSessions(email, reason) {
  db.prepare(
    'UPDATE sessions SET ended_at = ?, ended_reason = ? WHERE email = ? AND ended_at IS NULL',
  ).run(Date.now(), reason, email);
}

// The hashed account id the signed-in page passes to the snippet, never the email
// itself. In production, use an HMAC with a secret from your configuration.
function hashUserId(email) {
  return createHash('sha256').update(`demo-stream:${email}`).digest('hex').slice(0, 32);
}
