import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
export const db = new Database(process.env.DEMO_DB_PATH || fileURLToPath(new URL('../db.sqlite', import.meta.url)));
export function initDb() {
  db.exec('CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, email TEXT NOT NULL, outcome TEXT NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS used_request_ids (request_id TEXT PRIMARY KEY, used_at INTEGER NOT NULL)');
}
export function resetDb() { db.exec('DELETE FROM orders'); db.exec('DELETE FROM used_request_ids'); }
