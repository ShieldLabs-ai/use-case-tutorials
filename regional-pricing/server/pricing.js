import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';
import { COUNTRIES, findCountry } from './tiers.js';

const LIST_PRICE = 120; // Pro plan, one year, in USD
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function getPricing() {
  return { listPrice: LIST_PRICE, countries: COUNTRIES };
}

// Applies the regional price of the country the shopper selected, when their
// connection is really in that country.
export async function activateRegionalPrice({ country, requestId }) {
  const selected = findCountry(country);
  if (!selected) {
    return { success: false, message: 'Select the country you are buying from.' };
  }

  // Read the identification behind this request. Unverified, automated and
  // Dangerous requests keep the list price.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Regional pricing refused: ${check.message}` };
  }
  const { detection_flags: flags, connection_type: connectionType, public_ip: publicIp } = check.identification;

  // A masked connection hides the shopper's real country. History has no
  // browser_vpn_proxy flag: the connection type carries it.
  const masked =
    flags.vpn ||
    flags.proxy ||
    flags.tor ||
    flags.privacy_relay ||
    flags.datacenter_ip ||
    connectionType === 'browser_vpn_proxy';
  if (masked) {
    return { success: false, message: 'Regional pricing is not available over a VPN, a proxy or Tor. Turn it off and try again.' };
  }
  if (flags.timezone_mismatch) {
    return { success: false, message: 'Regional pricing is not available: your time zone does not match your location.' };
  }

  // The discount follows the country of the connection (ISO code of the public IP).
  if (!publicIp.country) {
    return { success: false, message: 'Regional pricing is not available: the country of your connection is unknown.' };
  }
  if (publicIp.country !== selected.code) {
    return {
      success: false,
      message: `Your connection is in another country (${countryName(publicIp.country)}), so the regional price for ${selected.name} does not apply.`,
    };
  }

  db.prepare(
    'INSERT INTO price_activations (country, percent_off, device_id, request_id, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(selected.code, selected.percentOff, check.identification.device_id, check.identification.request_id, Date.now());

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

function countryName(code) {
  try {
    return countryNames.of(code);
  } catch {
    return code; // not a well-formed region code
  }
}
