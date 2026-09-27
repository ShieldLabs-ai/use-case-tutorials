import { randomInt } from 'node:crypto';
import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

const CODE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_CODES_PER_DEVICE = 3; // in 24 hours
const WAIT_SECONDS = [0, 30, 60]; // before the first, second and third code of the day
const DAY = 24 * 60 * 60 * 1000;

// Sends a verification code by SMS. The demo never sends a real SMS: the code is
// returned to the page instead, where a real app would call its SMS provider.
export async function sendCode({ phone, requestId }) {
  phone = normalizePhone(phone);
  if (!phone) {
    return { success: false, message: 'Enter a phone number with its country code, for example +1 555 010 0123.' };
  }

  // Read the identification behind this request. Unverified, automated and
  // Dangerous requests are refused before anything reaches the SMS provider.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `No code sent: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId, detection_flags: flags } = check.identification;
  if (flags.tor) {
    return { success: false, message: 'No code sent: codes cannot be requested over Tor.' };
  }

  // Cap the codes per Device ID, with a growing wait between them. Clearing cookies,
  // opening an incognito window or changing the phone number does not reset it.
  const sent = db
    .prepare('SELECT created_at FROM sms_codes WHERE device_id = ? AND created_at >= ? ORDER BY created_at')
    .all(deviceId, Date.now() - DAY);
  if (sent.length >= MAX_CODES_PER_DEVICE) {
    return { success: false, message: `No code sent: this device reached its limit of ${MAX_CODES_PER_DEVICE} codes a day.` };
  }
  const wait = sent.length ? WAIT_SECONDS[sent.length] * 1000 - (Date.now() - sent.at(-1).created_at) : 0;
  if (wait > 0) {
    return { success: false, message: `No code sent: wait ${Math.ceil(wait / 1000)} seconds before requesting another code.` };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  db.prepare(
    'INSERT INTO sms_codes (phone, code, device_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(phone, code, deviceId, checkedRequestId, Date.now(), Date.now() + CODE_LIFETIME_MS);

  return { success: true, phone, demoCode: code, message: `We sent a 6-digit code to ${phone}.` };
}

// Checks the latest code sent to a phone number.
export async function verifyCode({ phone, code }) {
  phone = normalizePhone(phone);
  const latest = db
    .prepare('SELECT id, code, expires_at, verified_at FROM sms_codes WHERE phone = ? ORDER BY id DESC LIMIT 1')
    .get(phone ?? '');

  if (!latest || latest.verified_at || latest.expires_at < Date.now()) {
    return { success: false, message: 'That code has expired. Request a new one.' };
  }
  if (latest.code !== String(code ?? '').trim()) {
    return { success: false, message: 'That code is not right.' };
  }

  db.prepare('UPDATE sms_codes SET verified_at = ? WHERE id = ?').run(Date.now(), latest.id);
  return { success: true, message: `${phone} is verified.` };
}

// Accepts "+" and 8 to 15 digits, ignoring spaces, dots, dashes and brackets.
function normalizePhone(phone) {
  const compact = String(phone ?? '').replace(/[\s().-]/g, '');
  return /^\+\d{8,15}$/.test(compact) ? compact : null;
}
