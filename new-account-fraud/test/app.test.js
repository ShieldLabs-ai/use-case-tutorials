import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.DEMO_DB_PATH = ':memory:';
process.env.DEMO_ALLOW_RESET = '1';
const [route, payload] = ["/api/signup",{"username":"tutorial_one","password":"synthetic-password"}];
const { app } = await import('../server/server.js');
const { db } = await import('../server/db.js');
beforeEach(async () => { await app.inject({ method: 'POST', url: '/api/reset-db' }); });
after(async () => { await app.close(); db.close(); });
test('new-account-fraud: its browser page works without keys or an SDK', async () => {
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
