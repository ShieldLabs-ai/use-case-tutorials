# ShieldLabs SMS Pumping Tutorial

This tutorial shows how to stop SMS pumping with ShieldLabs: verification codes are capped per device with a growing wait between them, and automated, Tor or Dangerous requests never reach your SMS provider.

See the full guide at [SMS Pumping](https://docs.shieldlabs.ai/use-case/sms-pumping).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- sms-pumping`.

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

The demo never sends a real SMS: the code is shown on the page instead.

## Try it

1. Enter a phone number with its country code and select **Send code**. The code appears in the demo phone box.
2. Select **Send code** again and again, with the same number or others. Every request would be an SMS you pay for: nothing limits how many codes one person can trigger.

## Run the bot test

With the server running, request a code from headless Chrome:

```bash
node test-bot.js
```

The bot gets a code sent too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
