import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.DEMO_DB_PATH = ':memory:';
process.env.DEMO_ALLOW_RESET = '1';
const [route, payload] = ["/api/purchase",{"recipientEmail":"one@example.test","amount":25,"cardNumber":"4242424242424242","expiry":"12/30","cvc":"123"}];
const { app } = await import('../server/server.js');
const { db } = await import('../server/db.js');
beforeEach(async () => { await app.inject({ method: 'POST', url: '/api/reset-db' }); });
after(async () => { await app.close(); db.close(); });
test('card-testing: its browser page works without keys or an SDK', async () => {
  const response = await app.inject({ url: '/' }); assert.equal(response.statusCode, 200);
  assert.ok(!response.body.includes('/vendor/shieldlabs.js'));
});
test('the starting action succeeds without an identification', async () => {
  const response = await app.inject({ method: 'POST', url: route, payload });
  assert.equal(response.statusCode, 200); assert.equal(response.json().success, true);
});
test('reset starts this disposable tutorial over', async () => {
  assert.equal((await app.inject({ method: 'POST', url: route, payload })).json().success, true);
  assert.equal((await app.inject({ method: 'POST', url: '/api/reset-db' })).json().success, true);
  assert.equal((await app.inject({ method: 'POST', url: route, payload })).json().success, true);
});
