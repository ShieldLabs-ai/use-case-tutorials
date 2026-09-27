import { randomBytes, randomInt } from 'node:crypto';
import { db } from './db.js';
import { verifyPassword } from './passwords.js';
import { verifyIdentification } from './shieldlabs.js';

const MAX_FAILURES_PER_DEVICE = 5; // in 24 hours
const DAY = 24 * 60 * 60 * 1000;
const CODE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

// Checks an email and password pair.
export async function signIn({ email, password, requestId }) {
  // Read the identification behind this attempt. Unverified, automated and
  // Dangerous attempts are refused before the password is checked.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Sign-in refused: ${check.message}` };
  }
  const deviceId = check.identification.device_id;

  // Credential stuffing tries many pairs from one device. Count the failures per
  // Device ID, which stays the same when a script rotates IP addresses or clears
  // cookies.
  const { failures } = db
    .prepare('SELECT COUNT(*) AS failures FROM failed_logins WHERE device_id = ? AND created_at >= ?')
    .get(deviceId, Date.now() - DAY);
  if (failures >= MAX_FAILURES_PER_DEVICE) {
    return { success: false, message: 'Sign-in refused: too many failed attempts from this device. Try again tomorrow.' };
  }

  email = String(email ?? '').trim().toLowerCase();
  const account = db.prepare('SELECT email, password_hash FROM accounts WHERE email = ?').get(email);

  if (!account || !verifyPassword(String(password ?? ''), account.password_hash)) {
    db.prepare('INSERT INTO failed_logins (device_id, email, created_at) VALUES (?, ?, ?)').run(
      deviceId,
      email,
      Date.now(),
    );
    return { success: false, message: 'Incorrect email or password.' };
  }

  // A correct password from a device the account has never used may come from a
  // leaked list: confirm it with a one-time code. In the demo, the first device an
  // account ever signs in from becomes its first known device.
  const knownDevices = db.prepare('SELECT device_id FROM known_devices WHERE email = ?').all(account.email);
  if (knownDevices.length > 0 && !knownDevices.some((device) => device.device_id === deviceId)) {
    return startChallenge(account.email, deviceId);
  }

  rememberDevice(account.email, deviceId);
  return { success: true, message: `Signed in as ${account.email}.` };
}

// Checks the one-time code of a sign-in from a new device.
export async function verifyCode({ challengeId, code }) {
  const challenge = db.prepare('SELECT * FROM sign_in_challenges WHERE id = ?').get(String(challengeId ?? ''));
  if (!challenge || challenge.expires_at < Date.now() || challenge.attempts >= MAX_CODE_ATTEMPTS) {
    return { success: false, message: 'This code has expired. Sign in again.' };
  }
  if (challenge.code !== String(code ?? '').trim()) {
    db.prepare('UPDATE sign_in_challenges SET attempts = attempts + 1 WHERE id = ?').run(challenge.id);
    return { success: false, challenge: true, message: 'That code is not right.' };
  }

  db.prepare('DELETE FROM sign_in_challenges WHERE id = ?').run(challenge.id);
  rememberDevice(challenge.email, challenge.device_id);
  return { success: true, message: `Signed in as ${challenge.email}.` };
}

// --- Helpers ---

function rememberDevice(email, deviceId) {
  db.prepare('INSERT OR IGNORE INTO known_devices (email, device_id, first_seen) VALUES (?, ?, ?)').run(
    email,
    deviceId,
    Date.now(),
  );
}

function startChallenge(email, deviceId) {
  const id = randomBytes(16).toString('hex');
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  db.prepare(
    'INSERT INTO sign_in_challenges (id, email, device_id, code, attempts, expires_at) VALUES (?, ?, ?, ?, 0, ?)',
  ).run(id, email, deviceId, code, Date.now() + CODE_LIFETIME_MS);

  // A real app emails the code. The demo returns it so the page can show it.
  return {
    success: false,
    challenge: true,
    challengeId: id,
    demoCode: code,
    message: 'New device: enter the 6-digit code we emailed you to finish signing in.',
  };
}
