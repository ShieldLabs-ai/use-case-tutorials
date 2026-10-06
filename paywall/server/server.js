import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { listArticles, readArticle } from './articles.js';

initDb();

export const app = Fastify({ bodyLimit: 16_384 });
app.register(fastifyCookie);
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

app.get('/api/articles', async (_request, reply) => {
  return reply.send(listArticles());
});

// Open an article. The free-article meter follows a cookie in this browser.
app.post('/api/articles/:id/read', async (request, reply) => {
  return reply.send(await readArticle({ articleId: request.params.id, meterId: meterCookie(request, reply) }));
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

// Reads the reader's meter cookie, or sets a new one.
function meterCookie(request, reply) {
  const match = (request.headers.cookie ?? '').match(/(?:^|;\s*)meter=([a-f0-9]+)/);
  if (match) return match[1];

  const meterId = randomBytes(16).toString('hex');
  reply.setCookie('meter', meterId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 365 * 24 * 60 * 60 });
  return meterId;
}
