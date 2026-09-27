import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { EVENTS } from './events.js';
import { fileChargeback, getEvidence, listOrders, placeOrder } from './orders.js';

initDb();

const app = Fastify();
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// The shop.
app.get('/api/events', async (_request, reply) => {
  return reply.send(EVENTS);
});

app.post('/api/orders', async (request, reply) => {
  const { eventId, quantity, email, cardNumber } = request.body ?? {};
  return reply.send(await placeOrder({ eventId, quantity, email, cardNumber }));
});

// The admin page (admin.html). The demo has no admin login.
app.get('/api/orders', async (_request, reply) => {
  return reply.send(listOrders());
});

app.post('/api/orders/:id/chargeback', async (request, reply) => {
  return reply.send(fileChargeback(request.params.id));
});

app.get('/api/orders/:id/evidence', async (request, reply) => {
  return reply.send(await getEvidence(request.params.id));
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
