# ShieldLabs Regional Pricing Tutorial

This tutorial shows how to enforce regional pricing with ShieldLabs: a regional discount applies only when the country of the shopper's connection matches it and the connection is not masked by a VPN, a proxy, Tor or a privacy relay.

See the full guide at [Regional Pricing](https://docs.shieldlabs.ai/use-case/regional-pricing).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- regional-pricing`.

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

The discount tiers in `server/tiers.js` are illustrative, made up for the demo.

## Run it on your domain

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account: the Public Key is bound to that domain, so `localhost` and raw IP addresses are rejected. The starter branch runs on localhost as is. This branch needs your domain:

1. In the [dashboard](https://app.shieldlabs.ai/), register a development domain such as `tutorial.your-domain.com` as its own domain under **Integration > Domains**, rather than reusing your production keys. No account yet? [Start Free](https://app.shieldlabs.ai/): 5,000 identifications one time, no credit card.
2. Copy that domain's keys into `.env` (see Setup).
3. Tunnel the domain to `localhost:3000`, for example with Cloudflare Tunnel, and open `https://tutorial.your-domain.com`. The [root README](../README.md#the-domain-requirement) has the commands.

See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains) for the details.

## How it works

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the shopper starts picking a country. The request ID of that identification goes to the server with the selected country.
- `server/shieldlabs.js` reads the identification from the History API. The list price stays when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/pricing.js` applies the regional price only when the connection is not masked (VPN, proxy, Tor, privacy relay, datacenter IP address or a browser VPN or proxy extension), the time zone of the device matches its location, and the country of the public IP address is the country the shopper selected.

## Try it

1. Select the country you are in and activate regional pricing. You get that country's price.
2. Select India (unless you are there) and activate regional pricing. It is refused: the connection is in another country.
3. Connect through a VPN with an exit in India and try again. It is still refused: the connection is masked.

## Run the bot test

With the server and the tunnel running, claim the India price from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The request is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
