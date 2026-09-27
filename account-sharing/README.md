# ShieldLabs Account Sharing Tutorial

This tutorial shows how to enforce a one-device-at-a-time plan with ShieldLabs: a sign-in from a different device than the one already signed in is refused until the owner signs that device out.

See the full guide at [Account Sharing](https://docs.shieldlabs.ai/use-case/account-sharing).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- account-sharing`.

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

1. Sign in with the demo account `demo@example.com` / `demo-password`.
2. Open the app in a second browser (or on your phone through a tunnel) and sign in with the same account. It works, and the first browser is signed out without notice.
3. Sign in again in the first browser. The two viewers can keep taking the account back from each other: the app cannot tell a second person's device from the owner's own browser after cleared cookies, so the one-device rule does not hold.

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
