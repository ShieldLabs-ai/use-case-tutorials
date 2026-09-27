import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

// A second, different code on the same device has to wait this long.
const CODE_COOLDOWN_MS = 60 * 60 * 1000;

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
export async function applyCoupon({ code, requestId }) {
  // Read the identification behind this redemption first, so scripts guessing
  // codes are refused too. Unverified, automated and Dangerous ones are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Coupon refused: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId } = check.identification;

  const coupon = findCoupon(code);
  if (!coupon) {
    return { success: false, message: 'That coupon code is not valid.' };
  }

  // One redemption per code per device. The Device ID stays the same when cookies
  // are cleared, in an incognito window and on a new IP address.
  if (db.prepare('SELECT 1 FROM redemptions WHERE code = ? AND device_id = ?').get(coupon.code, deviceId)) {
    return { success: false, message: `Coupon refused: you already used ${coupon.code}.` };
  }

  // Cycling through codes on one device: wait before a second, different code.
  const last = db
    .prepare('SELECT created_at FROM redemptions WHERE device_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(deviceId);
  const wait = last ? CODE_COOLDOWN_MS - (Date.now() - last.created_at) : 0;
  if (wait > 0) {
    return {
      success: false,
      message: `Coupon refused: you used another code recently. Try again in ${Math.ceil(wait / 60000)} minutes.`,
    };
  }

  db.prepare('INSERT INTO redemptions (code, device_id, request_id, created_at) VALUES (?, ?, ?, ?)').run(
    coupon.code,
    deviceId,
    checkedRequestId,
    Date.now(),
  );

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
