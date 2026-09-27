# ShieldLabs New Account Fraud Tutorial

This tutorial shows how to stop new account fraud, such as free trial abuse and multi-accounting, with ShieldLabs: one free trial per device, and no trial for automated or Dangerous signups.

See the full guide at [New Account Fraud](https://docs.shieldlabs.ai/use-case/new-account-fraud).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- new-account-fraud`.

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

1. Start a trial with any username and password.
2. Start another trial with a different username. It works: nothing ties the second signup to the first, so one person can keep claiming new trials.

## Run the bot test

With the server running, sign up from headless Chrome:

```bash
node test-bot.js
```

The bot gets a trial too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
