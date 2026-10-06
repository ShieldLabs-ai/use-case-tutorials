import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { getProfile, search, toggleSaved } from './store.js';

initDb();

export const app = Fastify({ bodyLimit: 16_384 });
app.register(fastifyCookie);
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// The shopper's recent searches and saved items.
app.get('/api/profile', async (request, reply) => {
  return reply.send(getProfile(shopperCookie(request, reply)));
});

app.get('/api/search', async (request, reply) => {
  return reply.send(search(shopperCookie(request, reply), request.query.q));
});

app.post('/api/saved', async (request, reply) => {
  return reply.send(toggleSaved(shopperCookie(request, reply), request.body?.productId));
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

// Recognizes a returning shopper by a cookie, or sets a new one.
function shopperCookie(request, reply) {
  const match = (request.headers.cookie ?? '').match(/(?:^|;\s*)shopper=([a-f0-9]+)/);
  if (match) return match[1];

  const shopperId = randomBytes(16).toString('hex');
  reply.setCookie('shopper', shopperId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 365 * 24 * 60 * 60 });
  return shopperId;
}
