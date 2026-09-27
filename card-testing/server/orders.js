import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

const AMOUNTS = [25, 50, 100];
const MAX_DECLINES_PER_DEVICE = 3; // in 24 hours
const DAY = 24 * 60 * 60 * 1000;

// Buys a gift card. The payment is simulated: see chargeCard() below.
export async function purchaseGiftCard({ recipientEmail, amount, cardNumber, expiry, cvc, requestId }) {
  recipientEmail = String(recipientEmail ?? '').trim();
  amount = Number(amount);
  const card = String(cardNumber ?? '').replace(/\D/g, '');

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) {
    return { success: false, message: 'Enter the email of the gift card recipient.' };
  }
  if (!AMOUNTS.includes(amount)) {
    return { success: false, message: 'Pick a gift card amount.' };
  }
  const invalid = validateCard(card, expiry, cvc);
  if (invalid) return { success: false, message: invalid };

  // Read the identification behind this checkout. Unverified, automated and
  // Dangerous checkouts are refused before the card reaches the payment processor.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Payment refused: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId } = check.identification;

  // Card testing is many declined cards from one device. Cap the declines per
  // Device ID, which stays the same across cleared cookies, incognito windows and
  // new IP addresses.
  const { declines } = db
    .prepare(
      `SELECT COUNT(*) AS declines FROM payment_attempts
       WHERE device_id = ? AND status = 'declined' AND created_at >= ?`,
    )
    .get(deviceId, Date.now() - DAY);
  if (declines >= MAX_DECLINES_PER_DEVICE) {
    return { success: false, message: 'Payment refused: too many declined cards from this device. Try again tomorrow.' };
  }

  const approved = chargeCard(card);
  db.prepare(
    `INSERT INTO payment_attempts (recipient_email, amount, card_last4, status, device_id, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(recipientEmail, amount, card.slice(-4), approved ? 'approved' : 'declined', deviceId, checkedRequestId, Date.now());

  return approved
    ? { success: true, message: `Payment approved. A $${amount} gift card is on its way to ${recipientEmail}.` }
    : { success: false, message: 'Your card was declined.' };
}

// The latest payment attempts, newest first.
export function recentAttempts() {
  return db
    .prepare(
      'SELECT amount, card_last4, status, created_at FROM payment_attempts ORDER BY id DESC LIMIT 8',
    )
    .all();
}

// --- Helpers ---

// A stand-in for your payment processor: the demo test card is approved and every
// other card is declined, the way most stolen or guessed card numbers are.
function chargeCard(card) {
  return card === '4242424242424242';
}

function validateCard(card, expiry, cvc) {
  if (card.length < 13 || card.length > 19 || !passesLuhnCheck(card)) {
    return 'Enter a valid card number.';
  }
  const [month, year] = String(expiry ?? '').split('/').map((part) => part.trim());
  if (!/^(0[1-9]|1[0-2])$/.test(month ?? '') || !/^\d{2}$/.test(year ?? '')) {
    return 'Enter the expiry date as MM/YY.';
  }
  if (!/^\d{3,4}$/.test(String(cvc ?? '').trim())) {
    return 'Enter the 3 or 4 digit security code.';
  }
  return null;
}

// The checksum every real card number passes.
function passesLuhnCheck(card) {
  let sum = 0;
  for (let i = 0; i < card.length; i++) {
    let digit = Number(card[card.length - 1 - i]);
    if (i % 2 === 1) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    sum += digit;
  }
  return sum % 10 === 0;
}
