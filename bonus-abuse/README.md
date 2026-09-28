# ShieldLabs Bonus Abuse Tutorial

This tutorial shows how to stop bonus abuse with ShieldLabs: a device gets the welcome deposit match once, no matter how many accounts sign up to claim it again, and automated or Dangerous signups and deposits are refused.

See the full guide at [Bonus Abuse](https://docs.shieldlabs.ai/use-case/bonus-abuse).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- bonus-abuse`.

## Setup

1. Install the dependencies (Node.js 20 or later):

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your ShieldLabs keys from **Integration > API keys**: the Public Key as `SHIELDLABS_PUBLIC_KEY` and the Private API Key (`sec_...`) as `SHIELDLABS_API_KEY`.
3. Start the server:

   ```bash
   npm run dev
   ```

4. Open the app on your development domain (see below).

## Run it on your domain

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account: the Public Key is bound to that domain, so `localhost` and raw IP addresses are rejected. The starter branch runs on localhost as is. This branch needs your domain:

1. In the [dashboard](https://app.shieldlabs.ai/), register a development domain such as `tutorial.your-domain.com` as its own domain under **Integration > Domains**, rather than reusing your production keys. No account yet? [Start Free](https://app.shieldlabs.ai/): 5,000 identifications one time, no credit card.
2. Copy that domain's keys into `.env` (see Setup).
3. Tunnel the domain to `localhost:3000`, for example with Cloudflare Tunnel, and open `https://tutorial.your-domain.com`. The [root README](../README.md#the-domain-requirement) has the commands.

See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains) for the details.

## How it works

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the user starts filling in the signup form or the deposit form. The request ID of that identification goes to the server with the request.
- `server/shieldlabs.js` reads the identification from the History API. The signup or deposit is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/wallet.js` credits the 100% welcome match, up to $100, on the first deposit made from a device, keyed by Device ID rather than by account: opening a new account from the same device does not unlock a second match.
- The signed-in page calls `checkAuthenticatedUser` with a hashed account id, which ties the visit to the account for the High-Risk Events ShieldLabs detects on users, such as Multi-accounting.

## Try it

1. Create an account and make a deposit, for example $50. A $50 welcome bonus is credited (100% match, up to $100).
2. Sign out, create a second account from the same browser, and deposit again, as someone opening account after account would. No match this time: the Device ID already claimed one, even though the account is brand new.
3. Select **Reset demo DB** to start over.

## Run the bot test

With the server and the tunnel running, sign up from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The signup is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
