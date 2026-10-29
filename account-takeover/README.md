# ShieldLabs Account takeover tutorial

This folder is a standalone application, on the **final** branch. Its `starter` version runs without ShieldLabs; its `final` version adds the pinned JS and Node SDKs and the following teaching rule: **A new device needs another factor**.

## Run this application

Use Node.js 22 or later. From this folder:

```sh
npm ci --omit=dev
cp .env.example .env
npm run dev
```

The starter runs at http://127.0.0.1:3000 and needs no keys. The final needs a registered HTTPS hostname and the matching Public Key and Private API Key from **Integration > API keys**. Put them in `SHIELDLABS_PUBLIC_KEY` and `SHIELDLABS_API_KEY` in .env. Resolve the registered hostname with `GET /api/v1/domains` using the Private API Key, or OAuth MCP `shieldlabs_list_domains`, and set its public UUID as `SHIELDLABS_DOMAIN_ID`. A hostname is not a domain UUID. The Private API Key stays on the server. Use your existing deployment/reverse proxy: no hosting provider is required. The service does not automatically accept a customer's key on localhost.

## Compare starter and final

Stop the server before switching versions. From the repository root run `git diff starter origin/final -- account-takeover`, then switch branches and reinstall dependencies in this folder. Preserve your own uncommitted work in another clone rather than discarding it. Ignored .env files stay local; fill the final settings when moving from starter. Schema differences may recreate this app's disposable database.

In final, `public/shieldlabs.js` uses `@shieldlabs-ai/js@1.1.0` and sends a fresh action request ID. `server/shieldlabs.js` retrieves History with `@shieldlabs-ai/node@1.3.0`, rejects missing, stale, reused, Banned IP and unusable results and applies the configured risk guard. It reads the domain-scoped identification card, validates risk and signal availability, and waits within a ten-second budget for that same ID when processing is pending. No extra browser identification is created while polling. The other modules in `server/` implement this app's rule and its own SQLite state. No sibling folder or root shared server is required.

## Try it

Sign in with demo@example.com / demo-password. From another observed device, enter the demo code shown on the page to finish the challenge. No email is sent.

Only use invented information and provided demo credentials/sample cards. Payments, orders, challenges, messages and rewards are simulated. This exercise is not a real loan decision or a transfer of funds. Keep live identifications over a minute apart and stop on rate limiting. Compare actual History Device IDs before interpreting private-window or changed-cookie behavior.

## Verify

```sh
npm run check
npm test
```

Tests use an isolated database and synthetic History responses; they do not call real scoring. The final suite covers this scenario, real SDK normalization, replay/freshness/automation guards, unavailable History, late updates and reset during a pending read. These tests do not substitute for a live check with the registered hostname.

The optional `test-bot.js` needs dev dependencies: install with `npm ci`. Run it only in a controlled browser-test environment. This branch's ordinary app and native tests work with `npm ci --omit=dev`.

## Reset and production boundary

`DEMO_ALLOW_RESET=1` enables **Reset demo DB**; `npm run reset-db` clears this folder's teaching state. Do not keep important information in db.sqlite. Demonstration accounts, reset/moderator tools and admin screens are not production authorization. Add your own authentication, session/action binding, durable state and shared replay storage before adapting the app. The teaching thresholds are not ShieldLabs High-Risk Event thresholds.

Guide: [Account takeover](https://docs.shieldlabs.ai/tutorials/new-login-device) .
