import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

// New customers get 20% off their first order, applied automatically at
// checkout: no code to enter.
const FIRST_ORDER_DISCOUNT_PERCENT = 20;

// The cart is fixed for the demo.
const CART = [
  { name: 'Desk lamp', price: 45 },
  { name: 'Wireless mouse', price: 35 },
  { name: 'Insulated water bottle', price: 42 },
  { name: 'Notebook, 3-pack', price: 18 },
];
const SUBTOTAL = CART.reduce((sum, item) => sum + item.price, 0);

// A plain cookie that remembers whether this browser has completed an order
// before. It only drives the "20% off" banner on the cart page before
// checkout: clearing cookies or opening an incognito window resets it, and
// that is fine, because it is not what decides the discount. The checkout
// call below re-checks eligibility against the ShieldLabs Device ID, which
// holds through cleared cookies, incognito windows and new IP addresses.
const HINT_COOKIE = 'acme_ordered_before';

export function getCart(request) {
  return { items: CART, subtotal: SUBTOTAL, firstOrderEligible: !hasOrderedBeforeHint(request) };
}

// Places an order. Applies 20% off when this device has never ordered before.
export async function checkout({ email, requestId }, reply) {
  email = String(email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { success: false, message: 'Enter a valid email.' };
  }

  // Read the identification behind this order. Unverified, automated and
  // Dangerous orders are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Order refused: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId } = check.identification;

  // One first-order discount per Device ID, no matter how many emails or
  // cleared-cookie sessions try to claim it again.
  const hasOrderedBefore = Boolean(db.prepare('SELECT 1 FROM orders WHERE device_id = ?').get(deviceId));

  const subtotalCents = toCents(SUBTOTAL);
  const discountCents = hasOrderedBefore ? 0 : Math.round((subtotalCents * FIRST_ORDER_DISCOUNT_PERCENT) / 100);
  const totalCents = subtotalCents - discountCents;

  db.prepare(
    `INSERT INTO orders (email, subtotal_cents, discount_cents, total_cents, device_id, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(email, subtotalCents, discountCents, totalCents, deviceId, checkedRequestId, Date.now());

  markOrderedBeforeHint(reply);

  const message = hasOrderedBefore
    ? `Order confirmed for ${money(totalCents)}. This device already used its first-order discount, so no discount applied this time. Total: ${money(totalCents)}.`
    : `Order confirmed for ${money(subtotalCents)} (20% first-order discount applied). Total: ${money(totalCents)}, sent to ${email}.`;

  return {
    success: true,
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: totalCents / 100,
    message,
  };
}

// Clears the preview cookie so the cart page starts fresh after a reset.
export function clearOrderedBeforeHint(reply) {
  reply.header('set-cookie', `${HINT_COOKIE}=; Path=/; Max-Age=0`);
}

// --- Helpers ---

function hasOrderedBeforeHint(request) {
  const cookie = request.headers.cookie || '';
  return new RegExp(`(?:^|;\\s*)${HINT_COOKIE}=1(?:;|$)`).test(cookie);
}

function markOrderedBeforeHint(reply) {
  reply.header('set-cookie', `${HINT_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax`);
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function money(cents) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
