import { checkSignedInUser, identifyOnFirstFocus } from './shieldlabs.js';

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const takeOverBtn = document.getElementById('takeOverBtn');
const signedOutView = document.getElementById('signedOutView');
const signedInView = document.getElementById('signedInView');
const accountEmail = document.getElementById('accountEmail');
const result = document.getElementById('result');

// Identify the sign-in when the user starts filling in the form.
const identification = identifyOnFirstFocus(loginForm);
let sessionWatch = null;

// Show the view that matches this browser's session.
render(await getJson('/api/session'));

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  signIn({ signOutOtherDevice: false });
});

// Shown when the account is signed in on another device.
takeOverBtn.addEventListener('click', () => signIn({ signOutOtherDevice: true }));

async function signIn({ signOutOtherDevice }) {
  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;

  setBusy(true);
  try {
    // The request ID of this sign-in's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/login', { email, password, requestId, signOutOtherDevice });
    showResult(data.success ? 'success' : 'error', data.message);
    takeOverBtn.classList.toggle('hidden', !data.otherDevice);
    if (data.success) render(await getJson('/api/session'));
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  const data = await postJson('/api/logout');
  showResult('success', data.message);
  render({ signedIn: false });
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  await postJson('/api/reset-db');
  location.reload();
});

// --- Helpers ---

function render(session) {
  signedOutView.classList.toggle('hidden', session.signedIn);
  signedInView.classList.toggle('hidden', !session.signedIn);
  accountEmail.textContent = session.signedIn ? session.email : '';

  clearInterval(sessionWatch);
  if (session.signedOutElsewhere) {
    showResult('error', 'You were signed out: this account signed in on another device.');
  }
  if (!session.signedIn) return;

  // Tie this signed-in page to the account, with its hashed id.
  checkSignedInUser(session.userHid);
  // Check every few seconds whether another device signed this one out.
  sessionWatch = setInterval(async () => {
    const current = await getJson('/api/session');
    if (!current.signedIn) render(current);
  }, 5000);
}

async function getJson(url) {
  const response = await fetch(url);
  return response.json();
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
  result.className = `mt-4 rounded-md p-3 text-sm ring-1 ${styles[type]}`;
  result.textContent = message;
}

function setBusy(busy) {
  loginBtn.disabled = busy;
  takeOverBtn.disabled = busy;
  loginBtn.textContent = busy ? 'Signing in...' : 'Sign in';
}
