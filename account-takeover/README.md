# ShieldLabs Account Takeover Tutorial

This tutorial shows how to stop account takeover with ShieldLabs: a correct password from a device the account has never used must pass a step-up check, and automated or Dangerous sign-ins are refused.

See the full guide at [Account Takeover](https://docs.shieldlabs.ai/use-case/account-takeover).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- account-takeover`.

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

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the user starts filling in the sign-in form. The request ID of that identification goes to the server with the credentials.
- `server/shieldlabs.js` reads the identification from the History API. The sign-in is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/accounts.js` keeps the known devices of each account, keyed by Device ID. A known device signs in with the password. A correct password from an unknown device gets a one-time code by email first (simulated: the code is shown on the page), and the device becomes known once the code is entered. In the demo, the first device an account ever signs in from becomes its first known device.
- The signed-in page calls `checkAuthenticatedUser` with a hashed account id, which ties the visit to the account for the High-Risk Events ShieldLabs detects on users, such as Account takeover.

## Try it

1. Sign in with the demo account `demo@example.com` / `demo-password`. This is the account owner, and this browser becomes the first known device.
2. Sign out, then sign in from a different browser with the same password, as someone with a leaked password would. The app asks for a one-time code instead of letting them in.
3. Enter the code shown on the page. The new device is added to **Known devices**, and later sign-ins from it need only the password.

## Run the bot test

With the server and the tunnel running, sign in from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The sign-in is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
