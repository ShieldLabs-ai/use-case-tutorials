# ShieldLabs Regional Pricing Tutorial

This tutorial shows how to enforce regional pricing with ShieldLabs: a regional discount applies only when the country of the shopper's connection matches it and the connection is not masked by a VPN, a proxy, Tor or a privacy relay.

See the full guide at [Regional Pricing](https://docs.shieldlabs.ai/use-case/regional-pricing).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- regional-pricing`.

## Setup

1. Install the dependencies (Node.js 20 or later):

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`.
3. Start the server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The discount tiers in `server/tiers.js` are illustrative, made up for the demo.

## Try it

1. Activate regional pricing for your own country. You see the price for your region.
2. Select India and activate regional pricing again. You get 60% off: the app trusts the country the shopper selects, so anyone can pick the cheapest region.

## Run the bot test

With the server running, claim the India price from headless Chrome:

```bash
node test-bot.js
```

The bot gets the discount too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
