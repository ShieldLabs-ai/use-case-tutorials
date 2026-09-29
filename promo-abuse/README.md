# ShieldLabs Promo Abuse Tutorial

This tutorial shows how to stop promo abuse with ShieldLabs: new customers get 20% off their first order automatically, based on whether their device has ordered before, so a new email address or cleared cookies cannot claim the discount again.

See the full guide at [Promo Abuse](https://docs.shieldlabs.ai/use-case/promo-abuse).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- promo-abuse`.

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

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the shopper starts filling in the checkout form. The request ID of that identification goes to the server with the order.
- `server/shieldlabs.js` reads the identification from the History API. The order is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/orders.js` grants the 20% first-order discount once per Device ID, not once per email: the Device ID stays the same when cookies are cleared, in an incognito window and on a new IP address. The "20% off" banner on the cart page is a preview only, driven by a plain cookie that is not a security control; the checkout call above is what actually decides the discount.

## Try it

1. Check out with the email `jordan@example.com`. You get 20% off.
2. Clear the site's cookies, or open an incognito window, and check out again with a different email, `jordan2@example.com`. You are charged full price: the message says you already used your first-order discount.

## Run the bot test

With the server and the tunnel running, check out from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The order is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
