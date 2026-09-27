import Database from 'better-sqlite3';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './passwords.js';

// The demo data lives in db.sqlite, next to package.json.
export const db = new Database(fileURLToPath(new URL('../db.sqlite', import.meta.url)));

// Bump this when the tables change. A database with another version (for example
// after you switch between the starter and final branches) is recreated.
const SCHEMA_VERSION = 2;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    banned_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  // Every device each member signed up or signed in from.
  `CREATE TABLE IF NOT EXISTS user_devices (
    username TEXT NOT NULL,
    device_id TEXT NOT NULL,
    first_seen INTEGER NOT NULL,
    PRIMARY KEY (username, device_id)
  )`,
  `CREATE TABLE IF NOT EXISTS banned_devices (
    device_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    banned_at INTEGER NOT NULL
  )`,
  // Request IDs already used for an action (see server/shieldlabs.js).
  `CREATE TABLE IF NOT EXISTS used_request_ids (
    request_id TEXT PRIMARY KEY,
    used_at INTEGER NOT NULL
  )`,
];

// A few existing members and posts, so the board is not empty.
const SEED_POSTS = [
  ['maria', 'Has anyone walked the new north ridge trail yet? Looking for tips on the steep part.'],
  ['devon', 'Two spare bike lights for sale, barely used. Reply here if you want them.'],
  ['maria', 'Reminder: the park cleanup is on Saturday at 9. Gloves and bags provided.'],
];

export function initDb() {
  if (db.pragma('user_version', { simple: true }) !== SCHEMA_VERSION) {
    dropAllTables();
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
  for (const sql of TABLES) db.prepare(sql).run();

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count > 0) return;

  const hour = 60 * 60 * 1000;
  const addUser = db.prepare(
    'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)',
  );
  const addPost = db.prepare('INSERT INTO posts (username, body, created_at) VALUES (?, ?, ?)');
  for (const username of ['maria', 'devon']) {
    addUser.run(username, hashPassword(randomBytes(12).toString('hex')), Date.now() - 48 * hour);
  }
  SEED_POSTS.forEach(([username, body], i) => {
    addPost.run(username, body, Date.now() - (SEED_POSTS.length - i) * 5 * hour);
  });
}

export function resetDb() {
  dropAllTables();
  initDb();
}

function dropAllTables() {
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
    .all();
  for (const { name } of tables) db.prepare(`DROP TABLE "${name}"`).run();
}
