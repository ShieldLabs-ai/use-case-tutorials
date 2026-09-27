# ShieldLabs Credential Stuffing Tutorial

This tutorial shows how to stop credential stuffing with ShieldLabs: failed sign-ins are counted per device, automated sign-ins are refused, and a correct password from a device the account has never used gets a verification challenge.

See the full guide at [Credential Stuffing](https://docs.shieldlabs.ai/use-case/credential-stuffing).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- credential-stuffing`.

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
- `server/shieldlabs.js` reads the identification from the History API. The attempt is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/accounts.js` counts failed sign-ins per Device ID: after 5 failures in 24 hours, the device is refused, even when the script rotates IP addresses or clears cookies. A correct password from a device the account has never used gets a one-time code by email first (simulated: the code is shown on the page). In the demo, the first device an account ever signs in from becomes its first known device.

## Try it

1. Sign in with `demo@example.com` / `demo-password`. This browser becomes the account's known device.
2. Sign in from a different browser with the same password. You are asked for a one-time code, as a script with a leaked password would be. Enter the code shown on the page to finish.
3. In a browser, enter 5 wrong passwords. The next attempt is refused, even with the right password: this device reached the limit of failed sign-ins.

## Run the bot test

With the server and the tunnel running, try a leaked password from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The attempt is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
