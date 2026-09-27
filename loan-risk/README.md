# ShieldLabs Loan Application Fraud Tutorial

This tutorial shows how to catch loan application fraud with ShieldLabs: when the same device resubmits an application with a different name or income, the application is flagged for review instead of getting an instant offer.

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- loan-risk`.

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

1. Apply as Alex Morgan with a monthly income of 2,000 for a 20,000 loan over 12 months. The application is declined: the payment is too high for that income.
2. Apply again with the same details and a monthly income of 9,000. The loan is approved: the app decides on each application alone, so changing the income until the answer is yes works.

## Run the bot test

With the server running, apply from headless Chrome:

```bash
node test-bot.js
```

The bot gets an offer too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
