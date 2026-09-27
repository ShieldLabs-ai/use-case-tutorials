# ShieldLabs Paywall Tutorial

This tutorial shows how to enforce a metered paywall with ShieldLabs: free articles are counted per device, so opening an incognito window or clearing cookies does not reset the count.

See the full guide at [Paywall](https://docs.shieldlabs.ai/use-case/paywall).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- paywall`.

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

1. Read two articles. The third one is locked: the free limit is 2 articles a day.
2. Open the site in an incognito window, or clear the site's cookies, and open the third article again. It unlocks: the meter lives in a cookie, so a fresh cookie means a fresh meter.

## Run the bot test

With the server running, open an article from headless Chrome:

```bash
node test-bot.js
```

The bot reads the article too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the article list, or run:

```bash
npm run reset-db
```
