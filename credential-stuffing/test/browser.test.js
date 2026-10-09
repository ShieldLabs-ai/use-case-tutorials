import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/shieldlabs.js', import.meta.url), 'utf8');
let imports = 0;
async function browser(mock) {
  const previous = globalThis.window;
  globalThis.window = { SHIELDLABS_PUBLIC_KEY: 'synthetic-key', ShieldLabsJS: { load: async () => mock } };
  const code = source.replaceAll('export ', '');
  const mod = new Function(code + '\nreturn { identify, identifyOnFirstFocus, checkSignedInUser };')();
  imports += 1;
  return { ...mod, restore() { globalThis.window = previous; } };
}
test('the browser SDK returns request IDs and serializes simultaneous action checks', async () => {
  let active = 0, maximum = 0, count = 0;
  const mod = await browser({ identify: async () => {
    active++; maximum = Math.max(maximum, active); await new Promise(resolve => setTimeout(resolve, 2)); active--;
    return { requestId: 'request-' + (++count) };
  } });
  try { assert.deepEqual(await Promise.all([mod.identify(), mod.identify()]), ['request-1','request-2']); assert.equal(maximum, 1); }
  finally { mod.restore(); }
});
test('first focus shares its pending check with submit; another submit gets a fresh ID', async () => {
  let count = 0;
  const mod = await browser({ identify: async () => ({ requestId: String(++count) }) });
  try {
    const form = new EventTarget(); const handle = mod.identifyOnFirstFocus(form);
    form.dispatchEvent(new Event('focusin'));
    assert.equal(await handle.take(), '1'); assert.equal(await handle.take(), '2');
  } finally { mod.restore(); }
});
test('a failed agent returns no ID, never a made-up successful result', async () => {
  const mod = await browser({ identify: async () => { throw new Error('synthetic timeout'); } });
  try { assert.equal(await mod.identify(), null); } finally { mod.restore(); }
});
test('signed-in action uses its account HID without an extra background identification', async () => {
  const calls = [];
  const mod = await browser({ identify: async options => { calls.push(options); return { requestId: 'id' }; } });
  try {
    mod.checkSignedInUser('opaque-account'); assert.equal(calls.length, 0);
    const form = new EventTarget(); const handle = mod.identifyOnFirstFocus(form, { signedIn: true });
    assert.equal(await handle.take(), 'id'); assert.deepEqual(calls, [{ userId: 'opaque-account' }]);
  } finally { mod.restore(); }
});

test('unconfigured final does not call the scoring agent', async () => {
  let attempts=0;
  const mod=await browser({identify:async()=>{attempts++;return{requestId:'should-not-run'};}});
  try { window.SHIELDLABS_CONFIGURED=false; assert.equal(await mod.identify(),null); assert.equal(attempts,0); }
  finally { mod.restore(); }
});
