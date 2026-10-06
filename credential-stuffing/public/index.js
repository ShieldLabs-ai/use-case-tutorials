import { identifyOnFirstFocus } from './shieldlabs.js';

const loginForm = document.getElementById('loginForm');
const codeForm = document.getElementById('codeForm');
const loginBtn = document.getElementById('loginBtn');
const result = document.getElementById('result');

// Identify the sign-in attempt when the user starts filling in the form.
const identification = identifyOnFirstFocus(loginForm);
let challengeId = null;

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;

  setBusy(true);
  try {
    // The request ID of this attempt's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/login', { email, password, requestId });
    showResult(data.success ? 'success' : data.challenge ? 'info' : 'error', data.message);
    showCodeForm(data.challenge ? data : null);
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
});

// The one-time code for a sign-in from a new device.
codeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = await postJson('/api/verify-code', { challengeId, code: codeForm.elements.code.value });
  showResult(data.success ? 'success' : 'error', data.message);
  if (!data.challenge) showCodeForm(null);
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  const data = await postJson('/api/reset-db');
  showResult('success', data.message);
  showCodeForm(null);
});

// --- Helpers ---

// Shows the code form for a sign-in from a new device, or hides it.
function showCodeForm(challenge) {
  if (challenge?.challengeId) {
    challengeId = challenge.challengeId;
    document.getElementById('demoCode').textContent = challenge.demoCode;
    codeForm.reset();
    // Demo-only: the simulator returns this code openly; no real email is sent.
    codeForm.elements.code.value = challenge.demoCode;
  }
  codeForm.classList.toggle('hidden', !challenge);
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
    info: 'bg-amber-50 text-amber-900 ring-amber-200',
  };
  result.className = `mt-4 rounded-md p-3 text-sm ring-1 ${styles[type]}`;
  result.textContent = message;
}

function setBusy(busy) {
  loginBtn.disabled = busy;
  loginBtn.textContent = busy ? 'Signing in...' : 'Sign in';
}
