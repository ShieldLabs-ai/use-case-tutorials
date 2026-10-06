// The pinned browser SDK is served locally by this app, not by a sibling folder.
// Only request IDs go to the backend. No Private API Key or risk result is here.
let agentPromise;
let queue = Promise.resolve();
let signedInUserHid;

function agent() {
  if (!agentPromise) {
    agentPromise = Promise.resolve().then(() => window.ShieldLabsJS.load({ publicKey: window.SHIELDLABS_PUBLIC_KEY, timeout: 10_000 }));
    agentPromise.catch(() => { agentPromise = undefined; });
  }
  return agentPromise;
}

export function identify(userId) {
  const task = queue.then(async () => {
    const loaded = await agent();
    const result = await loaded.identify(userId ? { userId } : undefined);
    return result.requestId;
  }).catch(() => null); // null means unverified; the server must refuse it.
  queue = task.then(() => undefined);
  return task;
}

export function identifyOnFirstFocus(form, { signedIn = false } = {}) {
  let pending;
  let startedAt = 0;
  const start = () => {
    if (!pending || Date.now() - startedAt > 240_000) {
      startedAt = Date.now();
      pending = identify(signedIn ? signedInUserHid : undefined);
    }
    return pending;
  };
  form.addEventListener('focusin', start);
  return { take() { const result = start(); pending = undefined; return result; } };
}

// Record the server-computed account HID for the next signed-in action, rather
// than launching an extra background check immediately after every signup.
export function checkSignedInUser(userId) {
  signedInUserHid = typeof userId === 'string' && userId ? userId : undefined;
}
