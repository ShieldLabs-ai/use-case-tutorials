# ShieldLabs Account Sharing Tutorial

This tutorial shows how to enforce a one-device-at-a-time plan with ShieldLabs: a sign-in from a different device than the one already signed in is refused until the owner signs that device out.

See the full guide at [Account Sharing](https://docs.shieldlabs.ai/use-case/account-sharing).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- account-sharing`.

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

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the user starts filling in the sign-in form. The request ID of that identification goes to the server with the credentials.
- `server/shieldlabs.js` reads the identification from the History API. The sign-in is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100).
- `server/accounts.js` stores the Device ID with each session. A sign-in from a different device than the active session's is refused, unless the user chooses **Sign out the other device and sign in here**. The same device signing in again, after clearing cookies or in an incognito window, keeps working.
- The signed-in page checks its session every 5 seconds and says so when another device signed it out. It also calls `checkAuthenticatedUser` with a hashed account id, which ties the visit to the account for the High-Risk Events ShieldLabs detects on users, such as Account sharing.

## Try it

1. Sign in with the demo account `demo@example.com` / `demo-password`.
2. Open an incognito window in the same browser and sign in again. It works without a prompt: the Device ID is the same, so this is still one device, and the new session replaces the old one.
3. Open the app in a different browser, or on your phone, and sign in. It is refused: the account is signed in on another device.
4. Select **Sign out the other device and sign in here**. Within a few seconds the first browser shows that it was signed out on another device.

## Run the bot test

With the server and the tunnel running, sign in from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The sign-in is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
