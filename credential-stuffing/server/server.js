import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { signIn, verifyCode } from './accounts.js';

initDb();

const app = Fastify();
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// Expose only the Public Key to the browser. The Private API Key stays on the server.
app.get('/config.js', async (_request, reply) => {
  reply.type('application/javascript');
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
