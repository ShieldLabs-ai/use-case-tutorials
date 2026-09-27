# ShieldLabs Returning Visitor Tutorial

This tutorial shows how to recognize a returning visitor with ShieldLabs: search history and saved items are keyed to the device, so they are still there in an incognito window or after the visitor clears cookies.

See the full guide at [Returning Visitor](https://docs.shieldlabs.ai/use-case/returning-visitor).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without ShieldLabs. See what the integration adds with `git diff starter final -- personalization`.

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

- When the browser has no session yet (a first visit, an incognito window, cleared cookies), the page runs `forceCheckAnonymous` once through `public/shieldlabs.js` and sends the request ID to the server.
- `server/shieldlabs.js` reads the identification from the History API. Personalization stays off when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/sessions.js` maps a session cookie to the Device ID, and `server/store.js` keys the recent searches and saved items by that Device ID. A new cookie on the same device finds the same history.

## Try it

1. Search for `lamp` and `mug`, and save a couple of products.
2. Open the store in an incognito window, or clear the site's cookies and reload. Your recent searches and saved items are still there: the Device ID is the same.
3. Open the store in a different browser. It starts empty: that is another device.

## Run the bot test

With the server and the tunnel running, search and save a product from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

Personalization stays off for the bot: headless Chrome raises the Browser Automation signal, so nothing is saved for it.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
