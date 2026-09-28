# ShieldLabs Promo Abuse Tutorial

This tutorial shows how to stop promo abuse with ShieldLabs: new customers get 20% off their first order automatically, based on whether their device has ordered before, so a new email address or cleared cookies cannot claim the discount again.

See the full guide at [Promo Abuse](https://docs.shieldlabs.ai/use-case/promo-abuse).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- promo-abuse`.

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

1. Check out with the email `jordan@example.com`. You get 20% off.
2. Reload the page and check out again with a different email, `jordan2@example.com`. You get 20% off again: nothing but the email field changed, and there is no code to remember or share.

## Run the bot test

With the server running, check out from headless Chrome:

```bash
node test-bot.js
```

The bot gets the discount too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
