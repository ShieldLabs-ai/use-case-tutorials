import { identifyOnFirstFocus } from './shieldlabs.js';

const phoneForm = document.getElementById('phoneForm');
const codeForm = document.getElementById('codeForm');
const sendBtn = document.getElementById('sendBtn');
const result = document.getElementById('result');

// Identify every code request, resends included, from the first focus on the form.
const identification = identifyOnFirstFocus(phoneForm);

phoneForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const phone = phoneForm.elements.phone.value.trim();

  setBusy(true);
  try {
    // The request ID of this request's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/send-code', { phone, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    if (data.success) {
      // Stands in for the SMS arriving on the user's phone.
      document.getElementById('smsCode').textContent = data.demoCode;
      // Demo-only code returned by our local simulator, not a real SMS secret.
      codeForm.elements.code.value = data.demoCode;
      document.getElementById('smsBox').classList.remove('hidden');
      codeForm.classList.remove('hidden');
    }
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
});

codeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = await postJson('/api/verify-code', {
    phone: phoneForm.elements.phone.value.trim(),
    code: codeForm.elements.code.value,
  });
  showResult(data.success ? 'success' : 'error', data.message);
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  await postJson('/api/reset-db');
  location.reload();
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
  sendBtn.disabled = busy;
  sendBtn.textContent = busy ? 'Sending...' : 'Send code';
}
