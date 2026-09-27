import { db } from './db.js';
import { COUNTRIES, findCountry } from './tiers.js';

const LIST_PRICE = 120; // Pro plan, one year, in USD

export function getPricing() {
  return { listPrice: LIST_PRICE, countries: COUNTRIES };
}

// Applies the regional price of the country the shopper selected.
export async function activateRegionalPrice({ country }) {
  const selected = findCountry(country);
  if (!selected) {
    return { success: false, message: 'Select the country you are buying from.' };
  }

  db.prepare('INSERT INTO price_activations (country, percent_off, created_at) VALUES (?, ?, ?)').run(
    selected.code,
    selected.percentOff,
    Date.now(),
  );

  return {
    success: true,
    percentOff: selected.percentOff,
    price: (LIST_PRICE * (100 - selected.percentOff)) / 100,
    message:
      selected.percentOff > 0
        ? `${selected.name}: regional price applied, ${selected.percentOff}% off.`
        : `${selected.name}: no regional discount.`,
  };
}
