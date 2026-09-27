import { db } from './db.js';
import { hashPassword } from './passwords.js';

// Creates a free trial account.
export async function signUp({ username, password }) {
  username = String(username ?? '').trim();
  password = String(password ?? '');
  if (!username || !password) {
    return { success: false, message: 'Enter a username and a password.' };
  }

  if (findAccount(username)) {
    return { success: false, message: 'That username is taken.' };
  }

  db.prepare('INSERT INTO accounts (username, password_hash, created_at) VALUES (?, ?, ?)').run(
    username,
    hashPassword(password),
    Date.now(),
  );

  return { success: true, message: `Your 14-day trial has started, ${username}.` };
}

function findAccount(username) {
  return db.prepare('SELECT username FROM accounts WHERE username = ?').get(username);
}
