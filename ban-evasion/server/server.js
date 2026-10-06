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
import { banUser, createPost, getBoard, signIn, signOut, signUp } from './forum.js';

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

// The board: posts, members and the signed-in member.
app.get('/api/board', async (request, reply) => {
  return reply.send(getBoard(sessionToken(request)));
});

// Create an account, or sign in to an existing one.
app.post('/api/signup', async (request, reply) => {
  const { username, password, requestId } = request.body ?? {};
  return sendWithSession(reply, await signUp({ username, password, requestId }));
});

app.post('/api/signin', async (request, reply) => {
  const { username, password, requestId } = request.body ?? {};
  return sendWithSession(reply, await signIn({ username, password, requestId }));
});

app.post('/api/signout', async (request, reply) => {
  signOut(sessionToken(request));
  reply.clearCookie('session', { path: '/' });
  return reply.send({ success: true, message: 'Signed out.' });
});

app.post('/api/posts', async (request, reply) => {
  return reply.send(createPost(sessionToken(request), request.body?.body));
});

// Moderator tools. The demo has no moderator login: anyone can ban.
app.post('/api/members/:username/ban', async (request, reply) => {
  return reply.send(banUser(request.params.username));
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

// --- Helpers ---

function sendWithSession(reply, { token, ...result }) {
  if (token) reply.setCookie('session', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return reply.send(result);
}

// Reads the session cookie without a cookie-parsing dependency.
function sessionToken(request) {
  const match = (request.headers.cookie ?? '').match(/(?:^|;\s*)session=([a-f0-9]+)/);
  return match ? match[1] : null;
}
