import { checkSignedInUser, identifyOnFirstFocus } from './shieldlabs.js';

const signupForm = document.getElementById('signupForm');
const depositForm = document.getElementById('depositForm');
const signupBtn = document.getElementById('signupBtn');
const depositBtn = document.getElementById('depositBtn');
const signedOutView = document.getElementById('signedOutView');
const signedInView = document.getElementById('signedInView');
const result = document.getElementById('result');

// Identify the signup and the deposit when the user starts filling in each form.
const signupIdentification = identifyOnFirstFocus(signupForm);
const depositIdentification = identifyOnFirstFocus(depositForm);

// Show the view that matches this browser's session.
await refreshAccount();

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = signupForm.elements.email.value.trim();
  const password = signupForm.elements.password.value;

  setSignupBusy(true);
  try {
    // The request ID of this signup's identification. The server reads the result.
    const requestId = await signupIdentification.take();
    const data = await postJson('/api/signup', { email, password, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    if (data.success) {
      signupForm.reset();
      await refreshAccount();
    }
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setSignupBusy(false);
  }
});

depositForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const amountCents = Math.round(Number(depositForm.elements.amount.value) * 100);

  setDepositBusy(true);
  try {
    // The request ID of this deposit's identification. The server reads the result.
    const requestId = await depositIdentification.take();
    const data = await postJson('/api/deposit', { amountCents, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    if (data.success) {
      depositForm.reset();
      await refreshAccount();
    }
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setDepositBusy(false);
  }
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

  // Tie this signed-in page to the account, with its hashed id.
  checkSignedInUser(account.userHid);
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

function setSignupBusy(busy) {
  signupBtn.disabled = busy;
  signupBtn.textContent = busy ? 'Creating account...' : 'Create account';
}

function setDepositBusy(busy) {
  depositBtn.disabled = busy;
  depositBtn.textContent = busy ? 'Depositing...' : 'Deposit';
}
