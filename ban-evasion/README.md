# ShieldLabs Ban Evasion Tutorial

This tutorial shows how to make bans stick with ShieldLabs: banning a member also bans every device they signed in from, so a fresh account on the same device does not get them back in.

See the full guide at [Ban Evasion](https://docs.shieldlabs.ai/use-case/ban-evasion).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- ban-evasion`.

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

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the user starts filling in the account form. The request ID of that identification goes to the server with the signup or the sign-in.
- `server/shieldlabs.js` reads the identification from the History API. The signup or sign-in is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/forum.js` records the Device ID of every signup and sign-in for each member. Banning a member bans all of those devices too, and a new account or a sign-in from a banned device is refused.

## Try it

1. Sign up as a new member, for example `trouble_1`, and write a post.
2. In **Moderator tools**, ban `trouble_1`. The ban covers the account and the device it used.
3. Clear the site's cookies, or open an incognito window, and sign up as `trouble_2`. It is refused: the Device ID is the same, and the device is banned.

## Run the bot test

With the server and the tunnel running, create an account from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The signup is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
