import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

export const AIRPORTS = [
  { code: 'JFK', city: 'New York' },
  { code: 'LAX', city: 'Los Angeles' },
  { code: 'ORD', city: 'Chicago' },
  { code: 'SFO', city: 'San Francisco' },
  { code: 'SEA', city: 'Seattle' },
  { code: 'MIA', city: 'Miami' },
];

// Made-up airlines for the demo.
const AIRLINES = [
  { name: 'Bluebird Air', code: 'BB' },
  { name: 'Northstar Airways', code: 'NS' },
  { name: 'Coastline Air', code: 'CL' },
];

// Returns the flights and prices for a route and a date: the data a scraper wants.
export async function searchFlights({ from, to, date, requestId }) {
  // Read the identification behind this search first. Requests without a verified
  // identification (such as direct API calls), browser automation, disabled
  // JavaScript and Dangerous traffic get no data.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, flights: [], message: `No flights shown: ${check.message}` };
  }

  const origin = AIRPORTS.find((airport) => airport.code === from);
  const destination = AIRPORTS.find((airport) => airport.code === to);
  if (!origin || !destination || origin === destination) {
    return { success: false, flights: [], message: 'Pick two different airports.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) {
    return { success: false, flights: [], message: 'Pick a travel date.' };
  }

  db.prepare(
    'INSERT INTO searches (origin, destination, date, device_id, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(origin.code, destination.code, date, check.identification.device_id, check.identification.request_id, Date.now());

  const flights = buildSchedule(origin.code, destination.code, date);
  return {
    success: true,
    flights,
    message: `${flights.length} flights from ${origin.city} to ${destination.city} on ${date}.`,
  };
}

// --- Demo data ---

// The schedule and the prices are made up but stable: the same search always
// returns the same flights.
function buildSchedule(from, to, date) {
  const route = seededRandom(`${from}-${to}`);
  const day = seededRandom(`${from}-${to}-${date}`);
  const minutesInAir = 75 + Math.floor(route() * 330);
  const count = 3 + Math.floor(day() * 3);

  const flights = [];
  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[Math.floor(day() * AIRLINES.length)];
    const departs = 6 * 60 + Math.floor(day() * 180) * 5; // between 06:00 and 21:00
    flights.push({
      airline: airline.name,
      flightNumber: `${airline.code} ${100 + Math.floor(day() * 900)}`,
      departs: clock(departs),
      arrives: clock(departs + minutesInAir),
      duration: `${Math.floor(minutesInAir / 60)}h ${minutesInAir % 60}m`,
      price: 79 + Math.floor(day() * 420),
    });
  }
  return flights.sort((a, b) => a.departs.localeCompare(b.departs));
}

function clock(minutes) {
  const nextDay = minutes >= 24 * 60 ? ' (+1 day)' : '';
  const time = minutes % (24 * 60);
  const hours = String(Math.floor(time / 60)).padStart(2, '0');
  return `${hours}:${String(time % 60).padStart(2, '0')}${nextDay}`;
}

// A small deterministic random number generator seeded by a string.
function seededRandom(seed) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };
}
