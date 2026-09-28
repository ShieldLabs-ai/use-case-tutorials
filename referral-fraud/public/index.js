import { identifyOnFirstFocus } from './shieldlabs.js';

const signupForm = document.getElementById('signupForm');
const signupBtn = document.getElementById('signupBtn');
const signedOutView = document.getElementById('signedOutView');
const signedInView = document.getElementById('signedInView');
const accountEmail = document.getElementById('accountEmail');
const referralCodeDisplay = document.getElementById('referralCodeDisplay');
const creditBalance = document.getElementById('creditBalance');
const result = document.getElementById('result');

// Identify the signup when the user starts filling in the form.
const identification = identifyOnFirstFocus(signupForm);

// Show the view that matches this browser's session.
render(await getJson('/api/me'));

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = signupForm.elements.email.value.trim();
  const referralCode = signupForm.elements.referralCode.value.trim();

  setBusy(true);
  try {
    // The request ID of this signup's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/signup', { email, referralCode, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    if (data.success) render(await getJson('/api/me'));
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await postJson('/api/logout');
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
  if (!session.signedIn) return;
  accountEmail.textContent = session.email;
  referralCodeDisplay.textContent = session.referralCode;
  creditBalance.textContent = formatCents(session.creditCents);
}

function formatCents(cents) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
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
  signupBtn.disabled = busy;
  signupBtn.textContent = busy ? 'Creating account...' : 'Create account';
}
