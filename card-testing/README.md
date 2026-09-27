# ShieldLabs Card Testing Tutorial

This tutorial shows how to stop card testing with ShieldLabs: declined card attempts are capped per device, and automated or Dangerous checkouts are refused before they reach the payment processor.

See the full guide at [Card Testing](https://docs.shieldlabs.ai/use-case/card-testing).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- card-testing`.

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

Payments are simulated: `4242 4242 4242 4242` is approved and any other valid card number (for example `4111 1111 1111 1111`) is declined. Nothing is charged.

## Try it

1. Buy a gift card with `4111 1111 1111 1111`. The card is declined.
2. Try a few more card numbers. Every attempt goes to the payment processor, with no limit on how many cards one person can test.

## Run the bot test

With the server running, try a card from headless Chrome:

```bash
node test-bot.js
```

The bot's card reaches the payment processor too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
