import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

// Recognizes a returning shopper by Device ID. A browser without a session (a first
// visit, an incognito window, cleared cookies) runs one identification. The server
// reads its Device ID and hands the browser a session cookie that points to it, so
// the next requests do not need a new identification.
export async function startDeviceSession(requestId) {
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Not personalized: ${check.message}` };
  }

  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO device_sessions (token, device_id, created_at) VALUES (?, ?, ?)').run(
    token,
    check.identification.device_id,
    Date.now(),
  );
  return { success: true, token, deviceId: check.identification.device_id };
}

// The Device ID behind a session cookie, or null.
export function deviceForSession(token) {
  if (!token) return null;
  return db.prepare('SELECT device_id FROM device_sessions WHERE token = ?').get(token)?.device_id ?? null;
}
