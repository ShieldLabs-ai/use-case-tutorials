import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { EVENTS } from './events.js';
import { fileChargeback, getEvidence, listOrders, placeOrder } from './orders.js';

initDb();

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// The shop.
app.get('/api/events', (_req, res) => {
  res.json(EVENTS);
});

app.post('/api/orders', async (req, res) => {
  const { eventId, quantity, email, cardNumber } = req.body ?? {};
  res.json(await placeOrder({ eventId, quantity, email, cardNumber }));
});

// The admin page (admin.html). The demo has no admin login.
app.get('/api/orders', (_req, res) => {
  res.json(listOrders());
});

app.post('/api/orders/:id/chargeback', (req, res) => {
  res.json(fileChargeback(req.params.id));
});

app.get('/api/orders/:id/evidence', async (req, res) => {
  res.json(await getEvidence(req.params.id));
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
