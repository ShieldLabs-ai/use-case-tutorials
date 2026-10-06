import { checkSignedInUser, identifyOnFirstFocus } from './shieldlabs.js';

const loginForm = document.getElementById('loginForm');
const codeForm = document.getElementById('codeForm');
const loginBtn = document.getElementById('loginBtn');
const signedOutView = document.getElementById('signedOutView');
const signedInView = document.getElementById('signedInView');
const result = document.getElementById('result');

// Identify the sign-in when the user starts filling in the form.
const identification = identifyOnFirstFocus(loginForm);
let challengeId = null;

// Show the view that matches this browser's session.
await refreshAccount();

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;

  setBusy(true);
  try {
    // The request ID of this sign-in's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/login', { email, password, requestId });
    showResult(data.success ? 'success' : data.stepUp ? 'info' : 'error', data.message);
    showCodeForm(data.stepUp ? data : null);
    if (data.success) await refreshAccount();
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
});

// The step-up check for a sign-in from a new device.
codeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = await postJson('/api/verify-code', { challengeId, code: codeForm.elements.code.value });
  showResult(data.success ? 'success' : 'error', data.message);
  if (!data.stepUp) showCodeForm(null);
  if (data.success) await refreshAccount();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  const data = await postJson('/api/logout');
  showResult('success', data.message);
  await refreshAccount();
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  await postJson('/api/reset-db');
  location.reload();
});

// --- Helpers ---

async function refreshAccount() {
  const account = await (await fetch('/api/me')).json();
  signedOutView.classList.toggle('hidden', account.signedIn);
  signedInView.classList.toggle('hidden', !account.signedIn);
  if (!account.signedIn) return;

  document.getElementById('accountEmail').textContent = account.email;
  document.getElementById('balance').textContent = account.balance.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  document.getElementById('knownDevices').replaceChildren(
    ...account.knownDevices.map((device) => {
      const item = document.createElement('li');
      item.className = 'py-2';
      const since = new Date(device.firstSeen).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      item.textContent = `Device ${device.device} from ${device.country ?? 'an unknown country'}, first seen ${since}`;
      return item;
    }),
  );

  // Tie this signed-in page to the account, with its hashed id.
  checkSignedInUser(account.userHid);
}

// Shows the code form for a step-up check, or hides it.
function showCodeForm(stepUp) {
  if (stepUp?.challengeId) {
    challengeId = stepUp.challengeId;
    document.getElementById('demoCode').textContent = stepUp.demoCode;
    codeForm.reset();
    // Demo-only: the simulator returns this code openly; no real email is sent.
    codeForm.elements.code.value = stepUp.demoCode;
  }
  codeForm.classList.toggle('hidden', !stepUp);
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
