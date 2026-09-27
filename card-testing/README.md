# ShieldLabs Card Testing Tutorial

This tutorial shows how to stop card testing with ShieldLabs: declined card attempts are capped per device, and automated or Dangerous checkouts are refused before they reach the payment processor.

See the full guide at [Card Testing](https://docs.shieldlabs.ai/use-case/card-testing).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- card-testing`.

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

Payments are simulated: `4242 4242 4242 4242` is approved and any other valid card number (for example `4111 1111 1111 1111`) is declined. Nothing is charged.

## Run it on your domain

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account: the Public Key is bound to that domain, so `localhost` and raw IP addresses are rejected. The starter branch runs on localhost as is. This branch needs your domain:

1. In the [dashboard](https://app.shieldlabs.ai/), register a development domain such as `tutorial.your-domain.com` as its own domain under **Integration > Domains**, rather than reusing your production keys. No account yet? [Start Free](https://app.shieldlabs.ai/): 5,000 identifications one time, no credit card.
2. Copy that domain's keys into `.env` (see Setup).
3. Tunnel the domain to `localhost:3000`, for example with Cloudflare Tunnel, and open `https://tutorial.your-domain.com`. The [root README](../README.md#the-domain-requirement) has the commands.

See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains) for the details.

## How it works

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the user starts filling in the checkout form. The request ID of that identification goes to the server with the payment.
- `server/shieldlabs.js` reads the identification from the History API. The checkout is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/orders.js` stores the Device ID with every payment attempt. After 3 declined cards from one device in 24 hours, further checkouts from that device are refused before they reach the payment processor, even after the cookies are cleared or the IP address changes.

## Try it

1. Buy a gift card with `4111 1111 1111 1111`. The card is declined.
2. Try two more declined card numbers, such as `4000 0000 0000 0002` and `5555 5555 5555 4444`.
3. Try `4242 4242 4242 4242`. The checkout is refused: this device reached the limit of 3 declined cards in 24 hours, so a card tester cannot keep trying cards.

## Run the bot test

With the server and the tunnel running, try a card from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The checkout is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
