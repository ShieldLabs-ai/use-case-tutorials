# ShieldLabs Chargeback Dispute Tutorial

This tutorial shows how to gather evidence against friendly-fraud chargebacks with ShieldLabs: every order stores the device, IP address and country behind it, so a disputed order can be shown next to the earlier orders the same device placed and never disputed.

See the full guide at [Chargeback Fraud](https://docs.shieldlabs.ai/use-case/chargeback-fraud).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- chargeback-dispute`.

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

4. Open [http://localhost:3000](http://localhost:3000) for the shop and [http://localhost:3000/admin.html](http://localhost:3000/admin.html) for the admin page.

Payments are simulated: any card number is approved and nothing is charged.

## Try it

1. Buy tickets with the email `jordan@example.com`.
2. Buy tickets again with a different email, `jordan.work@example.com`.
3. On the admin page, simulate a chargeback on the second order and open its dispute evidence. All you have is the order itself: nothing links it to the first order, so you cannot show that the same customer bought before without complaint.

## Run the bot test

With the server running, buy tickets from headless Chrome:

```bash
node test-bot.js
```

The bot's order goes through too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
