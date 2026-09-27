const form = document.getElementById('surveyForm');
const button = document.getElementById('submitBtn');
const result = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submission = {
    email: form.elements.email.value.trim(),
    answers: {
      cooking: form.elements.cooking.value,
      nextAppliance: form.elements.nextAppliance.value,
      groceries: form.elements.groceries.value,
    },
  };

  setBusy(true);
  try {
    const data = await postJson('/api/survey', submission);
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
  button.textContent = busy ? 'Submitting...' : 'Submit and get $5';
}
