# ShieldLabs Sybil Attack Tutorial

This tutorial shows how to stop a sybil attack on a token airdrop with ShieldLabs: one claim per device, no matter how many wallet addresses the visitor tries.

See the full guide at [Sybil Attack](https://docs.shieldlabs.ai/use-case/sybil-attack).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- sybil-attack`.

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

1. Claim with wallet `0xAAA1112223334445556667778889990001112223`. It works.
2. Claim again with a different wallet, `0xBBB9998887776665554443332221110009998887`. It works too: nothing ties the claim to the browser that made it, so one visitor can generate wallet after wallet and claim the airdrop from each one.

## Run the bot test

With the server running, claim from headless Chrome:

```bash
node test-bot.js
```

The bot claims too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
