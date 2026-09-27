import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { getSession, signIn, signOut } from './accounts.js';

initDb();

const app = Fastify();
app.register(fastifyCookie);
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// Sign in and store the session token in a cookie.
app.post('/api/login', async (request, reply) => {
  const { email, password } = request.body ?? {};
  const result = await signIn({ email, password });
  if (result.success) {
    reply.setCookie('session', result.token, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  return reply.send({ success: result.success, email: result.email, message: result.message });
});

// The state of this browser's session.
app.get('/api/session', async (request, reply) => {
  return reply.send(getSession(sessionToken(request)));
});

app.post('/api/logout', async (request, reply) => {
  signOut(sessionToken(request));
  reply.clearCookie('session', { path: '/' });
  return reply.send({ success: true, message: 'Signed out.' });
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

// Reads the session cookie without a cookie-parsing dependency.
function sessionToken(request) {
  const match = (request.headers.cookie ?? '').match(/(?:^|;\s*)session=([a-f0-9]+)/);
  return match ? match[1] : null;
}
