import 'dotenv/config';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { getProfile, search, toggleSaved } from './store.js';

initDb();

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// The shopper's recent searches and saved items.
app.get('/api/profile', (req, res) => {
  res.json(getProfile(shopperCookie(req, res)));
});

app.get('/api/search', (req, res) => {
  res.json(search(shopperCookie(req, res), req.query.q));
});

app.post('/api/saved', (req, res) => {
  res.json(toggleSaved(shopperCookie(req, res), req.body?.productId));
});

// Reset the demo database.
app.post('/api/reset-db', (_req, res) => {
  resetDb();
  res.json({ success: true, message: 'Demo database reset.' });
});

// Show server errors in the response, to make the tutorial easy to debug.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: `Server error: ${err.message}` });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

// Recognizes a returning shopper by a cookie, or sets a new one.
function shopperCookie(req, res) {
  const match = (req.headers.cookie ?? '').match(/(?:^|;\s*)shopper=([a-f0-9]+)/);
  if (match) return match[1];

  const shopperId = randomBytes(16).toString('hex');
  res.cookie('shopper', shopperId, { httpOnly: true, sameSite: 'lax', maxAge: 365 * 24 * 60 * 60 * 1000 });
  return shopperId;
}
