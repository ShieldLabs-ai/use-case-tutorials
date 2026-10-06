import { db } from './db.js';
import { findEvent } from './events.js';

// Places a ticket order. The payment is simulated and always approved.
export async function placeOrder({ eventId, quantity, email, cardNumber }) {
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

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO orders (event_id, event_name, quantity, total, email, card_last4, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(event.id, event.name, quantity, event.price * quantity, email, card.slice(-4), Date.now());

  const tickets = quantity === 1 ? '1 ticket' : `${quantity} tickets`;
  return {
    success: true,
    orderId: Number(lastInsertRowid),
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

  return { success: true, order, sameEmail };
}

function findOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
}
