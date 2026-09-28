// Server side of the ShieldLabs integration.
//
// The browser sends the request ID of the identification it ran for an action.
// This module reads that identification from the History API with your Private
// API Key and runs the checks every protected action starts with.
import { db } from './db.js';

const API_URL = process.env.SHIELDLABS_API_URL || 'https://account.shieldlabs.ai';
const API_KEY = process.env.SHIELDLABS_API_KEY; // sec_... Private API Key, never sent to the browser

export const NIL_DEVICE = '00000000-0000-0000-0000-000000000000';
const POLL_INTERVAL_MS = 500;
const MAX_AGE_MS = 5 * 60 * 1000;

// Risk Score bands: Trusted 0-29, Suspicious 30-59, Dangerous 60-100.
export function band(score) {
  if (score >= 60) return 'Dangerous';
  if (score >= 30) return 'Suspicious';
  return 'Trusted';
}

// The checks every protected handler starts with. Resolves with
// { ok: true, identification } or { ok: false, reason, message }.
// The messages name the reason to make the demo easy to follow. In production,
// show a generic message and log the reason.
export async function verifyIdentification(requestId) {
  if (typeof requestId !== 'string' || !/^[\w-]{8,64}$/.test(requestId)) {
    return refuse(requestId, 'missing', 'No identification was sent with the request.');
  }

  // No identification means unverified, never clean.
  const identification = await getIdentification(requestId);
  if (!identification) {
    return refuse(requestId, 'unverified', 'The identification could not be verified.');
  }

  // One identification authorizes one action, within 5 minutes of the check.
  const { changes } = db
    .prepare('INSERT OR IGNORE INTO used_request_ids (request_id, used_at) VALUES (?, ?)')
    .run(requestId, Date.now());
  if (changes === 0) {
    return refuse(requestId, 'replayed', 'This identification was already used.');
  }
  if (!(Date.now() - parseTimestamp(identification.created_at) <= MAX_AGE_MS)) {
    return refuse(requestId, 'expired', 'The identification is more than 5 minutes old.');
  }

  // 999 is the rate-limit marker. The all-zero Device ID means no usable device signals.
  if (identification.risk_score > 100) {
    return refuse(requestId, 'rate_limited', 'The identification was rate limited.');
  }
  if (identification.device_id === NIL_DEVICE) {
    return refuse(requestId, 'no_device', 'No usable device signals were collected.');
  }

  const flags = identification.detection_flags;
  if (flags.browser_automation || flags.javascript_disabled) {
    const what = flags.browser_automation ? 'Browser automation' : 'Disabled JavaScript';
    return refuse(requestId, 'automation', `${what} detected.`);
  }
  if (band(identification.risk_score) === 'Dangerous') {
    const signals = identification.score_details.map((s) => `${s.description} ${s.weight}`).join(', ');
    return refuse(requestId, 'dangerous', `Risk Score ${identification.risk_score} is in the Dangerous band.`, signals);
  }

  console.log(
    `[shieldlabs] ${requestId}: device ${identification.device_id}, ` +
      `Risk Score ${identification.risk_score} (${band(identification.risk_score)})`,
  );
  return { ok: true, identification };
}

// Reads one identification by request ID. Scoring is asynchronous, so the row can
// take a few seconds to appear (up to about 10 when follow-up network checks run):
// poll until it does. Returns the identification with webhook-style field names,
// or null.
export async function getIdentification(requestId, { timeoutMs = 10_000 } = {}) {
  if (!API_KEY) {
    console.error('[shieldlabs] SHIELDLABS_API_KEY is not set in .env: identifications cannot be read.');
    return null;
  }
  const deadline = Date.now() + timeoutMs;
  while (true) {
    try {
      const [row] = await readHistory('request_id', requestId, 1);
      if (row) return fromHistoryRow(row);
    } catch (error) {
      console.error(`[shieldlabs] History API: ${error.message}`);
      if (error.status === 401 || error.status === 403) return null; // a wrong key does not heal
    }
    if (Date.now() + POLL_INTERVAL_MS > deadline) return null;
    await sleep(POLL_INTERVAL_MS);
  }
}

// Reads identifications from the History API, newest first. searchType is one of
// request_id, device_id, visitor_id, user_hid, ip, session_id or cookie_id.
export async function readHistory(searchType, value, limit = 20) {
  if (!API_KEY) throw new Error('SHIELDLABS_API_KEY is not set in .env');

  const url = new URL(`/api/v1/history/${searchType}/${encodeURIComponent(value)}`, API_URL);
  url.searchParams.set('limit', String(limit));
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    const error = new Error(`history lookup failed with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const body = await response.json();
  return body.data ?? [];
}

// --- Helpers ---

// History rows are flat and snake_case. Map the fields the tutorials read to the
// names the webhook payload uses.
function fromHistoryRow(row) {
  return {
    request_id: row.request_id,
    session_id: row.session_id,
    visitor_id: row.visitor_id,
    device_id: row.device_id,
    user_hid: row.user_hid,
    risk_score: row.score,
    score_details: parseScoreDetails(row.score_details),
    public_ip: { ip: row.ip, country: row.country },
    connection_type: row.connection_type,
    os: row.os,
    browser: row.browser,
    device_type: row.device_type,
    created_at: row.created_at,
    detection_flags: {
      vpn: row.is_vpn,
      proxy: row.is_proxy,
      tor: row.is_tor,
      privacy_relay: row.is_privacy_relay,
      datacenter_ip: row.is_datacenter,
      abuser: row.is_abuser,
      anti_detect_browser: row.is_antidetect,
      browser_automation: row.is_browser_automation,
      javascript_disabled: row.is_js_disabled,
      os_mismatch: row.is_os_mismatch,
      os_not_detected: row.is_os_not_detected,
      timezone_mismatch: row.is_timezone_mismatch,
      incognito: row.is_incognito,
      search_bot: row.is_search_bot,
    },
  };
}

// score_details is a JSON string of { Value, Description } entries: the weight of
// each risk signal behind the Risk Score. Entries with Value 0 are notes, not signals.
function parseScoreDetails(value) {
  try {
    return JSON.parse(value || '[]')
      .filter((entry) => entry.Value > 0)
      .map((entry) => ({ weight: entry.Value, description: entry.Description }));
  } catch {
    return [];
  }
}

// History timestamps are UTC, for example "2026-06-16 10:00:00.000".
function parseTimestamp(value) {
  const text = String(value ?? '').trim().replace(' ', 'T');
  return Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}Z`);
}

function refuse(requestId, reason, message, detail = '') {
  const label = typeof requestId === 'string' && requestId ? requestId : 'no request ID';
  console.log(`[shieldlabs] ${label}: refused (${reason}) ${detail}`.trim());
  return { ok: false, reason, message };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
