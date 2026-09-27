import { identifyOnFirstFocus } from './shieldlabs.js';

const form = document.getElementById('checkoutForm');
const button = document.getElementById('buyBtn');
const result = document.getElementById('result');

// Identify the checkout when the user starts filling in the form.
const identification = identifyOnFirstFocus(form);

await loadAttempts();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const order = {
    amount: form.elements.amount.value,
    recipientEmail: form.elements.recipientEmail.value.trim(),
    cardNumber: form.elements.cardNumber.value,
    expiry: form.elements.expiry.value,
    cvc: form.elements.cvc.value,
  };

  setBusy(true);
  try {
    // The request ID of this checkout's identification. The server reads the result.
    order.requestId = await identification.take();
    const data = await postJson('/api/purchase', order);
    showResult(data.success ? 'success' : 'error', data.message);
    await loadAttempts();
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  const data = await postJson('/api/reset-db');
  showResult('success', data.message);
  await loadAttempts();
});

// --- Helpers ---

async function loadAttempts() {
  const attempts = await (await fetch('/api/attempts')).json();
  const list = document.getElementById('attempts');
  if (attempts.length === 0) {
    list.replaceChildren(row('No payment attempts yet.', '', 'text-slate-500'));
    return;
  }
  list.replaceChildren(
    ...attempts.map((attempt) =>
      row(
        `$${attempt.amount} with card ending ${attempt.card_last4}`,
        attempt.status,
        attempt.status === 'approved' ? 'text-emerald-700' : 'text-red-700',
      ),
    ),
  );
}

function row(label, status, statusClass) {
  const item = document.createElement('li');
  item.className = 'flex justify-between px-4 py-2';
  const text = document.createElement('span');
  text.textContent = label;
  const badge = document.createElement('span');
  badge.className = `font-medium ${statusClass}`;
  badge.textContent = status;
  item.append(text, badge);
  return item;
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
  button.disabled = busy;
  button.textContent = busy ? 'Processing payment...' : 'Buy gift card';
}
