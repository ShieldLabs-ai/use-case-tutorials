import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { purchaseGiftCard, recentAttempts } from './orders.js';

initDb();

const app = Fastify();
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// Buy a gift card.
app.post('/api/purchase', async (request, reply) => {
  const { recipientEmail, amount, cardNumber, expiry, cvc } = request.body ?? {};
  return reply.send(await purchaseGiftCard({ recipientEmail, amount, cardNumber, expiry, cvc }));
});

// The latest payment attempts, shown under the form.
app.get('/api/attempts', async (_request, reply) => {
  return reply.send(recentAttempts());
});

// Reset the demo database.
app.post('/api/reset-db', async (_request, reply) => {
  resetDb();
  return reply.send({ success: true, message: 'Demo database reset.' });
});

// Show server errors in the response, to make the tutorial easy to debug.
app.setErrorHandler((error, _request, reply) => {
  console.error(error);
  reply.status(500).send({ success: false, message: `Server error: ${error.message}` });
});

const port = Number(process.env.PORT) || 3000;
await app.listen({ port });
console.log(`Server running at http://localhost:${port}`);
