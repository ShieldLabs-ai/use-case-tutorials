import { db } from './db.js';

// The cart is fixed for the demo.
const CART = [
  { name: 'Trail running shoes', price: 120 },
  { name: 'Merino running socks, 2 pack', price: 24 },
];
const SUBTOTAL = CART.reduce((sum, item) => sum + item.price, 0);

export function getCart() {
  return { items: CART, subtotal: SUBTOTAL };
}

// Applies a coupon code to the cart and records the redemption.
export async function applyCoupon({ code }) {
  const coupon = findCoupon(code);
  if (!coupon) {
    return { success: false, message: 'That coupon code is not valid.' };
  }

  db.prepare('INSERT INTO redemptions (code, created_at) VALUES (?, ?)').run(coupon.code, Date.now());

  const discount = Math.round(SUBTOTAL * coupon.percent_off) / 100;
  return {
    success: true,
    code: coupon.code,
    discount,
    total: SUBTOTAL - discount,
    message: `${coupon.code} applied: ${coupon.description}.`,
  };
}

function findCoupon(code) {
  return db
    .prepare('SELECT code, percent_off, description FROM coupons WHERE code = ? COLLATE NOCASE')
    .get(String(code ?? '').trim());
}
