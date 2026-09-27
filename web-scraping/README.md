# ShieldLabs Web Scraping Tutorial

This tutorial shows how to protect proprietary data from scrapers with ShieldLabs: the flight search API serves prices to real browsers and refuses automated requests and Dangerous traffic.

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- web-scraping`.

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

The flights and prices are made up for the demo.

## Try it

1. Search for flights. The table fills with flights and prices.
2. Call the API directly, the way a scraper would:

   ```bash
   curl -s -X POST http://localhost:3000/api/flights \
     -H 'Content-Type: application/json' \
     -d '{"from":"JFK","to":"LAX","date":"2026-12-01"}'
   ```

   The prices come back to anyone who asks.

## Run the bot test

With the server running, search from headless Chrome:

```bash
node test-bot.js
```

The bot gets the prices too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
