# ShieldLabs Sybil Attack Tutorial

This tutorial shows how to stop a sybil attack on a token airdrop with ShieldLabs: one claim per device, no matter how many wallet addresses the visitor tries.

See the full guide at [Sybil Attack](https://docs.shieldlabs.ai/use-case/sybil-attack).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- sybil-attack`.

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

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the user starts filling in the claim form. The request ID of that identification goes to the server with the claim.
- `server/shieldlabs.js` reads the identification from the History API. The claim is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/claims.js` stores the Device ID with each claim and refuses a second claim from the same device, no matter which wallet address it uses. A sybil attacker who generates a new wallet for every claim still hits the same device gate.

## Try it

1. Claim with wallet `0xAAA1112223334445556667778889990001112223`. 100 ACME tokens are claimed.
2. Clear the site's cookies, or open an incognito window, and claim with a different wallet, `0xBBB9998887776665554443332221110009998887`. It is refused: the Device ID is the same, so the airdrop already sees this device as claimed, with the earlier wallet.
3. Select **Reset demo DB** to start over.

## Run the bot test

With the server and the tunnel running, claim from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The claim is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
