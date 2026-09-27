# ShieldLabs Coupon Abuse Tutorial

This tutorial shows how to stop coupon abuse with ShieldLabs: each code can be redeemed once per device, a second code on the same device has to wait, and automated or Dangerous redemptions are refused.

See the full guide at [Coupon Abuse](https://docs.shieldlabs.ai/use-case/coupon-abuse).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- coupon-abuse`.

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

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the shopper starts typing a code. The request ID of that identification goes to the server with the code.
- `server/shieldlabs.js` reads the identification from the History API. The redemption is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100). This check runs before the code is looked up, so scripts guessing codes are refused too.
- `server/coupons.js` stores the Device ID with every redemption. A code already redeemed on the device is refused, and a second, different code on the same device has to wait an hour.

## Try it

1. Apply `WELCOME20`. You get 20% off.
2. Clear the site's cookies, or open an incognito window, and apply `WELCOME20` again. It is refused: the code was already used on this device.
3. Apply `SPRING10`. It is refused for now: this device redeemed another code less than an hour ago.

## Run the bot test

With the server and the tunnel running, redeem `WELCOME20` from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The redemption is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
