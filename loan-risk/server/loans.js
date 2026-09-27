import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

const ANNUAL_RATE = 0.12; // a fixed 12% APR for the demo
const MAX_PAYMENT_SHARE = 0.4; // the payment can use at most 40% of the monthly income
const TERMS = [6, 12, 24, 36];
const DAY = 24 * 60 * 60 * 1000;

// Evaluates a loan application and returns an offer or a decline.
export async function applyForLoan({ firstName, lastName, monthlyIncome, amount, termMonths, requestId }) {
  firstName = String(firstName ?? '').trim();
  lastName = String(lastName ?? '').trim();
  monthlyIncome = Number(monthlyIncome);
  amount = Number(amount);
  termMonths = Number(termMonths);

  if (!firstName || !lastName) {
    return { success: false, message: 'Enter your first and last name.' };
  }
  if (!(monthlyIncome > 0)) {
    return { success: false, message: 'Enter your monthly income.' };
  }
  if (!(amount >= 500 && amount <= 50000)) {
    return { success: false, message: 'Loans go from $500 to $50,000.' };
  }
  if (!TERMS.includes(termMonths)) {
    return { success: false, message: 'Pick a loan term.' };
  }

  // Read the identification behind this application. Unverified, automated and
  // Dangerous applications are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Application refused: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId } = check.identification;
  const application = { firstName, lastName, monthlyIncome, amount, termMonths, deviceId, requestId: checkedRequestId };

  // Compare with the applications from the same device in the last 24 hours. A
  // different name or income from one device looks like someone trying details
  // until the answer is yes: flag it for review and calculate no offer.
  const earlier = db
    .prepare('SELECT first_name, last_name, monthly_income FROM applications WHERE device_id = ? AND created_at >= ?')
    .all(deviceId, Date.now() - DAY);
  const inconsistent = earlier.some(
    (prior) =>
      normalize(prior.first_name) !== normalize(firstName) ||
      normalize(prior.last_name) !== normalize(lastName) ||
      prior.monthly_income !== monthlyIncome,
  );
  if (inconsistent) {
    saveApplication(application, 'flagged');
    return {
      success: false,
      message: 'This application needs a manual review: its name or income differs from an earlier application from this device.',
    };
  }

  const payment = monthlyPayment(amount, termMonths);

  if (payment > monthlyIncome * MAX_PAYMENT_SHARE) {
    saveApplication(application, 'declined');
    return {
      success: false,
      message: `Declined: the monthly payment of ${money(payment)} would be more than 40% of your income.`,
    };
  }

  saveApplication(application, 'approved');
  return {
    success: true,
    message: `Approved: ${money(amount)} over ${termMonths} months at 12% APR, ${money(payment)} a month.`,
  };
}

// --- Helpers ---

// A standard amortized monthly payment.
function monthlyPayment(amount, termMonths) {
  const rate = ANNUAL_RATE / 12;
  return (amount * rate) / (1 - (1 + rate) ** -termMonths);
}

function saveApplication({ firstName, lastName, monthlyIncome, amount, termMonths, deviceId, requestId }, status) {
  db.prepare(
    `INSERT INTO applications (first_name, last_name, monthly_income, amount, term_months, status, device_id, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(firstName, lastName, monthlyIncome, amount, termMonths, status, deviceId, requestId, Date.now());
}

function normalize(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function money(value) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
