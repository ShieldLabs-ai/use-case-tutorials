import { identifyOnFirstFocus } from './shieldlabs.js';

const form = document.getElementById('regionForm');
const button = document.getElementById('activateBtn');
const result = document.getElementById('result');

// Identify the request when the shopper starts picking a country.
const identification = identifyOnFirstFocus(form);

const pricing = await (await fetch('/api/pricing')).json();
renderCountries();
renderTotals(pricing.listPrice);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const country = form.elements.country.value;

  setBusy(true);
  try {
    // The request ID of this request's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/regional-price', { country, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    renderTotals(data.success ? data.price : pricing.listPrice);
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
  renderTotals(pricing.listPrice);
});

// --- Helpers ---

// Lists the countries and preselects the one from the browser's language settings.
function renderCountries() {
  const guess = new Intl.Locale(navigator.language).maximize().region;
  const options = pricing.countries.map((country) => {
    const option = document.createElement('option');
    option.value = country.code;
    option.textContent = country.name;
    option.selected = country.code === guess;
    return option;
  });
  form.elements.country.replaceChildren(...options);
}

function renderTotals(price) {
  const discount = pricing.listPrice - price;
  document.getElementById('listPrice').textContent = money(pricing.listPrice);
  document.getElementById('subtotal').textContent = money(pricing.listPrice);
  document.getElementById('discountRow').classList.toggle('hidden', discount <= 0);
  document.getElementById('discount').textContent = `-${money(discount)}`;
  document.getElementById('total').textContent = money(price);
}

function money(amount) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
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
  button.textContent = busy ? 'Checking your region...' : 'Activate regional pricing';
}
