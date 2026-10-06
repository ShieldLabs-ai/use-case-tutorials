import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './passwords.js';

// The demo data lives in db.sqlite, next to package.json.
export const db = new Database(process.env.DEMO_DB_PATH || fileURLToPath(new URL('../db.sqlite', import.meta.url)));

// Bump this when the tables change. A database with another version (for example
// after you switch between the starter and final branches) is recreated.
const SCHEMA_VERSION = 1;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS accounts (
    email TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
  )`,
];

export const DEMO_ACCOUNT = { email: 'demo@example.com', password: 'demo-password' };

export function initDb() {
  if (db.pragma('user_version', { simple: true }) !== SCHEMA_VERSION) {
    dropAllTables();
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
  for (const sql of TABLES) db.prepare(sql).run();

  db.prepare('INSERT OR IGNORE INTO accounts (email, password_hash) VALUES (?, ?)').run(
    DEMO_ACCOUNT.email,
    hashPassword(DEMO_ACCOUNT.password),
  );
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
