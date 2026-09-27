# ShieldLabs Coupon Abuse Tutorial

This tutorial shows how to stop coupon abuse with ShieldLabs: each code can be redeemed once per device, a second code on the same device has to wait, and automated or Dangerous redemptions are refused.

See the full guide at [Coupon Abuse](https://docs.shieldlabs.ai/use-case/coupon-abuse).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- coupon-abuse`.

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

## Try it

1. Apply `WELCOME20`, the first-order code. You get 20% off.
2. Reload the page and apply `WELCOME20` again, then `SPRING10`. Every redemption works: the first-order code can be used on every order, by anyone who finds it.

## Run the bot test

With the server running, redeem `WELCOME20` from headless Chrome:

```bash
node test-bot.js
```

The bot gets the discount too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
