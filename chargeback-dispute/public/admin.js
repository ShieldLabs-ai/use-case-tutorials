const result = document.getElementById('result');
const evidencePanel = document.getElementById('evidence');

await loadOrders();

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  await postJson('/api/reset-db');
  location.reload();
});

async function loadOrders() {
  const orders = await (await fetch('/api/orders')).json();
  document.getElementById('orders').replaceChildren(...orders.map(renderOrder));
}

function renderOrder(order) {
  const row = el('tr');
  const cells = [
    `#${order.id}`,
    `${order.event_name}, ${order.quantity} ${order.quantity === 1 ? 'ticket' : 'tickets'}`,
    `$${order.total}`,
    order.email,
    formatDate(order.created_at),
  ];
  for (const text of cells) row.append(el('td', 'px-4 py-2', text));

  const status = order.chargeback_at
    ? el('span', 'rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700', 'Chargeback')
    : el('span', 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700', 'Paid');
  const statusCell = el('td', 'px-4 py-2');
  statusCell.append(status);

  const action = order.chargeback_at
    ? button('Dispute evidence', () => showEvidence(order.id))
    : button('Simulate chargeback', async () => {
        const data = await postJson(`/api/orders/${order.id}/chargeback`);
        showResult(data.success ? 'success' : 'error', data.message);
        await loadOrders();
        if (data.success) await showEvidence(order.id);
      });
  const actionCell = el('td', 'px-4 py-2 text-right');
  actionCell.append(action);

  row.append(statusCell, actionCell);
  return row;
}

async function showEvidence(orderId) {
  const data = await (await fetch(`/api/orders/${orderId}/evidence`)).json();
  if (!data.success) {
    showResult('error', data.message);
    return;
  }
  const { order, sameEmail } = data;

  evidencePanel.replaceChildren(
    el('h2', 'text-lg font-semibold', `Dispute evidence for order #${order.id}`),
    el('p', 'mt-1 text-sm text-red-700', `Chargeback reason: ${order.chargeback_reason ?? 'none yet'}`),
    section('The order', [
      `${order.event_name}, ${order.quantity} ${order.quantity === 1 ? 'ticket' : 'tickets'}, $${order.total}`,
      `Tickets sent to ${order.email}, paid with the card ending ${order.card_last4}`,
      `Placed ${formatDate(order.created_at)}`,
    ]),
    section('Other orders with this email', sameEmail.map(describeOrder)),
    el(
      'p',
      'mt-6 text-sm text-slate-500',
      'Nothing ties this order to the device that placed it, so the dispute is your word against the cardholder.',
    ),
  );
  evidencePanel.classList.remove('hidden');
  evidencePanel.scrollIntoView({ behavior: 'smooth' });
}

// --- Helpers ---

function section(title, lines) {
  const wrapper = el('div', 'mt-5');
  const list = el('ul', 'mt-1 list-disc space-y-1 pl-5 text-sm');
  const items = lines.length ? lines : ['None.'];
  list.append(...items.map((line) => el('li', '', line)));
  wrapper.append(el('h3', 'text-sm font-semibold', title), list);
  return wrapper;
}

function describeOrder(order) {
  const chargeback = order.chargeback_at ? ', chargeback' : ', no dispute';
  return `Order #${order.id}: ${order.event_name}, $${order.total}, ${order.email}, ${formatDate(order.created_at)}${chargeback}`;
}

function button(label, onClick) {
  const node = el('button', 'rounded-md border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100', label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
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
