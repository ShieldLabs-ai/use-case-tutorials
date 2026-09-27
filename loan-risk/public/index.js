import { identifyOnFirstFocus } from './shieldlabs.js';

const form = document.getElementById('loanForm');
const button = document.getElementById('applyBtn');
const result = document.getElementById('result');

// Identify the application when the user starts filling in the form.
const identification = identifyOnFirstFocus(form);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const application = {
    firstName: form.elements.firstName.value.trim(),
    lastName: form.elements.lastName.value.trim(),
    monthlyIncome: form.elements.monthlyIncome.value,
    amount: form.elements.amount.value,
    termMonths: form.elements.termMonths.value,
  };

  setBusy(true);
  try {
    // The request ID of this application's identification. The server reads the result.
    application.requestId = await identification.take();
    const data = await postJson('/api/applications', application);
    showResult(data.success ? 'success' : 'error', data.message);
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
});

// --- Helpers ---

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
  button.textContent = busy ? 'Checking your offer...' : 'Check my offer';
}
