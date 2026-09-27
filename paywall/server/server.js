import 'dotenv/config';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { listArticles, readArticle } from './articles.js';

initDb();

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

app.get('/api/articles', (_req, res) => {
  res.json(listArticles());
});

// Open an article. The free-article meter follows a cookie in this browser.
app.post('/api/articles/:id/read', async (req, res) => {
  res.json(await readArticle({ articleId: req.params.id, meterId: meterCookie(req, res) }));
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

// Reads the reader's meter cookie, or sets a new one.
function meterCookie(req, res) {
  const match = (req.headers.cookie ?? '').match(/(?:^|;\s*)meter=([a-f0-9]+)/);
  if (match) return match[1];

  const meterId = randomBytes(16).toString('hex');
  res.cookie('meter', meterId, { httpOnly: true, sameSite: 'lax', maxAge: 365 * 24 * 60 * 60 * 1000 });
  return meterId;
}
