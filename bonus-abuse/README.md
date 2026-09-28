# ShieldLabs Bonus Abuse Tutorial

This tutorial shows how to stop bonus abuse with ShieldLabs: a device gets the welcome deposit match once, no matter how many accounts sign up to claim it again, and automated or Dangerous signups and deposits are refused.

See the full guide at [Bonus Abuse](https://docs.shieldlabs.ai/use-case/bonus-abuse).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- bonus-abuse`.

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

1. Create an account and make a deposit, for example $50. A $50 welcome bonus is credited (100% match, up to $100).
2. Sign out, create a second account with a different email, and deposit again. It works: nothing ties the new account to the browser that already claimed a bonus, so one person can keep opening accounts to collect the match over and over.
3. Select **Reset demo DB** to start over.

## Run the bot test

With the server running, sign up from headless Chrome:

```bash
node test-bot.js
```

The bot signs up too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
