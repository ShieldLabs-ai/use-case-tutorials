import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
process.env.DEMO_DB_PATH = ':memory:';
process.env.DEMO_ALLOW_RESET = '1';
const [route, payload] = ["/api/saved",{"productId":1}];
const { app } = await import('../server/server.js');
const { db } = await import('../server/db.js');
beforeEach(async () => { await app.inject({ method: 'POST', url: '/api/reset-db' }); });
after(async () => { await app.close(); db.close(); });
test('personalization: its browser page works without keys or an SDK', async () => {
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

test('the browser shopper cookie preserves searches across requests', async () => {
  const first = await app.inject({url:'/api/profile'});
  const cookie = first.cookies.map(item=>item.name+'='+item.value).join('; ');
  assert.match(cookie,/shieldlabs_demo_personalization_shopper=/);
  await app.inject({url:'/api/search?q=lamp',headers:{cookie}});
  const profile = (await app.inject({url:'/api/profile',headers:{cookie}})).json();
  assert.deepEqual(profile.recentSearches,['lamp']);
});
