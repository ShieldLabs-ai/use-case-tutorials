# ShieldLabs Referral Fraud Tutorial

This tutorial shows how to stop referral fraud with ShieldLabs: a referral reward is paid only when the new signup and the referrer are on different devices, so one person cannot farm the reward by signing up "friends" from their own browser.

See the full guide at [Referral Fraud](https://docs.shieldlabs.ai/use-case/referral-fraud).

This is the **final** branch: the demo app with the ShieldLabs integration. The **starter** branch has the same app without protection. See what the integration adds with `git diff starter final -- referral-fraud`.

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

- `public/shieldlabs.js` loads the ShieldLabs snippet and runs `forceCheckAnonymous` when the user starts filling in the signup form. The request ID of that identification goes to the server with the signup.
- `server/shieldlabs.js` reads the identification from the History API. The signup is refused when the identification is missing, unverified, rate limited, older than 5 minutes or already used, when it shows browser automation or disabled JavaScript, or when its Risk Score is in the Dangerous band (60-100). The account is still created either way; only the identification is checked here, not the referral itself.
- `server/accounts.js` stores the Device ID behind every signup, including the referrer's own signup. When a new signup enters a referral code, the reward is paid only if its Device ID differs from the Device ID stored on the referrer's account. If the two match, the account is created normally but neither side gets the $10, and the response says so.

## Try it

1. Sign up with `riley@example.com`. Note the referral code shown, for example `RILEY482`.
2. In the same browser, sign up a second account, `riley.alt@example.com`, using that referral code. The account is created, but the reward is refused: self-referral detected. The Device ID is the same as riley's.
3. Open an incognito window, or a different browser, and sign up `casey@example.com` with the same code. This time both accounts earn $10: the Device ID is different.

## Run the bot test

With the server and the tunnel running, sign up from headless Chrome:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

The signup is refused: headless Chrome raises the Browser Automation signal.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
