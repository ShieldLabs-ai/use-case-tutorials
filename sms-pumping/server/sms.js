import { randomInt } from 'node:crypto';
import { db } from './db.js';

const CODE_LIFETIME_MS = 10 * 60 * 1000;

// Sends a verification code by SMS. The demo never sends a real SMS: the code is
// returned to the page instead, where a real app would call its SMS provider.
export async function sendCode({ phone }) {
  phone = normalizePhone(phone);
  if (!phone) {
    return { success: false, message: 'Enter a phone number with its country code, for example +1 555 010 0123.' };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  db.prepare('INSERT INTO sms_codes (phone, code, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    phone,
    code,
    Date.now(),
    Date.now() + CODE_LIFETIME_MS,
  );

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
