# ShieldLabs Referral Fraud Tutorial

This tutorial shows how to stop referral fraud with ShieldLabs: a referral reward is paid only when the new signup and the referrer are on different devices, so one person cannot farm the reward by signing up "friends" from their own browser.

See the full guide at [Referral Fraud](https://docs.shieldlabs.ai/use-case/referral-fraud).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- referral-fraud`.

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

1. Sign up with `riley@example.com`. Note the referral code shown, for example `RILEY482`.
2. In the same browser, sign up a second account, `riley.alt@example.com`, using that referral code. It works: both accounts get $10, even though the same person just referred themselves.
3. The app has no way to tell that step 2 was the same person as step 1 on the same device. Anyone can repeat this with a new email address each time and collect the reward indefinitely.

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
