// This file belongs to this app: copying this folder is sufficient to run it.
// Public Key is browser-only; Private API Key stays in the server environment.
import { ShieldLabs, evaluateIdentification, riskBand } from '@shieldlabs-ai/node';
import { db } from './db.js';

export const NIL_DEVICE = '00000000-0000-0000-0000-000000000000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let client;
let generation = 0;

export function resetVerificationState() { generation += 1; }

function historyClient() {
  if (!process.env.SHIELDLABS_API_KEY) return null;
  client ??= new ShieldLabs({
    apiKey: process.env.SHIELDLABS_API_KEY,
    baseUrl: process.env.SHIELDLABS_API_URL,
    timeout: 5_000,
    maxRetries: 0,
    fetch: (...args) => globalThis.fetch(...args),
  });
  return client;
}

export function band(score) {
  const value = riskBand(score);
  return value === 'rate_limited' ? 'Rate limited' : value[0].toUpperCase() + value.slice(1);
}

export async function getIdentification(requestId, { timeoutMs = 10_000 } = {}) {
  if (typeof requestId !== 'string' || !UUID.test(requestId)) return null;
  try {
    const sdk = historyClient();
    if (!sdk) return null;
    const signal = AbortSignal.timeout(timeoutMs + 13_000);
    const first = await sdk.identifications.get(requestId, { timeout: timeoutMs, signal });
    if (!first || first.request_id !== requestId) return null;
    const observed = Date.parse(first.observed_at ?? '');
    if (!Number.isFinite(observed) || observed > Date.now() + 2_000) return null;
    // Conservative demo delay, NOT a finality marker supplied by the server.
    const remaining = Math.max(0, observed + 11_000 - Date.now());
    if (remaining) await new Promise(resolve => setTimeout(resolve, remaining));
    const row = await sdk.identifications.get(requestId, { wait: false, signal });
    const updated = Date.parse(row?.observed_at ?? '');
    if (!Number.isFinite(updated) || updated > Date.now() + 2_000) return null;
    return row?.request_id === requestId ? row : null;
  } catch (error) {
    // Do not print credentials, transport URLs or arbitrary response bodies.
    console.warn('[shieldlabs] Identification unavailable:', error.name);
    return null;
  }
}

export async function verifyIdentification(requestId, { expectedUserHid, blockBands = ['dangerous'] } = {}) {
  if (typeof requestId !== 'string' || !UUID.test(requestId)) return refuse('missing');
  const before = generation;
  const identification = await getIdentification(requestId);
  if (before !== generation) return refuse('reset_during_check');
  if (!identification) return refuse('unverified');
  if (expectedUserHid !== undefined && identification.user_hid !== expectedUserHid) return refuse('wrong_account');
  // Old IDs cannot pass freshness, so expired replay records can be removed.
  db.prepare('DELETE FROM used_request_ids WHERE used_at < ?').run(Date.now() - 300_000);
  const { changes } = db.prepare('INSERT OR IGNORE INTO used_request_ids (request_id, used_at) VALUES (?, ?)').run(requestId, Date.now());
  const verdict = evaluateIdentification(identification, { isReplay: () => changes === 0, blockBands });
  if (!verdict.ok) return refuse(verdict.reason);
  return { ok: true, identification };
}

export async function readHistory(searchType, value, limit = 20) {
  const sdk = historyClient();
  if (!sdk) throw new Error('SHIELDLABS_API_KEY is not configured');
  return (await sdk.history.search(searchType, value, { limit, signal: AbortSignal.timeout(10_000) })).data;
}

function refuse(reason) {
  const messages = {
    missing: 'No valid request ID was sent.', unverified: 'The identification could not be verified.',
    replayed: 'This identification was already used.', stale: 'This identification is more than five minutes old.',
    rate_limited: 'The identification was rate limited.', no_device_signals: 'No usable device signals were collected.',
    blocked_flag: 'Automation or disabled JavaScript detected.', blocked_band: 'Risk Score is in the Dangerous band.',
    wrong_account: 'This identification belongs to another account.', reset_during_check: 'The demo was reset during verification.',
  };
  return { ok: false, reason, message: messages[reason] ?? 'Another verification step is required.' };
}
