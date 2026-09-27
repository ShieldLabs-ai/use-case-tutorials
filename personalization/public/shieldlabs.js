// Browser side of the ShieldLabs integration.
//
// Loads the ShieldLabs snippet with your Public Key (served by /config.js) and runs
// one identification per protected action. The snippet only runs on the domain you
// added in the ShieldLabs dashboard, not on localhost: see the README.

const snippet = import(
  `https://cdn.shieldlabs.ai/snippet.js?publicKey=${encodeURIComponent(window.SHIELDLABS_PUBLIC_KEY ?? '')}`
).catch((error) => {
  console.error('The ShieldLabs snippet did not load.', error);
  return null;
});

// Runs a fresh identification and resolves with its request ID, or with null when
// no check ran. The browser never sees a Risk Score: the server reads the result.
// forceCheckAnonymous runs even inside the snippet's five-minute window, so every
// action gets its own identification. For an action by a signed-in user, call
// forceCheckAuthenticatedUser(hashedUserId, { onInitialized }) instead, with a
// hashed account id, never a raw email or username.
export function identify() {
  return new Promise((resolve) => {
    // Give up after 10 seconds: the server then refuses the action as unverified.
    const timer = setTimeout(() => resolve(null), 10_000);
    const done = (requestId) => {
      clearTimeout(timer);
      resolve(requestId);
    };

    snippet.then((shieldlabs) => {
      if (!shieldlabs) return done(null);
      // Pass the callback as { onInitialized }: a bare function is ignored.
      shieldlabs.forceCheckAnonymous({
        onInitialized: (result) => done(result.status === 'initialized' ? result.requestID : null),
      });
    });
  });
}
