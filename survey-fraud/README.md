# ShieldLabs Survey Fraud Tutorial

This tutorial shows how to stop survey fraud with ShieldLabs: a paid survey accepts one submission per device, and automated or Dangerous submissions are refused.

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- survey-fraud`.

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

1. Answer the survey with `sam@example.com`. The $5 reward is paid.
2. Submit it again with the same email. It is refused: the app allows one submission per email.
3. Submit it again with `sam+2@example.com`. The reward is paid a second time: a new email address is all it takes.

## Run the bot test

With the server running, submit the survey from headless Chrome:

```bash
node test-bot.js
```

The bot collects a reward too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
