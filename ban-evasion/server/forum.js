import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { verifyIdentification } from './shieldlabs.js';

// Creates a member account and signs it in. Banned devices cannot create accounts.
export async function signUp({ username, password, requestId }) {
  username = String(username ?? '').trim().toLowerCase();
  password = String(password ?? '');
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { success: false, message: 'Use 3 to 20 letters, digits or underscores for the username.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Use at least 6 characters for the password.' };
  }

  // Read the identification behind this signup. Unverified, automated and
  // Dangerous signups are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Signup refused: ${check.message}` };
  }
  const deviceId = check.identification.device_id;

  // A new account on a device a banned member used is the banned member coming back.
  if (isDeviceBanned(deviceId)) {
    return { success: false, message: 'Signup refused: this device is banned.' };
  }
  if (findUser(username)) {
    return { success: false, message: 'That username is taken.' };
  }

  db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)').run(
    username,
    hashPassword(password),
    Date.now(),
  );
  rememberDevice(username, deviceId);
  return startSession(username, `Welcome, ${username}. You can post now.`);
}

// Signs a member in. Banned accounts and banned devices stay out.
export async function signIn({ username, password, requestId }) {
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Sign-in refused: ${check.message}` };
  }
  const deviceId = check.identification.device_id;

  const user = findUser(String(username ?? '').trim().toLowerCase());
  if (!user || !verifyPassword(String(password ?? ''), user.password_hash)) {
    return { success: false, message: 'Incorrect username or password.' };
  }
  if (user.banned_at) {
    return { success: false, message: 'This account is banned.' };
  }
  if (isDeviceBanned(deviceId)) {
    return { success: false, message: 'Sign-in refused: this device is banned.' };
  }

  rememberDevice(user.username, deviceId);
  return startSession(user.username, `Signed in as ${user.username}.`);
}

export function signOut(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token ?? '');
}

// Everything the page shows: the signed-in member, the posts and the member list.
export function getBoard(token) {
  const session = token
    ? db.prepare('SELECT username FROM sessions WHERE token = ?').get(token)
    : null;

  const posts = db
    .prepare(
      `SELECT posts.id, posts.username, posts.body, posts.created_at, users.banned_at
       FROM posts JOIN users ON users.username = posts.username
       ORDER BY posts.created_at DESC LIMIT 30`,
    )
    .all()
    .map((post) => ({ ...post, banned: Boolean(post.banned_at) }));

  const members = db
    .prepare(
      `SELECT users.username, users.banned_at,
         (SELECT COUNT(*) FROM posts WHERE posts.username = users.username) AS posts,
         (SELECT COUNT(*) FROM user_devices WHERE user_devices.username = users.username) AS devices
       FROM users ORDER BY users.created_at DESC`,
    )
    .all()
    .map((member) => ({ ...member, banned: Boolean(member.banned_at) }));

  return { username: session?.username ?? null, posts, members };
}

export function createPost(token, body) {
  const session = token
    ? db.prepare('SELECT username FROM sessions WHERE token = ?').get(token)
    : null;
  if (!session) return { success: false, message: 'Sign in to post.' };

  body = String(body ?? '').trim();
  if (!body) return { success: false, message: 'Write something first.' };

  db.prepare('INSERT INTO posts (username, body, created_at) VALUES (?, ?, ?)').run(
    session.username,
    body.slice(0, 500),
    Date.now(),
  );
  return { success: true, message: 'Posted.' };
}

// Moderator action: ban a member, every device they used, and end their sessions.
export function banUser(username) {
  const user = findUser(username);
  if (!user) return { success: false, message: 'No such member.' };

  db.prepare('UPDATE users SET banned_at = ? WHERE username = ?').run(Date.now(), user.username);
  db.prepare('DELETE FROM sessions WHERE username = ?').run(user.username);

  // The Device ID stays the same when cookies are cleared, in an incognito window
  // and on a new IP address, so a fresh account on these devices is caught.
  const { changes } = db
    .prepare(
      `INSERT OR IGNORE INTO banned_devices (device_id, username, banned_at)
       SELECT device_id, username, ? FROM user_devices WHERE username = ?`,
    )
    .run(Date.now(), user.username);
  return { success: true, message: `${user.username} is banned, with ${changes} ${changes === 1 ? 'device' : 'devices'}.` };
}

// --- Helpers ---

function findUser(username) {
  return db
    .prepare('SELECT username, password_hash, banned_at FROM users WHERE username = ?')
    .get(username);
}

function rememberDevice(username, deviceId) {
  db.prepare('INSERT OR IGNORE INTO user_devices (username, device_id, first_seen) VALUES (?, ?, ?)').run(
    username,
    deviceId,
    Date.now(),
  );
}

function isDeviceBanned(deviceId) {
  return Boolean(db.prepare('SELECT 1 FROM banned_devices WHERE device_id = ?').get(deviceId));
}

function startSession(username, message) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, username, created_at) VALUES (?, ?, ?)').run(
    token,
    username,
    Date.now(),
  );
  return { success: true, token, message };
}
