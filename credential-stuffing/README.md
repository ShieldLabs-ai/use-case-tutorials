# ShieldLabs Credential Stuffing Tutorial

This tutorial shows how to stop credential stuffing with ShieldLabs: failed sign-ins are counted per device, automated sign-ins are refused, and a correct password from a device the account has never used gets a verification challenge.

See the full guide at [Credential Stuffing](https://docs.shieldlabs.ai/use-case/credential-stuffing).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- credential-stuffing`.

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

1. Sign in to `demo@example.com` with a few wrong passwords. Every attempt is checked, with no limit.
2. Sign in with the right password, `demo-password`. You are in, from any device: a script working through a leaked password list would be too.

## Run the bot test

With the server running, try a leaked password from headless Chrome:

```bash
node test-bot.js
```

The bot's attempt is checked like any other.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
