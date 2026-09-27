import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { activateRegionalPrice, getPricing } from './pricing.js';

initDb();

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// The list price and the countries with their discount.
app.get('/api/pricing', (_req, res) => {
  res.json(getPricing());
});

// Apply the regional price for a country.
app.post('/api/regional-price', async (req, res) => {
  const { country } = req.body ?? {};
  res.json(await activateRegionalPrice({ country }));
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
