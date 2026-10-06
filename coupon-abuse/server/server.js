import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { applyCoupon, getCart } from './coupons.js';

initDb();

export const app = Fastify({ bodyLimit: 16_384 });
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

app.get('/api/cart', async (_request, reply) => {
  return reply.send(getCart());
});

// Apply a coupon code to the cart.
app.post('/api/coupons/apply', async (request, reply) => {
  const { code } = request.body ?? {};
  return reply.send(await applyCoupon({ code }));
});

// Reset the demo database.
app.post('/api/reset-db', async (_request, reply) => {
  if (process.env.DEMO_ALLOW_RESET !== '1') return reply.code(403).send({ success: false, message: 'Demo reset is disabled.' });
  resetDb();
  return reply.send({ success: true, message: 'Demo database reset.' });
});

// Show server errors in the response, to make the tutorial easy to debug.
app.setErrorHandler((error, _request, reply) => {
  console.warn('Demo request failed:', error.name);
  reply.status(500).send({ success: false, message: 'The demo request could not be completed.' });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '127.0.0.1' });
  console.log(`Server running at http://127.0.0.1:${port}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => app.close().catch(() => { process.exitCode = 1; }));
}
