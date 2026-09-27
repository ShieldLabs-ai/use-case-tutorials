import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { initDb, resetDb } from './db.js';
import { banUser, createPost, getBoard, signIn, signOut, signUp } from './forum.js';

initDb();

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// The board: posts, members and the signed-in member.
app.get('/api/board', (req, res) => {
  res.json(getBoard(sessionToken(req)));
});

// Create an account, or sign in to an existing one.
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body ?? {};
  sendWithSession(res, await signUp({ username, password }));
});

app.post('/api/signin', async (req, res) => {
  const { username, password } = req.body ?? {};
  sendWithSession(res, await signIn({ username, password }));
});

app.post('/api/signout', (req, res) => {
  signOut(sessionToken(req));
  res.clearCookie('session');
  res.json({ success: true, message: 'Signed out.' });
});

app.post('/api/posts', (req, res) => {
  res.json(createPost(sessionToken(req), req.body?.body));
});

// Moderator tools. The demo has no moderator login: anyone can ban.
app.post('/api/members/:username/ban', (req, res) => {
  res.json(banUser(req.params.username));
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

// --- Helpers ---

function sendWithSession(res, { token, ...result }) {
  if (token) res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
  res.json(result);
}

// Reads the session cookie without a cookie-parsing dependency.
function sessionToken(req) {
  const match = (req.headers.cookie ?? '').match(/(?:^|;\s*)session=([a-f0-9]+)/);
  return match ? match[1] : null;
}
