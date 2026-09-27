import { readFileSync } from 'node:fs';
import { db } from './db.js';

const PRODUCTS = JSON.parse(readFileSync(new URL('./data/products.json', import.meta.url), 'utf8'));

// Everything the store remembers about a shopper: recent searches and saved items.
// server.js decides who the shopper is.
export function getProfile(shopperId) {
  const recentSearches = db
    .prepare(
      `SELECT query FROM searches WHERE shopper_id = ?
       GROUP BY query ORDER BY MAX(created_at) DESC LIMIT 5`,
    )
    .all(shopperId)
    .map((row) => row.query);

  const saved = db
    .prepare('SELECT product_id FROM saved_items WHERE shopper_id = ? ORDER BY created_at DESC')
    .all(shopperId)
    .map((row) => findProduct(row.product_id))
    .filter(Boolean);

  return { recentSearches, saved };
}

// Searches the catalog and remembers the query for the shopper.
export function search(shopperId, query) {
  query = String(query ?? '').trim().toLowerCase().slice(0, 60);
  const results = query ? PRODUCTS.filter((product) => matches(product, query)) : PRODUCTS;

  if (query && shopperId) {
    db.prepare('INSERT INTO searches (shopper_id, query, created_at) VALUES (?, ?, ?)').run(
      shopperId,
      query,
      Date.now(),
    );
  }
  return { results };
}

// Saves a product for the shopper, or removes it when it is already saved.
export function toggleSaved(shopperId, productId) {
  const product = findProduct(productId);
  if (!product) return { success: false, message: 'No such product.' };

  const { changes } = db
    .prepare('DELETE FROM saved_items WHERE shopper_id = ? AND product_id = ?')
    .run(shopperId, product.id);
  if (changes > 0) {
    return { success: true, message: `Removed ${product.name} from your saved items.` };
  }

  db.prepare('INSERT INTO saved_items (shopper_id, product_id, created_at) VALUES (?, ?, ?)').run(
    shopperId,
    product.id,
    Date.now(),
  );
  return { success: true, message: `Saved ${product.name}.` };
}

// --- Helpers ---

function findProduct(id) {
  return PRODUCTS.find((product) => product.id === Number(id));
}

function matches(product, query) {
  const text = [product.name, product.category, ...product.keywords].join(' ').toLowerCase();
  return query.split(/\s+/).every((word) => text.includes(word));
}
