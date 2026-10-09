import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

// The demo data lives in db.sqlite, next to package.json.
export const db = new Database(process.env.DEMO_DB_PATH || fileURLToPath(new URL('../db.sqlite', import.meta.url)));

// Bump this when the tables change. A database with another version (for example
// after you switch between the starter and final branches) is recreated.
const SCHEMA_VERSION = 1;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total INTEGER NOT NULL,
    email TEXT NOT NULL,
    card_last4 TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    chargeback_at INTEGER,
    chargeback_reason TEXT
  )`,
];

// Earlier orders from other customers, so the admin page is not empty.
const DAY = 24 * 60 * 60 * 1000;
const SEED_ORDERS = [
  { event_id: 1, event_name: 'Harbor Lights Jazz Night', quantity: 2, total: 96, email: 'riley@example.com', card_last4: '4417', days_ago: 20 },
  { event_id: 3, event_name: 'Symphony Under the Stars', quantity: 1, total: 62, email: 'sam@example.com', card_last4: '0005', days_ago: 12 },
  { event_id: 2, event_name: 'Northfield Indie Showcase', quantity: 2, total: 70, email: 'riley@example.com', card_last4: '4417', days_ago: 6 },
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
    `INSERT INTO orders (event_id, event_name, quantity, total, email, card_last4, created_at)
     VALUES (@event_id, @event_name, @quantity, @total, @email, @card_last4, @created_at)`,
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
