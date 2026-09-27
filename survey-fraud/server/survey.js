import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

const QUESTIONS = ['cooking', 'nextAppliance', 'groceries'];

// Accepts a survey submission and pays the reward: one per device.
export async function submitSurvey({ email, answers, requestId }) {
  email = String(email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { success: false, message: 'Enter the email for your gift card.' };
  }
  if (QUESTIONS.some((question) => !answers?.[question])) {
    return { success: false, message: 'Answer all three questions.' };
  }

  // Read the identification behind this submission. Unverified, automated and
  // Dangerous submissions are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Submission refused: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId } = check.identification;

  // One paid submission per device: a new email address is not a new respondent.
  // The Device ID stays the same when cookies are cleared and in an incognito window.
  if (db.prepare('SELECT 1 FROM submissions WHERE device_id = ?').get(deviceId)) {
    return { success: false, message: 'Submission refused: this device has already taken the survey.' };
  }
  if (db.prepare('SELECT 1 FROM submissions WHERE email = ?').get(email)) {
    return { success: false, message: 'This email address has already taken the survey.' };
  }

  const picked = Object.fromEntries(QUESTIONS.map((question) => [question, String(answers[question])]));
  db.prepare(
    'INSERT INTO submissions (email, answers, device_id, request_id, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(email, JSON.stringify(picked), deviceId, checkedRequestId, Date.now());

  return { success: true, message: `Thank you. Your $5 gift card is on its way to ${email}.` };
}
