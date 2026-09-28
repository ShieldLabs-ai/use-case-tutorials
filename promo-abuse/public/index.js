import { identifyOnFirstFocus } from './shieldlabs.js';

const form = document.getElementById('checkoutForm');
const button = document.getElementById('checkoutBtn');
const result = document.getElementById('result');

// Identify the order when the shopper starts filling in the form.
const identification = identifyOnFirstFocus(form);

const cart = await (await fetch('/api/cart')).json();
renderCart();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = form.elements.email.value.trim();

  setBusy(true);
  try {
    // The request ID of this order's identification. The server reads the result.
    const requestId = await identification.take();
    const data = await postJson('/api/checkout', { email, requestId });
    showResult(data.success ? 'success' : 'error', data.message);
    renderTotals(data.success ? data : null);
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
  renderTotals(null);
});

// --- Helpers ---

function renderCart() {
  const items = cart.items.map((item) => {
    const row = document.createElement('li');
    row.className = 'flex justify-between py-2';
    const name = document.createElement('span');
    name.textContent = item.name;
    const price = document.createElement('span');
    price.textContent = money(item.price);
    row.append(name, price);
    return row;
  });
  document.getElementById('items').replaceChildren(...items);
  document.getElementById('firstOrderBanner').classList.toggle('hidden', !cart.firstOrderEligible);
  renderTotals(null);
}

function renderTotals(order) {
  document.getElementById('subtotal').textContent = money(cart.subtotal);
  document.getElementById('discountRow').classList.toggle('hidden', !order?.discount);
  document.getElementById('discount').textContent = order?.discount ? `-${money(order.discount)}` : '';
  document.getElementById('total').textContent = money(order ? order.total : cart.subtotal);
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
  button.textContent = busy ? 'Placing order...' : 'Checkout';
}
