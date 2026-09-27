# ShieldLabs SMS Pumping Tutorial

This tutorial shows how to stop SMS pumping with ShieldLabs: verification codes are capped per device with a growing wait between them, and automated, Tor or Dangerous requests never reach your SMS provider.

See the full guide at [SMS Pumping](https://docs.shieldlabs.ai/use-case/sms-pumping).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- sms-pumping`.

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

The demo never sends a real SMS: the code is shown on the page instead.

## Run it on your domain

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account: the Public Key is bound to that domain, so `localhost` and raw IP addresses are rejected. The starter branch runs on localhost as is. This branch needs your domain:

1. In the [dashboard](https://app.shieldlabs.ai/), register a development domain such as `tutorial.your-domain.com` as its own domain under **Integration > Domains**, rather than reusing your production keys. No account yet? [Start Free](https://app.shieldlabs.ai/): 5,000 identifications one time, no credit card.
2. Copy that domain's keys into `.env` (see Setup).
3. Tunnel the domain to `localhost:3000`, for example with Cloudflare Tunnel, and open `https://tutorial.your-domain.com`. The [root README](../README.md#the-domain-requirement) has the commands.

See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains) for the details.

## How it works

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` for every code request, resends included. The request ID of that identification goes to the server with the phone number.
- `server/shieldlabs.js` reads the identification from the History API. The request is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100). `server/sms.js` also refuses requests over Tor.
- `server/sms.js` caps codes per Device ID: 3 a day, with a wait of 30 seconds before the second code and 60 seconds before the third. Clearing cookies, opening an incognito window or entering another phone number does not reset it.

## Try it

1. Enter a phone number with its country code and select **Send code**. The code appears in the demo phone box.
2. Select **Send code** again right away. It is refused: wait 30 seconds before the second code.
3. After 30 seconds, send the second code, and after 60 more seconds, the third. A fourth code the same day is refused, even with another phone number or from an incognito window.

## Run the bot test

With the server and the tunnel running, request a code from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The request is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
