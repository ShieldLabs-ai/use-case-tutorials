import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { getSession, signUp, endSession } from './accounts.js';

initDb();

const app = Fastify();
app.register(fastifyCookie);
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// Create an account and, if a referral code was entered, credit the reward.
app.post('/api/signup', async (request, reply) => {
  const { email, referralCode } = request.body ?? {};
  const result = await signUp({ email, referralCode });
  if (result.success) {
    reply.setCookie('session', result.token, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  return reply.send({
    success: result.success,
    referralCode: result.referralCode,
    creditCents: result.creditCents,
    message: result.message,
  });
});

// The signed-in account behind this browser's session.
app.get('/api/me', async (request, reply) => {
  return reply.send(getSession(sessionToken(request)));
});

app.post('/api/logout', async (request, reply) => {
  endSession(sessionToken(request));
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
