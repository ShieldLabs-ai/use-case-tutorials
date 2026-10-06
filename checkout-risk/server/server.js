import 'dotenv/config';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { db, initDb, resetDb } from './db.js';

initDb();
export const app = Fastify({ bodyLimit: 16_384 });
app.register(fastifyStatic, { root: fileURLToPath(new URL('../public', import.meta.url)) });

app.post('/api/checkout', async (request, reply) => {
  const { email, requestId } = request.body ?? {};
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: 'Enter a synthetic email.' };
  let outcome = 'accepted';

  const { lastInsertRowid } = db.prepare('INSERT INTO orders (email,outcome) VALUES (?,?)').run(email,outcome);
  return { success: true, outcome, orderId: Number(lastInsertRowid), message: outcome==='review'?'Synthetic order held for review; no payment taken.':'Synthetic order recorded; no payment taken.' };
});
app.post('/api/reset-db', async (_request, reply) => {
  if (process.env.DEMO_ALLOW_RESET !== '1') return reply.code(403).send({ success: false, message: 'Demo reset disabled.' });
   resetDb(); return { success: true, message: 'Demo reset.' };
});
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '127.0.0.1' });
  console.log('Checkout tutorial: http://127.0.0.1:'+port);
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => app.close().catch(() => { process.exitCode=1; }));
}
