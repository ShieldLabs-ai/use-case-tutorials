import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { checkout, getCart } from './orders.js';

initDb();

const app = Fastify();
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

app.get('/api/cart', async (_request, reply) => {
  return reply.send(getCart());
});

// Place an order. New customers get 20% off automatically.
app.post('/api/checkout', async (request, reply) => {
  const { email } = request.body ?? {};
  return reply.send(await checkout({ email }));
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
