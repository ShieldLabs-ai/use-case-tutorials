# ShieldLabs Account Takeover Tutorial

This tutorial shows how to stop account takeover with ShieldLabs: a correct password from a device the account has never used must pass a step-up check, and automated or Dangerous sign-ins are refused.

See the full guide at [Account Takeover](https://docs.shieldlabs.ai/use-case/account-takeover).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- account-takeover`.

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

1. Sign in with the demo account `demo@example.com` / `demo-password`. This is the account owner on their usual device.
2. Sign out, then sign in from a second browser with the same password, as someone who bought a leaked password would. The app lets them straight in: the password is the only check.

## Run the bot test

With the server running, sign in from headless Chrome:

```bash
node test-bot.js
```

The bot signs in too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
