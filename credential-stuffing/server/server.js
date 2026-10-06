import 'dotenv/config';
import Fastify from 'fastify';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { resetVerificationState } from './shieldlabs.js';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { signIn, verifyCode } from './accounts.js';

initDb();

export const app = Fastify({ bodyLimit: 16_384 });
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

const require = createRequire(import.meta.url);
const bundle = join(dirname(require.resolve('@shieldlabs-ai/js/package.json')), 'dist/shieldlabs.iife.js');
app.get('/vendor/shieldlabs.js', async (_request, reply) => reply.type('application/javascript').send(await readFile(bundle)));

// Expose only the Public Key to the browser. The Private API Key stays on the server.
app.get('/config.js', async (_request, reply) => {
  reply.header('cache-control', 'no-store').type('application/javascript');
  return reply.send(`window.SHIELDLABS_PUBLIC_KEY = ${JSON.stringify(process.env.SHIELDLABS_PUBLIC_KEY ?? '')};`);
});

// Sign in.
app.post('/api/login', async (request, reply) => {
  const { email, password, requestId } = request.body ?? {};
  return reply.send(await signIn({ email, password, requestId }));
});

// Finish a sign-in from a new device with the one-time code.
app.post('/api/verify-code', async (request, reply) => {
  const { challengeId, code } = request.body ?? {};
  return reply.send(await verifyCode({ challengeId, code }));
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
