import { identifyOnFirstFocus } from './shieldlabs.js';

const form = document.getElementById('claimForm');
const button = document.getElementById('claimBtn');
const result = document.getElementById('result');
const claimCount = document.getElementById('claimCount');

// Identify the claim when the user starts filling in the form.
const identification = identifyOnFirstFocus(form);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const walletAddress = form.elements.walletAddress.value.trim();

  setBusy(true);
  try {
    // The request ID of this claim's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/claim', { walletAddress, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    refreshCount();
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
  refreshCount();
});

refreshCount();

// --- Helpers ---

async function postJson(url, body = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function refreshCount() {
  const response = await fetch('/api/claims');
  const { count } = await response.json();
  claimCount.textContent = `${count.toLocaleString('en-US')} wallets claimed so far`;
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
  button.textContent = busy ? 'Claiming...' : 'Claim 100 ACME';
}
