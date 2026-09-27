import { createHash, randomBytes, randomInt } from 'node:crypto';
import { db } from './db.js';
import { verifyPassword } from './passwords.js';
import { verifyIdentification } from './shieldlabs.js';

const CODE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

// Signs in with an email and a password. A correct password from a device the
// account has never used needs a one-time code (a step-up check) first.
export async function signIn({ email, password, requestId }) {
  // Read the identification behind this sign-in. Unverified, automated and
  // Dangerous sign-ins are refused before the password is checked.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Sign-in refused: ${check.message}` };
  }
  const { device_id: deviceId, public_ip: publicIp } = check.identification;

  const account = findAccount(email);
  if (!account || !verifyPassword(String(password ?? ''), account.password_hash)) {
    return { success: false, message: 'Incorrect email or password.' };
  }

  // A known device signs in directly. In the demo, the first device an account
  // ever signs in from becomes its first known device.
  const knownDevices = listKnownDevices(account.email);
  if (knownDevices.length === 0 || knownDevices.some((device) => device.device_id === deviceId)) {
    rememberDevice(account.email, deviceId, publicIp.country);
    return startSession(account.email);
  }

  // The right password from an unknown device: ask for a one-time code.
  return startChallenge(account.email, deviceId, publicIp.country);
}

// Checks the one-time code of a step-up check. On success the device becomes a
// known device of the account and the session starts.
export async function verifyCode({ challengeId, code }) {
  const challenge = db.prepare('SELECT * FROM sign_in_challenges WHERE id = ?').get(String(challengeId ?? ''));
  if (!challenge || challenge.expires_at < Date.now() || challenge.attempts >= MAX_CODE_ATTEMPTS) {
    return { success: false, message: 'This code has expired. Sign in again.' };
  }
  if (challenge.code !== String(code ?? '').trim()) {
    db.prepare('UPDATE sign_in_challenges SET attempts = attempts + 1 WHERE id = ?').run(challenge.id);
    return { success: false, stepUp: true, message: 'That code is not right.' };
  }

  db.prepare('DELETE FROM sign_in_challenges WHERE id = ?').run(challenge.id);
  rememberDevice(challenge.email, challenge.device_id, challenge.country);
  return startSession(challenge.email);
}

// The signed-in account behind a session cookie, with its known devices.
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
  return {
    signedIn: true,
    email: account.email,
    balance: account.balance_cents / 100,
    userHid: hashUserId(account.email),
    knownDevices: listKnownDevices(account.email).map((device) => ({
      device: `${device.device_id.slice(0, 8)}...`,
      country: device.country,
      firstSeen: device.first_seen,
    })),
  };
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

function listKnownDevices(email) {
  return db
    .prepare('SELECT device_id, country, first_seen FROM known_devices WHERE email = ? ORDER BY first_seen')
    .all(email);
}

function rememberDevice(email, deviceId, country) {
  db.prepare(
    'INSERT OR IGNORE INTO known_devices (email, device_id, country, first_seen) VALUES (?, ?, ?, ?)',
  ).run(email, deviceId, country ?? null, Date.now());
}

function startChallenge(email, deviceId, country) {
  const id = randomBytes(16).toString('hex');
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  db.prepare(
    `INSERT INTO sign_in_challenges (id, email, device_id, country, code, attempts, expires_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
  ).run(id, email, deviceId, country ?? null, code, Date.now() + CODE_LIFETIME_MS);

  // A real app emails the code. The demo returns it so the page can show it.
  const [name, domain] = email.split('@');
  return {
    success: false,
    stepUp: true,
    challengeId: id,
    demoCode: code,
    message: `New device. We sent a 6-digit code to ${name[0]}***@${domain}: enter it to finish signing in.`,
  };
}

// The hashed account id the signed-in page passes to the snippet, never the email
// itself. In production, use an HMAC with a secret from your configuration.
function hashUserId(email) {
  return createHash('sha256').update(`demo-wallet:${email}`).digest('hex').slice(0, 32);
}
