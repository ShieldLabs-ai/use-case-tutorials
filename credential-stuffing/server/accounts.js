import { db } from './db.js';
import { verifyPassword } from './passwords.js';

// Checks an email and password pair.
export async function signIn({ email, password }) {
  email = String(email ?? '').trim().toLowerCase();
  const account = db.prepare('SELECT email, password_hash FROM accounts WHERE email = ?').get(email);

  if (!account || !verifyPassword(String(password ?? ''), account.password_hash)) {
    return { success: false, message: 'Incorrect email or password.' };
  }
  return { success: true, message: `Signed in as ${account.email}.` };
}
