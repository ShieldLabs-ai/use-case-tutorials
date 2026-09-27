const form = document.getElementById('orderForm');
const button = document.getElementById('buyBtn');
const result = document.getElementById('result');

await renderEvents();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const order = {
    eventId: form.elements.eventId.value,
    quantity: form.elements.quantity.value,
    email: form.elements.email.value.trim(),
    cardNumber: form.elements.cardNumber.value,
  };

  setBusy(true);
  try {
    const data = await postJson('/api/orders', order);
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

async function renderEvents() {
  const events = await (await fetch('/api/events')).json();
  const options = events.map((item, index) => {
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'eventId';
    radio.value = item.id;
    radio.checked = index === 0;

    const text = el('span', 'flex-1 text-sm');
    text.append(el('span', 'block font-medium', item.name), el('span', 'block text-slate-500', `${item.date}, ${item.venue}`));

    const label = el('label', 'flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50');
    label.append(radio, text, el('span', 'text-sm font-medium', `$${item.price}`));
    return label;
  });
  document.getElementById('events').replaceChildren(...options);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
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
  button.textContent = busy ? 'Placing your order...' : 'Buy tickets';
}
