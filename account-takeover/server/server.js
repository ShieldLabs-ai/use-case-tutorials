import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { getAccount, signIn, signOut } from './accounts.js';

initDb();

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// Sign in and store the session token in a cookie.
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const { token, ...result } = await signIn({ email, password });
  if (token) res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
  res.json(result);
});

// The signed-in account, if any.
app.get('/api/me', (req, res) => {
  res.json(getAccount(sessionToken(req)));
});

app.post('/api/logout', (req, res) => {
  signOut(sessionToken(req));
  res.clearCookie('session');
  res.json({ success: true, message: 'Signed out.' });
});

// Reset the demo database.
app.post('/api/reset-db', (_req, res) => {
  resetDb();
  res.json({ success: true, message: 'Demo database reset.' });
});

// Show server errors in the response, to make the tutorial easy to debug.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: `Server error: ${err.message}` });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

// Reads the session cookie without a cookie-parsing dependency.
function sessionToken(req) {
  const match = (req.headers.cookie ?? '').match(/(?:^|;\s*)session=([a-f0-9]+)/);
  return match ? match[1] : null;
}
