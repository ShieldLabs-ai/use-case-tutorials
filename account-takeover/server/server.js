import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { getAccount, signIn, signOut } from './accounts.js';

initDb();

export const app = Fastify({ bodyLimit: 16_384 });
app.register(fastifyCookie);
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// Sign in and store the session token in a cookie.
app.post('/api/login', async (request, reply) => {
  const { email, password } = request.body ?? {};
  const { token, ...result } = await signIn({ email, password });
  if (token) reply.setCookie('session', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return reply.send(result);
});

// The signed-in account, if any.
app.get('/api/me', async (request, reply) => {
  return reply.send(getAccount(sessionToken(request)));
});

app.post('/api/logout', async (request, reply) => {
  signOut(sessionToken(request));
  reply.clearCookie('session', { path: '/' });
  return reply.send({ success: true, message: 'Signed out.' });
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

// Reads the session cookie without a cookie-parsing dependency.
function sessionToken(request) {
  const match = (request.headers.cookie ?? '').match(/(?:^|;\s*)session=([a-f0-9]+)/);
  return match ? match[1] : null;
}
