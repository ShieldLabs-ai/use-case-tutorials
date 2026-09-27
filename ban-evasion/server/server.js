import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { banUser, createPost, getBoard, signIn, signOut, signUp } from './forum.js';

initDb();

const app = Fastify();
app.register(fastifyCookie);
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

// The board: posts, members and the signed-in member.
app.get('/api/board', async (request, reply) => {
  return reply.send(getBoard(sessionToken(request)));
});

// Create an account, or sign in to an existing one.
app.post('/api/signup', async (request, reply) => {
  const { username, password } = request.body ?? {};
  return sendWithSession(reply, await signUp({ username, password }));
});

app.post('/api/signin', async (request, reply) => {
  const { username, password } = request.body ?? {};
  return sendWithSession(reply, await signIn({ username, password }));
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
