import 'dotenv/config';
import Fastify from 'fastify';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { resetVerificationState } from './shieldlabs.js';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { deviceForSession, startDeviceSession } from './sessions.js';
import { getProfile, search, toggleSaved } from './store.js';

initDb();

export const app = Fastify({ bodyLimit: 16_384 });
app.register(fastifyCookie);
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

const require = createRequire(import.meta.url);
const bundle = join(dirname(require.resolve('@shieldlabs-ai/js/package.json')), 'dist/shieldlabs.iife.js');
app.get('/vendor/shieldlabs.js', async (_request, reply) => reply.type('application/javascript').send(await readFile(bundle)));

// Expose only the Public Key to the browser. The Private API Key stays on the server.
app.get('/config.js', async (_request, reply) => {
  reply.header('cache-control', 'no-store').type('application/javascript');
  return reply.send(`window.SHIELDLABS_PUBLIC_KEY = ${JSON.stringify(process.env.SHIELDLABS_PUBLIC_KEY ?? '')};`);
});

// Identify a browser that has no session yet. Its Device ID is the shopper.
app.post('/api/session', async (request, reply) => {
  const { token, deviceId, ...result } = await startDeviceSession(request.body?.requestId);
  if (!token) return reply.send(result);

  reply.setCookie('device_session', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  const profile = getProfile(deviceId);
  const returning = profile.recentSearches.length > 0 || profile.saved.length > 0;
  return reply.send({ ...result, returning, profile: { identified: true, ...profile } });
});

// The shopper's recent searches and saved items.
app.get('/api/profile', async (request, reply) => {
  const shopperId = shopperFor(request);
  if (!shopperId) return reply.send({ identified: false, recentSearches: [], saved: [] });
  return reply.send({ identified: true, ...getProfile(shopperId) });
});

// Searching works for everyone. Only an identified browser's searches are remembered.
app.get('/api/search', async (request, reply) => {
  return reply.send(search(shopperFor(request), request.query.q));
});

app.post('/api/saved', async (request, reply) => {
  const shopperId = shopperFor(request);
  if (!shopperId) return reply.send({ success: false, message: 'Not saved: you could not be verified.' });
  return reply.send(toggleSaved(shopperId, request.body?.productId));
});

// Reset the demo database.
app.post('/api/reset-db', async (_request, reply) => {
  if (process.env.DEMO_ALLOW_RESET !== '1') return reply.code(403).send({ success: false, message: 'Demo reset is disabled.' });
  resetVerificationState();
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

// The shopper behind a request: the Device ID of the browser's session, or null.
function shopperFor(request) {
  const match = (request.headers.cookie ?? '').match(/(?:^|;\s*)device_session=([a-f0-9]+)/);
  return deviceForSession(match ? match[1] : null);
}
