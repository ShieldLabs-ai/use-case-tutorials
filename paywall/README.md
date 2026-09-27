# ShieldLabs Paywall Tutorial

This tutorial shows how to enforce a metered paywall with ShieldLabs: free articles are counted per device, so opening an incognito window or clearing cookies does not reset the count.

See the full guide at [Paywall](https://docs.shieldlabs.ai/use-case/paywall).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- paywall`.

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

## Run it on your domain

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account: the Public Key is bound to that domain, so `localhost` and raw IP addresses are rejected. The starter branch runs on localhost as is. This branch needs your domain:

1. In the [dashboard](https://app.shieldlabs.ai/), register a development domain such as `tutorial.your-domain.com` as its own domain under **Integration > Domains**, rather than reusing your production keys. No account yet? [Start Free](https://app.shieldlabs.ai/): 5,000 identifications one time, no credit card.
2. Copy that domain's keys into `.env` (see Setup).
3. Tunnel the domain to `localhost:3000`, for example with Cloudflare Tunnel, and open `https://tutorial.your-domain.com`. The [root README](../README.md#the-domain-requirement) has the commands.

See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains) for the details.

## How it works

- `public/shieldlabs.js` loads the ShieldLabs snippet, and the article page runs `forceCheckAnonymous` on every view. The request ID of that identification goes to the server with the request for the article.
- `server/shieldlabs.js` reads the identification from the History API. The article stays locked when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/articles.js` meters free articles by Device ID instead of a cookie: 2 distinct articles every 24 hours. Opening an article already read today does not count again.

## Try it

1. Read two articles. The third one is locked.
2. Open the site in an incognito window, or clear the site's cookies, and open the third article again. It stays locked: the Device ID is the same, so the meter is too.
3. Open one of the two articles you already read. It still opens.

## Run the bot test

With the server and the tunnel running, open an article from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The article stays locked: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the article list, or run:

```bash
npm run reset-db
```
