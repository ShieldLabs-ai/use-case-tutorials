import { db } from './db.js';
import { hashPassword } from './passwords.js';
import { verifyIdentification } from './shieldlabs.js';

// Creates a free trial account: one per device.
export async function signUp({ username, password, requestId }) {
  username = String(username ?? '').trim();
  password = String(password ?? '');
  if (!username || !password) {
    return { success: false, message: 'Enter a username and a password.' };
  }

  // Read the identification behind this signup. Unverified, automated and
  // Dangerous signups are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Signup refused: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId } = check.identification;

  if (findAccount(username)) {
    return { success: false, message: 'That username is taken.' };
  }

  // One trial per device. The Device ID stays the same when cookies are cleared,
  // in an incognito window and on a new IP address.
  if (db.prepare('SELECT 1 FROM accounts WHERE device_id = ?').get(deviceId)) {
    return { success: false, message: 'Signup refused: you already have a trial account.' };
  }

  db.prepare(
    'INSERT INTO accounts (username, password_hash, device_id, request_id, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(username, hashPassword(password), deviceId, checkedRequestId, Date.now());

  return { success: true, message: `Your 14-day trial has started, ${username}.` };
}

function findAccount(username) {
  return db.prepare('SELECT username FROM accounts WHERE username = ?').get(username);
}
