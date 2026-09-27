import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { sendCode, verifyCode } from './sms.js';

initDb();

const app = Fastify();
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// Expose only the Public Key to the browser. The Private API Key stays on the server.
app.get('/config.js', async (_request, reply) => {
  reply.type('application/javascript');
  return reply.send(`window.SHIELDLABS_PUBLIC_KEY = ${JSON.stringify(process.env.SHIELDLABS_PUBLIC_KEY ?? '')};`);
});

// Send a verification code to a phone number.
app.post('/api/send-code', async (request, reply) => {
  const { phone, requestId } = request.body ?? {};
  return reply.send(await sendCode({ phone, requestId }));
});

app.post('/api/verify-code', async (request, reply) => {
  const { phone, code } = request.body ?? {};
  return reply.send(await verifyCode({ phone, code }));
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
