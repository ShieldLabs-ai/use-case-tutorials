const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const signedOutView = document.getElementById('signedOutView');
const signedInView = document.getElementById('signedInView');
const result = document.getElementById('result');

// Show the view that matches this browser's session.
await refreshAccount();

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;

  setBusy(true);
  try {
    const data = await postJson('/api/login', { email, password });
    showResult(data.success ? 'success' : 'error', data.message);
    if (data.success) await refreshAccount();
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
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
  loginBtn.textContent = busy ? 'Signing in...' : 'Sign in';
}
