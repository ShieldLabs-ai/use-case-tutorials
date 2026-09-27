import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { purchaseGiftCard, recentAttempts } from './orders.js';

initDb();

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// Buy a gift card.
app.post('/api/purchase', async (req, res) => {
  const { recipientEmail, amount, cardNumber, expiry, cvc } = req.body ?? {};
  res.json(await purchaseGiftCard({ recipientEmail, amount, cardNumber, expiry, cvc }));
});

// The latest payment attempts, shown under the form.
app.get('/api/attempts', (_req, res) => {
  res.json(recentAttempts());
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
