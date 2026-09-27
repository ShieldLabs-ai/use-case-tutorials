import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

// The demo data lives in db.sqlite, next to package.json.
export const db = new Database(fileURLToPath(new URL('../db.sqlite', import.meta.url)));

// Bump this when the tables change. A database with another version (for example
// after you switch between the starter and final branches) is recreated.
const SCHEMA_VERSION = 2;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS price_activations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country TEXT NOT NULL,
    percent_off INTEGER NOT NULL,
    device_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  // Request IDs already used for an action (see server/shieldlabs.js).
  `CREATE TABLE IF NOT EXISTS used_request_ids (
    request_id TEXT PRIMARY KEY,
    used_at INTEGER NOT NULL
  )`,
];

export function initDb() {
  if (db.pragma('user_version', { simple: true }) !== SCHEMA_VERSION) {
    dropAllTables();
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
  for (const sql of TABLES) db.prepare(sql).run();
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
