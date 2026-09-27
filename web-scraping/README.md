# ShieldLabs Web Scraping Tutorial

This tutorial shows how to protect proprietary data from scrapers with ShieldLabs: the flight search API serves prices to real browsers and refuses automated requests and Dangerous traffic.

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- web-scraping`.

## Setup

1. Install the dependencies (Node.js 20 or later):

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your ShieldLabs keys from **Integration > API keys**: the Public Key as `SHIELDLABS_PUBLIC_KEY` and the Private API Key (`sec_...`) as `SHIELDLABS_API_KEY`.
3. Start the server:

   ```bash
   npm run dev
   ```

4. Open the app on your development domain (see below).

The flights and prices are made up for the demo.

## Run it on your domain

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account: the Public Key is bound to that domain, so `localhost` and raw IP addresses are rejected. The starter branch runs on localhost as is. This branch needs your domain:

1. In the [dashboard](https://app.shieldlabs.ai/), register a development domain such as `tutorial.your-domain.com` as its own domain under **Integration > Domains**, rather than reusing your production keys. No account yet? [Start Free](https://app.shieldlabs.ai/): 5,000 identifications one time, no credit card.
2. Copy that domain's keys into `.env` (see Setup).
3. Tunnel the domain to `localhost:3000`, for example with Cloudflare Tunnel, and open `https://tutorial.your-domain.com`. The [root README](../README.md#the-domain-requirement) has the commands.

See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains) for the details.

## How it works

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` for every search. The request ID of that identification goes to the server with the search.
- `server/shieldlabs.js` reads the identification from the History API. The search returns no data when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/flights.js` runs that check before anything else, so direct calls to `/api/flights` without an identification get no prices either.

## Try it

1. Search for flights in your browser. The table fills with flights and prices.
2. Call the API directly, the way a scraper would:

   ```bash
   curl -s -X POST https://tutorial.your-domain.com/api/flights \
     -H 'Content-Type: application/json' \
     -d '{"from":"JFK","to":"LAX","date":"2026-12-01"}'
   ```

   The response has no flights: the request carries no identification.

## Run the bot test

With the server and the tunnel running, search from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The search returns no flights: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
