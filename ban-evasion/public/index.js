import { identifyOnFirstFocus } from './shieldlabs.js';

const accountForm = document.getElementById('accountForm');
const postForm = document.getElementById('postForm');
const result = document.getElementById('result');

// Identify the signup or sign-in when the user starts filling in the form.
const identification = identifyOnFirstFocus(accountForm);

await loadBoard();

// One form, two buttons: "Sign up" creates an account, "Sign in" uses an existing one.
accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const action = event.submitter?.value === 'signin' ? 'signin' : 'signup';
  const username = accountForm.elements.username.value.trim();
  const password = accountForm.elements.password.value;

  setBusy(true);
  try {
    // The request ID of this identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson(`/api/${action}`, { username, password, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    if (data.success) accountForm.reset();
    await loadBoard();
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
});

postForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = await postJson('/api/posts', { body: postForm.elements.body.value });
  showResult(data.success ? 'success' : 'error', data.message);
  if (data.success) postForm.reset();
  await loadBoard();
});

document.getElementById('signoutBtn').addEventListener('click', async () => {
  const data = await postJson('/api/signout');
  showResult('success', data.message);
  await loadBoard();
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  await postJson('/api/reset-db');
  location.reload();
});

// --- Rendering ---

async function loadBoard() {
  const board = await (await fetch('/api/board')).json();
  const signedIn = Boolean(board.username);

  accountForm.classList.toggle('hidden', signedIn);
  postForm.classList.toggle('hidden', !signedIn);
  document.getElementById('signedIn').classList.toggle('hidden', !signedIn);
  document.getElementById('currentUser').textContent = board.username ?? '';

  document.getElementById('posts').replaceChildren(...board.posts.map(renderPost));
  document.getElementById('members').replaceChildren(...board.members.map(renderMember));
}

function renderPost(post) {
  const item = el('li', 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm');
  const meta = el('p', 'text-xs text-slate-500', `${post.username}, ${timeAgo(post.created_at)}`);
  if (post.banned) meta.append(el('span', 'ml-2 rounded bg-red-100 px-1.5 py-0.5 text-red-700', 'banned'));
  item.append(meta, el('p', 'mt-1 text-sm', post.body));
  return item;
}

function renderMember(member) {
  const item = el('li', 'flex items-center justify-between gap-2 py-2');
  item.append(el('span', '', `${member.username} (${plural(member.posts, 'post')}, ${plural(member.devices, 'device')})`));

  if (member.banned) {
    item.append(el('span', 'text-xs font-medium text-red-700', 'Banned'));
  } else {
    const button = el('button', 'rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50', 'Ban');
    button.type = 'button';
    button.addEventListener('click', async () => {
      const data = await postJson(`/api/members/${encodeURIComponent(member.username)}/ban`);
      showResult(data.success ? 'success' : 'error', data.message);
      await loadBoard();
    });
    item.append(button);
  }
  return item;
}

// --- Helpers ---

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function timeAgo(timestamp) {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

async function postJson(url, body = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

function showResult(type, message) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    error: 'bg-red-50 text-red-800 ring-red-200',
  };
  result.className = `rounded-md p-3 text-sm ring-1 ${styles[type]}`;
  result.textContent = message;
}

function setBusy(busy) {
  for (const button of accountForm.querySelectorAll('button')) button.disabled = busy;
}
