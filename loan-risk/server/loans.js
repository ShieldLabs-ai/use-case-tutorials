import { db } from './db.js';

const ANNUAL_RATE = 0.12; // a fixed 12% APR for the demo
const MAX_PAYMENT_SHARE = 0.4; // the payment can use at most 40% of the monthly income
const TERMS = [6, 12, 24, 36];

// Evaluates a loan application and returns an offer or a decline.
export async function applyForLoan({ firstName, lastName, monthlyIncome, amount, termMonths }) {
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

  const application = { firstName, lastName, monthlyIncome, amount, termMonths };
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

function saveApplication({ firstName, lastName, monthlyIncome, amount, termMonths }, status) {
  db.prepare(
    `INSERT INTO applications (first_name, last_name, monthly_income, amount, term_months, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(firstName, lastName, monthlyIncome, amount, termMonths, status, Date.now());
}

function money(value) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
