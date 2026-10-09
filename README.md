# ShieldLabs use case tutorials

Twenty independent reference applications for visitor identification and abuse prevention. Every folder contains its own browser page, Fastify server, SQLite database, dependencies and tests. Copy one folder to use it; no other scenario or shared decision-lab server is required.

## Two versions

- `starter`: the app before integrating ShieldLabs. It works locally without keys.
- `final`: the same app with pinned browser and Node SDKs and a server-side decision.

Compare the integration with `git diff starter origin/final -- new-account-fraud`. Stop the server before switching versions and run `npm ci --omit=dev` again in the chosen app. Do not discard your own local changes just to switch branches; use another clone if necessary. The public default branch is `starter`; switch to `final` for the completed ShieldLabs integration.

## Applications

- [New account fraud](./new-account-fraud/README.md): One trial per Device ID.
- [Checkout review](./checkout-risk/README.md): Dangerous orders go to review.
- [Paywall enforcement](./paywall/README.md): Two distinct free articles per device per day.
- [Account sharing](./account-sharing/README.md): One active device per demo account.
- [Account takeover](./account-takeover/README.md): A new device needs another factor.
- [Ban evasion](./ban-evasion/README.md): A new account does not bypass a device ban.
- [Welcome bonus](./bonus-abuse/README.md): One welcome match per device.
- [Card testing](./card-testing/README.md): Declined attempts are counted per device.
- [Chargeback evidence](./chargeback-dispute/README.md): Store the verified device behind an order.
- [Coupon abuse](./coupon-abuse/README.md): One use of a code per device, with a code cooldown.
- [Credential stuffing](./credential-stuffing/README.md): Failed passwords are counted per device.
- [Loan application review](./loan-risk/README.md): Conflicting same-device applications need review.
- [Returning visitor personalization](./personalization/README.md): Preferences follow a verified device rather than only its session cookie.
- [First-order promotion](./promo-abuse/README.md): One first-order discount per device.
- [Referral fraud](./referral-fraud/README.md): Same-device referrals earn no reward.
- [Regional pricing](./regional-pricing/README.md): A regional price needs a matching unmasked connection.
- [SMS pumping](./sms-pumping/README.md): Three synthetic sends per device per day, with growing waits.
- [Survey fraud](./survey-fraud/README.md): One reward-bearing survey per device.
- [Sybil claims](./sybil-attack/README.md): One simulated airdrop claim per device.
- [Web scraping](./web-scraping/README.md): Unverified or automated searches receive no flight prices.

## Run one app

Use Node.js 22 or later. From the repository root:

```sh
git switch starter
cd new-account-fraud
npm ci --omit=dev
cp .env.example .env
npm run dev
```

Open http://127.0.0.1:3000. Replace the folder name to choose another app. To use the optional headless bot script, install dev dependencies with `npm ci`.

## Run final

Stop the starter server, switch to `final`, reinstall this app's dependencies and copy the final .env.example settings into .env. Use the Public Key and Private API Key for a hostname registered in **Integration > Domains**, copied from **Integration > API keys**. Serve the app through HTTPS on that hostname via your existing deployment or reverse proxy. The API does not automatically accept a customer's key on localhost. No particular hosting provider is required.

`public/shieldlabs.js` uses `@shieldlabs-ai/js@1.0.1` and sends a fresh request ID for an action. `server/shieldlabs.js` uses `@shieldlabs-ai/node@1.0.1` to read History and evaluate the identification. It rereads at least 11 seconds after the observation as a demo precaution, not a guaranteed finality marker. Failed, stale and reused checks do not authorize actions. Most examples refuse Dangerous traffic; checkout-risk sends a verified Dangerous order for review. Automation is refused in both. Read the code of the selected scenario for its own limits.

## Verify and reset

GitHub Actions checks every standalone folder on Node 22 and 24: folder independence, lockfile consistency, placeholder-only environment examples, JavaScript syntax, clean runtime installation, native tests and dependency audit. It uses no real account keys and does not run live scoring or the optional bot scripts. From the repository root, run `node scripts/check-tutorial.mjs` to check all folders or pass one folder name.

Run `npm run check` and `npm test` in each folder. Automated tests use isolated SQLite and synthetic History responses, not live scoring. `DEMO_ALLOW_RESET=1` enables the disposable reset control and `npm run reset-db` clears that app's teaching state. A schema change when switching starter/final may recreate the demo database. Never put important data there.

Live checks need your registered hostname and matching real History rows. Space identifications over a minute apart, avoid parallel checks and repeated cookie resets, and stop on rate limiting. Use only invented personal details and supplied sample cards. Deposits, purchases, reward credits, SMS, challenges and loan decisions are simulated.

## Production boundary

The examples are not drop-in production security modules. Demonstration passwords, moderation/reset controls and admin evidence screens are intentionally for a disposable demo. A real application needs its own authentication, authorization, session/action binding, durable state and a shared atomic replay store. The example device limits are not ShieldLabs High-Risk Event thresholds. Repository publication and green synthetic CI are not proof that every live scoring scenario has passed. Verify the completed app with your own registered hostname before adapting it.

## License

[MIT](./LICENSE)
