# ShieldLabs Chargeback Dispute Tutorial

This tutorial shows how to gather evidence against friendly-fraud chargebacks with ShieldLabs: every order stores the device, IP address and country behind it, so a disputed order can be shown next to the earlier orders the same device placed and never disputed.

See the full guide at [Chargeback Fraud](https://docs.shieldlabs.ai/use-case/chargeback-fraud).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- chargeback-dispute`.

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

4. Open the app on your development domain (see below): the shop at `/` and the admin page at `/admin.html`.

Payments are simulated: any card number is approved and nothing is charged.

## Run it on your domain

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account: the Public Key is bound to that domain, so `localhost` and raw IP addresses are rejected. The starter branch runs on localhost as is. This branch needs your domain:

1. In the [dashboard](https://app.shieldlabs.ai/), register a development domain such as `tutorial.your-domain.com` as its own domain under **Integration > Domains**, rather than reusing your production keys. No account yet? [Start Free](https://app.shieldlabs.ai/): 5,000 identifications one time, no credit card.
2. Copy that domain's keys into `.env` (see Setup).
3. Tunnel the domain to `localhost:3000`, for example with Cloudflare Tunnel, and open `https://tutorial.your-domain.com`. The [root README](../README.md#the-domain-requirement) has the commands.

See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains) for the details.

## How it works

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the buyer starts filling in the checkout form. The request ID of that identification goes to the server with the order.
- `server/shieldlabs.js` reads the identification from the History API. The order is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/orders.js` stores the Device ID, public IP address, country, Risk Score and request ID with every order. For a disputed order, the evidence lists the earlier orders from the same device that were never disputed, and the device's history read from the History API by Device ID.

The three orders the demo starts with are seed data with made-up identification details: Riley placed both of Riley's orders from one device.

## Try it

1. Buy tickets with the email `jordan@example.com`.
2. Clear the site's cookies, or open an incognito window, and buy tickets again with a different email, `jordan.work@example.com`.
3. On the admin page, simulate a chargeback on the second order and open its dispute evidence. It shows the first order, placed from the same device and never disputed, and the device's identifications in ShieldLabs History: evidence you can send with your dispute response.

## Run the bot test

With the server and the tunnel running, buy tickets from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The order is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
