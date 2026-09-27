import { db } from './db.js';
import { findEvent } from './events.js';
import { band, readHistory, verifyIdentification } from './shieldlabs.js';

// Places a ticket order. The payment is simulated and always approved.
export async function placeOrder({ eventId, quantity, email, cardNumber, requestId }) {
  const event = findEvent(eventId);
  quantity = Number(quantity);
  email = String(email ?? '').trim().toLowerCase();
  const card = String(cardNumber ?? '').replace(/\D/g, '');

  if (!event) return { success: false, message: 'Pick an event.' };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 6) {
    return { success: false, message: 'Pick 1 to 6 tickets.' };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { success: false, message: 'Enter the email the tickets go to.' };
  }
  if (card.length < 13 || card.length > 19) {
    return { success: false, message: 'Enter a card number.' };
  }

  // Read the identification behind this order. Unverified, automated and
  // Dangerous orders are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Order refused: ${check.message}` };
  }

  // Keep the identification with the order: it is the evidence if the order is
  // disputed later.
  const { device_id: deviceId, public_ip: publicIp, risk_score: riskScore } = check.identification;
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO orders (event_id, event_name, quantity, total, email, card_last4,
         device_id, ip, country, risk_score, request_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      event.id,
      event.name,
      quantity,
      event.price * quantity,
      email,
      card.slice(-4),
      deviceId,
      publicIp.ip,
      publicIp.country,
      riskScore,
      check.identification.request_id,
      Date.now(),
    );

  const tickets = quantity === 1 ? '1 ticket' : `${quantity} tickets`;
  return {
    success: true,
    message: `Order #${lastInsertRowid} confirmed: ${tickets} for ${event.name}, sent to ${email}.`,
  };
}

// Every order, newest first, for the admin page.
export function listOrders() {
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
}

// Simulates your payment processor reporting a chargeback on an order.
export function fileChargeback(orderId) {
  const order = findOrder(orderId);
  if (!order) return { success: false, message: 'No such order.' };
  if (order.chargeback_at) {
    return { success: false, message: `Order #${order.id} already has a chargeback.` };
  }

  db.prepare('UPDATE orders SET chargeback_at = ?, chargeback_reason = ? WHERE id = ?').run(
    Date.now(),
    'The cardholder says they did not make this purchase.',
    order.id,
  );
  return { success: true, message: `Chargeback received for order #${order.id}.` };
}

// What you can send the payment processor to contest a chargeback.
export async function getEvidence(orderId) {
  const order = findOrder(orderId);
  if (!order) return { success: false, message: 'No such order.' };

  const sameEmail = db
    .prepare('SELECT * FROM orders WHERE email = ? AND id != ? ORDER BY created_at DESC')
    .all(order.email, order.id);

  // Earlier orders from the same device that were never disputed: the strongest
  // sign that the cardholder placed the disputed order too.
  const sameDevice = db
    .prepare(
      `SELECT * FROM orders WHERE device_id = ? AND id != ? AND created_at < ? AND chargeback_at IS NULL
       ORDER BY created_at DESC`,
    )
    .all(order.device_id, order.id, order.created_at);

  return {
    success: true,
    order: { ...order, band: band(order.risk_score) },
    sameEmail,
    sameDevice,
    deviceHistory: await summarizeDevice(order.device_id),
  };
}

function findOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
}

// The device's history in ShieldLabs: its newest 100 identifications on your site.
async function summarizeDevice(deviceId) {
  try {
    const rows = await readHistory('device_id', deviceId, 100);
    const times = rows.map((row) => row.created_at).sort();
    return {
      identifications: rows.length,
      firstSeen: times[0] ?? null,
      lastSeen: times.at(-1) ?? null,
      countries: [...new Set(rows.map((row) => row.country).filter(Boolean))],
      publicIps: [...new Set(rows.map((row) => row.ip).filter(Boolean))],
    };
  } catch (error) {
    console.error(`[shieldlabs] device history: ${error.message}`);
    return { error: 'The History API could not be read.' };
  }
}
