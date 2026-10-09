# ShieldLabs Survey fraud tutorial

This folder is a standalone application, on the **final** branch. Its `starter` version runs without ShieldLabs; its `final` version adds the pinned JS and Node SDKs and the following teaching rule: **One reward-bearing survey per device**.

## Run this application

Use Node.js 22 or later. From this folder:

```sh
npm ci --omit=dev
cp .env.example .env
npm run dev
```

The starter runs at http://127.0.0.1:3000 and needs no keys. The final needs a registered HTTPS hostname and the matching Public Key and Private API Key from **Integration > API keys**. Put them in `SHIELDLABS_PUBLIC_KEY` and `SHIELDLABS_API_KEY` in .env. The Private API Key stays on the server. Use your existing deployment/reverse proxy: no hosting provider is required. The service does not automatically accept a customer's key on localhost.

## Compare starter and final

Stop the server before switching versions. From the repository root run `git diff starter origin/final -- survey-fraud`, then switch branches and reinstall dependencies in this folder. Preserve your own uncommitted work in another clone rather than discarding it. Ignored .env files stay local; fill the final settings when moving from starter. Schema differences may recreate this app's disposable database.

In final, `public/shieldlabs.js` uses `@shieldlabs-ai/js@1.0.1` and sends a fresh action request ID. `server/shieldlabs.js` retrieves History with `@shieldlabs-ai/node@1.0.1`, rejects missing, stale, reused, limited and unusable results and applies the configured risk guard. It rereads after an 11-second observation delay as a demo precaution, not a server-guaranteed finality marker. The other modules in `server/` implement this app's rule and its own SQLite state. No sibling folder or root shared server is required.

## Try it

Complete the sample survey, then change the email and repeat from the same device. The second reward-bearing submission is refused. No gift card is sent.

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

Guide: [Survey fraud](https://docs.shieldlabs.ai/tutorials/rewarded-survey) (the new guide stays local until its separate documentation release).
