import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

// The demo data lives in db.sqlite, next to package.json.
export const db = new Database(process.env.DEMO_DB_PATH || fileURLToPath(new URL('../db.sqlite', import.meta.url)));

// Bump this when the tables change. A database with another version (for example
// after you switch between the starter and final branches) is recreated.
const SCHEMA_VERSION = 2;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total INTEGER NOT NULL,
    email TEXT NOT NULL,
    card_last4 TEXT NOT NULL,
    device_id TEXT NOT NULL,
    ip TEXT,
    country TEXT,
    risk_score INTEGER,
    request_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    chargeback_at INTEGER,
    chargeback_reason TEXT
  )`,
  // Request IDs already used for an action (see server/shieldlabs.js).
  `CREATE TABLE IF NOT EXISTS used_request_ids (
    request_id TEXT PRIMARY KEY,
    used_at INTEGER NOT NULL
  )`,
];

// Earlier orders from other customers, so the admin page is not empty. Their
// identification data is made up: Riley placed both orders from one device.
const DAY = 24 * 60 * 60 * 1000;
const RILEY = { device_id: '5e1f2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a4b', ip: '198.51.100.23', country: 'US' };
const SAM = { device_id: '0b1c2d3e-4f5a-4b6c-9d7e-8f9a0b1c2d3e', ip: '203.0.113.77', country: 'GB' };
const SEED_ORDERS = [
  { event_id: 1, event_name: 'Harbor Lights Jazz Night', quantity: 2, total: 96, email: 'riley@example.com', card_last4: '4417', ...RILEY, risk_score: 4, request_id: 'c3d4e5f6-0001-4a1b-8c2d-3e4f5a6b7c8d', days_ago: 20 },
  { event_id: 3, event_name: 'Symphony Under the Stars', quantity: 1, total: 62, email: 'sam@example.com', card_last4: '0005', ...SAM, risk_score: 12, request_id: 'c3d4e5f6-0002-4a1b-8c2d-3e4f5a6b7c8d', days_ago: 12 },
  { event_id: 2, event_name: 'Northfield Indie Showcase', quantity: 2, total: 70, email: 'riley@example.com', card_last4: '4417', ...RILEY, risk_score: 6, request_id: 'c3d4e5f6-0003-4a1b-8c2d-3e4f5a6b7c8d', days_ago: 6 },
];

export function initDb() {
  if (db.pragma('user_version', { simple: true }) !== SCHEMA_VERSION) {
    dropAllTables();
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
  for (const sql of TABLES) db.prepare(sql).run();

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM orders').get();
  if (count > 0) return;

  const insert = db.prepare(
    `INSERT INTO orders (event_id, event_name, quantity, total, email, card_last4,
       device_id, ip, country, risk_score, request_id, created_at)
     VALUES (@event_id, @event_name, @quantity, @total, @email, @card_last4,
       @device_id, @ip, @country, @risk_score, @request_id, @created_at)`,
  );
  for (const { days_ago, ...order } of SEED_ORDERS) {
    insert.run({ ...order, created_at: Date.now() - days_ago * DAY });
  }
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
