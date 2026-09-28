import { db } from './db.js';

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

export function getCart() {
  return { items: CART, subtotal: SUBTOTAL, firstOrderEligible: true };
}

// Places an order and always applies the first-order discount: nothing stops
// the same shopper from checking out again with a new email address.
export async function checkout({ email }) {
  email = String(email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { success: false, message: 'Enter a valid email.' };
  }

  const subtotalCents = toCents(SUBTOTAL);
  const discountCents = Math.round((subtotalCents * FIRST_ORDER_DISCOUNT_PERCENT) / 100);
  const totalCents = subtotalCents - discountCents;

  db.prepare(
    'INSERT INTO orders (email, subtotal_cents, discount_cents, total_cents, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(email, subtotalCents, discountCents, totalCents, Date.now());

  return {
    success: true,
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: totalCents / 100,
    message: `Order confirmed for ${money(subtotalCents)} (20% first-order discount applied). Total: ${money(totalCents)}, sent to ${email}.`,
  };
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function money(cents) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
