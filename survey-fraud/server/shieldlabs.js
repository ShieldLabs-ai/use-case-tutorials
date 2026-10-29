// This module belongs to this standalone app. Private API Key and domain UUID stay on the server.
import { ShieldLabs, evaluateIdentification, parseHistoryEntity, riskBand } from '@shieldlabs-ai/node';
import { db } from './db.js';

export const NIL_DEVICE = '00000000-0000-0000-0000-000000000000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let client;
let generation = 0;

export function resetVerificationState() { generation += 1; }

function historyClient() {
  if (!process.env.SHIELDLABS_API_KEY || !UUID.test(process.env.SHIELDLABS_DOMAIN_ID ?? '')) return null;
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
  return value === 'banned_ip' ? 'Banned IP' : value[0].toUpperCase() + value.slice(1);
}

export async function getIdentification(identificationId, { timeoutMs = 10_000 } = {}) {
  if (typeof identificationId !== 'string' || !UUID.test(identificationId)) return null;
  try {
    const sdk = historyClient();
    if (!sdk) return null;
    const domainId = process.env.SHIELDLABS_DOMAIN_ID;
    const deadline = Date.now() + timeoutMs;
    const signal = AbortSignal.timeout(timeoutMs + 1_000);
    let wait = 250;
    do {
      const row = await sdk.identifications.get(identificationId, {
        domainId, timeout: Math.max(0, deadline - Date.now()), signal,
      });
      if (!row) return null;
      const card = parseHistoryEntity(row.raw);
      if (card.type !== 'identification' || card.id.toLowerCase() !== identificationId.toLowerCase() ||
          card.domain_id.toLowerCase() !== domainId.toLowerCase()) return null;
      if (card.risk.state === 'ok' && card.signals.state === 'ok') {
        const observed = Date.parse(row.observed_at ?? '');
        if (!Number.isFinite(row.risk_score) || !Number.isFinite(observed) || observed > Date.now() + 2_000) return null;
        const expectedBand = row.risk_score < 30 ? 'trusted' : row.risk_score < 60 ? 'suspicious' : 'dangerous';
        return card.risk.band === expectedBand ? row : null;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) return null;
      await new Promise(resolve => setTimeout(resolve, Math.min(wait, remaining)));
      wait = Math.min(wait * 2, 2_000);
    } while (Date.now() < deadline);
    return null;
  } catch (error) {
    // Never print credentials or arbitrary upstream payloads into the demo response.
    console.warn('[shieldlabs] Identification unavailable:', error.name);
    return null;
  }
}

export async function verifyIdentification(identificationId, { expectedUserHid, blockBands = ['dangerous'] } = {}) {
  if (typeof identificationId !== 'string' || !UUID.test(identificationId)) return refuse('missing');
  const before = generation;
  const identification = await getIdentification(identificationId);
  if (before !== generation) return refuse('reset_during_check');
  if (!identification) return refuse('unverified');
  if (expectedUserHid !== undefined && identification.user_hid !== expectedUserHid) return refuse('wrong_account');
  const verdict = evaluateIdentification(identification, { blockBands,
    blockFlags: ['browser_automation', 'javascript_disabled', 'banned_ip'],
  });
  if (!verdict.ok) return refuse(verdict.reason);
  // This standalone app has one registered domain. Claim each accepted UUID once across all actions.
  db.prepare('DELETE FROM used_request_ids WHERE used_at < ?').run(Date.now() - 600_000);
  const { changes } = db.prepare('INSERT OR IGNORE INTO used_request_ids (request_id, used_at) VALUES (?, ?)').run(identification.identification_id, Date.now());
  if (changes === 0) return refuse('replayed');
  return { ok: true, identification };
}

export async function readDevice(deviceId) {
  const sdk = historyClient();
  if (!sdk) throw new Error('Configure the server API key and domain UUID');
  return sdk.entities.get(process.env.SHIELDLABS_DOMAIN_ID, 'device', deviceId, { signal: AbortSignal.timeout(6_000) });
}

function refuse(reason) {
  const messages = {
    missing: 'No valid Identification ID was sent.', unverified: 'The identification could not be verified.',
    replayed: 'This identification was already used.', stale: 'This identification is more than five minutes old.',
    banned_ip: 'Banned IP was detected.', no_device_signals: 'No usable device signals were collected.',
    blocked_flag: 'Automation, disabled JavaScript or Banned IP detected.', blocked_band: 'Risk Score is in the Dangerous band.',
    wrong_account: 'This identification belongs to another account.', reset_during_check: 'The demo was reset during verification.',
  };
  return { ok: false, reason, message: messages[reason] ?? 'Another verification step is required.' };
}
