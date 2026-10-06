import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

process.env.DEMO_DB_PATH = ':memory:';
process.env.DEMO_ALLOW_RESET = '1';
process.env.SHIELDLABS_PUBLIC_KEY = 'synthetic-public-key';
process.env.SHIELDLABS_API_KEY = 'sec_abcd1234-efgh5678-ijkl9012';
process.env.SHIELDLABS_API_URL = 'https://history.example.test';
const DEVICE_A = '11111111-1111-4111-8111-111111111111';
const DEVICE_B = '22222222-2222-4222-8222-222222222222';
const [route, payload] = ["/api/signup",{"email":"one@example.test","password":"synthetic-password"}];
const originalFetch = globalThis.fetch;
let wire;
let calls = [];
let responseStatus = 200;
let transform;
let pausedFetch;
let markStarted;
globalThis.fetch = async (url, options) => {
  calls.push({ url: String(url), options });
  assert.ok(String(url).startsWith('https://history.example.test/api/v1/history/'));
  assert.equal(new Headers(options.headers).get('authorization'), 'Bearer ' + process.env.SHIELDLABS_API_KEY);
  if (pausedFetch) { markStarted?.(); await pausedFetch; }
  const row = transform ? transform({ ...wire }, calls.length) : wire;
  return Response.json({ data: [row], total: 1 }, { status: responseStatus });
};
const { app } = await import('../server/server.js');
const { db } = await import('../server/db.js');
const { verifyIdentification } = await import('../server/shieldlabs.js');

function fixture(id, options = {}) {
  return {
    request_id: id, device_id: options.device ?? DEVICE_A, visitor_id: DEVICE_A,
    session_id: DEVICE_A, cookie_id: DEVICE_A, user_hid: options.userHid ?? 'anonymous',
    domain: 'tutorial.example.test', site_domain: 'example.test', ip: '203.0.113.24',
    country: options.country ?? 'US', score: options.score ?? 15,
    created_at: new Date(Date.now() - (options.age ?? 60_000)).toISOString(),
    score_details: '[{"Value":15,"Description":"Is VPN"}]',
    is_browser_automation: options.automation ?? false, is_js_disabled: false,
    is_vpn: options.vpn ?? false, connection_type: options.vpn ? 'vpn' : 'direct',
  };
}
async function actAt(url, body = {}, options = {}, cookie) {
  const requestId = options.id ?? randomUUID();
  wire = fixture(requestId, options);
  const response = await app.inject({ method: 'POST', url, payload: { ...body, requestId }, headers: cookie ? { cookie } : {} });
  return { body: response.json(), cookie: response.cookies.map(item => item.name + '=' + item.value).join('; '), response, requestId };
}
const act = (fields = {}, options = {}, cookie) => actAt(route, { ...payload, ...fields }, options, cookie);

beforeEach(async () => { await app.inject({ method: 'POST', url: '/api/reset-db' }); calls = []; responseStatus = 200; transform = undefined; pausedFetch = undefined; markStarted = undefined; });
after(async () => { await app.close(); db.close(); globalThis.fetch = originalFetch; });

test('bonus-abuse: serves its own page, public config and installed SDK', async () => {
  const page = await app.inject({ url: '/' }); assert.equal(page.statusCode, 200);
  assert.match(page.body, /vendor\/shieldlabs.js/);
  const config = await app.inject({ url: '/config.js' }); assert.equal(config.statusCode, 200);
  assert.ok(!config.body.includes(process.env.SHIELDLABS_API_KEY));
  const bundle = await app.inject({ url: '/vendor/shieldlabs.js' }); assert.equal(bundle.statusCode, 200);
  assert.match(bundle.body, /ShieldLabsJS/);
});
test('ordinary verified action is handled with the published Node SDK', async () => {
  assert.equal((await act()).body.success, true); assert.equal(calls.length, 2);
});
test('missing identification does not change protected state', async () => {
  const response = await app.inject({ method: 'POST', url: route, payload });
  assert.equal(response.json().success, false); assert.equal(calls.length, 0);
});
test('reusing a valid request ID is refused atomically', async () => {
  const first = await act(); assert.equal(first.body.success, true);
  assert.equal((await act({}, { id: first.requestId })).body.success, false);
});
for (const [name, options] of [
  ['Dangerous', { score: 80 }], ['automation', { automation: true }],
  ['rate-limit marker', { score: 999 }], ['missing device', { device: '00000000-0000-0000-0000-000000000000' }],
  ['stale result', { age: 360_000 }], ['future timestamp', { age: -60_000 }],
]) test(name + ' cannot authorize a normal protected action', async () => {
  assert.equal((await act({}, options)).body.success, false);
});
test('a named result for a different account is refused', async () => {
  const id = randomUUID(); wire = fixture(id, { userHid: 'other' });
  const result = await verifyIdentification(id, { expectedUserHid: 'intended' });
  assert.equal(result.reason, 'wrong_account');
});
test('reset is disabled outside explicitly disposable mode', async () => {
  process.env.DEMO_ALLOW_RESET = '0';
  try { assert.equal((await app.inject({ method: 'POST', url: '/api/reset-db' })).statusCode, 403); }
  finally { process.env.DEMO_ALLOW_RESET = '1'; }
});

test('a welcome match is limited by device and bound to the signed-in account', async () => {
  const signup = await act(); assert.equal(signup.body.success, true);
  const me = (await app.inject({ url: '/api/me', headers: { cookie: signup.cookie } })).json();
  const wrong = await actAt('/api/deposit', { amountCents: 1000 }, { userHid: 'wrong-account' }, signup.cookie);
  assert.equal(wrong.body.success, false);
  const paid = await actAt('/api/deposit', { amountCents: 1000 }, { userHid: me.userHid }, signup.cookie);
  assert.equal(paid.body.success, true);
  const next = await act({ email: 'two@example.test' });
  const nextMe = (await app.inject({ url: '/api/me', headers: { cookie: next.cookie } })).json();
  const again = await actAt('/api/deposit', { amountCents: 1000 }, { userHid: nextMe.userHid }, next.cookie);
  assert.equal(again.body.success, true); assert.match(again.body.message, /already claimed/);
});

test('an unavailable History API never turns into a synthetic success', async () => {
  responseStatus = 401;
  assert.equal((await act()).body.success, false);
  assert.equal(calls.length, 1);
});
test('the delayed reread determines risk, not the early low score', async () => {
  transform = (row, count) => ({ ...row, score: count === 1 ? 15 : 80 });
  const result = await act();
  assert.equal(result.body.success, false);
  
  assert.equal(calls.length, 2);
});
test('a future timestamp on the second read is also refused', async () => {
  transform = (row, count) => count === 1 ? row : { ...row, created_at: new Date(Date.now() + 60_000).toISOString() };
  assert.equal((await act()).body.success, false);
});
test('reset while History is pending cannot repopulate cleared verification state', async () => {
  let release, announce;
  pausedFetch = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { announce = resolve; });
  markStarted = announce;
  const pending = act();
  await started;
  await app.inject({ method: 'POST', url: '/api/reset-db' });
  pausedFetch = undefined; release();
  const result = await pending;
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /reset/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM used_request_ids').get().n, 0);
});
