import { db } from './db.js';

const QUESTIONS = ['cooking', 'nextAppliance', 'groceries'];

// Accepts a survey submission and pays the reward: one per email address.
export async function submitSurvey({ email, answers }) {
  email = String(email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { success: false, message: 'Enter the email for your gift card.' };
  }
  if (QUESTIONS.some((question) => !answers?.[question])) {
    return { success: false, message: 'Answer all three questions.' };
  }

  if (db.prepare('SELECT 1 FROM submissions WHERE email = ?').get(email)) {
    return { success: false, message: 'This email address has already taken the survey.' };
  }

  const picked = Object.fromEntries(QUESTIONS.map((question) => [question, String(answers[question])]));
  db.prepare('INSERT INTO submissions (email, answers, created_at) VALUES (?, ?, ?)').run(
    email,
    JSON.stringify(picked),
    Date.now(),
  );

  return { success: true, message: `Thank you. Your $5 gift card is on its way to ${email}.` };
}
