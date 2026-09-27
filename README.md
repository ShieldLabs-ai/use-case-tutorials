# ShieldLabs use case tutorials

This repository contains runnable tutorials that show how to use [ShieldLabs](https://shieldlabs.ai) to detect and stop common fraud and abuse: fake signups, account takeover, coupon and paywall abuse, card testing, SMS pumping, scraping and more.

ShieldLabs is a fraud detection and prevention API. A JavaScript snippet identifies each visit in the browser, and your backend reads the result of that identification: the Device ID, the Visitor ID, a Risk Score from 0 to 100 and the named risk signals behind it.

Each tutorial is a self-contained demo application with a **starter** branch (the app without protection) and a **final** branch (the completed ShieldLabs integration). The difference between the two branches is exactly what the integration adds:

```bash
git diff starter final -- new-account-fraud
```

## Tutorials

- [**Account sharing prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/account-sharing): keep one device signed in per account and let the owner sign the other device out.
- [**Account takeover prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/account-takeover): step up a sign-in that brings the right password from a device the account has never used.
- [**Ban evasion prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/ban-evasion): ban every device a banned user signed in from, so a fresh account does not get them back in.
- [**Card testing prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/card-testing): cap declined card attempts per device and refuse automated checkouts.
- [**Chargeback dispute evidence**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/chargeback-dispute): store the device behind every order and assemble evidence against friendly-fraud chargebacks.
- [**Coupon abuse prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/coupon-abuse): allow one redemption per code per device, with a cooldown before a second code.
- [**Credential stuffing prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/credential-stuffing): limit failed sign-ins per device, refuse automation and challenge sign-ins from unknown devices.
- [**Loan application fraud prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/loan-risk): flag applications whose name or income changes between attempts from the same device.
- [**New account fraud prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/new-account-fraud): allow one free trial per device and refuse automated or Dangerous signups.
- [**Paywall enforcement**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/paywall): meter free articles per device, so incognito windows and cleared cookies do not reset the count.
- [**Returning visitor personalization**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/personalization): keep search history and saved items for a returning device, even in incognito or after cookies are cleared.
- [**Regional pricing enforcement**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/regional-pricing): apply a regional discount only for the country of an unmasked connection.
- [**SMS pumping prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/sms-pumping): cap verification codes per device with a growing wait, and refuse automation and Tor.
- [**Survey fraud prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/survey-fraud): accept one paid survey submission per device.
- [**Web scraping prevention**](https://github.com/ShieldLabs-ai/use-case-tutorials/tree/starter/web-scraping): serve flight prices to real browsers and refuse automated requests.

## General setup

You need Node.js 20 or later.

1. Clone this repo and, **within the folder of the use case you want to try**, install the dependencies:

   ```bash
   npm install
   ```

   This also downloads a Chrome build for the Puppeteer bot test.

2. Copy `.env.example` to `.env`. On the final branch, add your ShieldLabs keys (see below).

3. Start the server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) for the starter branch, or your development domain for the final branch.

## The domain requirement

The ShieldLabs snippet only runs on a domain you added and verified in your ShieldLabs account. The Public Key is bound to that domain, so pages served from `localhost` or a raw IP address are rejected. The starter branch runs on [http://localhost:3000](http://localhost:3000) as is. To run the final branch:

1. [Start Free](https://app.shieldlabs.ai/) (5,000 identifications one time, no credit card) or sign in to the dashboard.
2. Register a development domain, for example `tutorial.your-domain.com`, as its own domain under **Integration > Domains**, rather than reusing the keys of your production domain. The hostname must resolve in public DNS. The first identification from the domain verifies it. If you serve the app on a subdomain of the domain you registered, keep its subdomains **Accepted** (the default). On the Free and Starter plans your account holds one domain, so the development domain takes that slot. See [Environments](https://docs.shieldlabs.ai/setup/environments) and [Domains](https://docs.shieldlabs.ai/setup/domains).
3. Open **Integration > API keys** for that domain and copy its keys into `.env`: the **Public Key** as `SHIELDLABS_PUBLIC_KEY` (it goes to the browser) and the **Private API Key** (`sec_...`) as `SHIELDLABS_API_KEY` (it stays on the server).
4. Tunnel the domain to your local server. With [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/), for a domain whose DNS is on Cloudflare:

   ```bash
   cloudflared tunnel login
   cloudflared tunnel create shieldlabs-tutorial
   cloudflared tunnel route dns shieldlabs-tutorial tutorial.your-domain.com
   cloudflared tunnel run --url http://localhost:3000 shieldlabs-tutorial
   ```

   Any tunnel or reverse proxy that serves the app on your registered hostname works.

5. Run `npm run dev` and open `https://tutorial.your-domain.com`.

## How the final apps use ShieldLabs

- **In the browser**, `public/shieldlabs.js` loads the snippet from `cdn.shieldlabs.ai` with the Public Key served by `/config.js`. When the user starts an action (the first focus of the form), it runs `forceCheckAnonymous` and waits for the request ID of that identification, which the page sends to the server with the form. The browser never sees a Risk Score.
- **On the server**, `server/shieldlabs.js` reads the identification from the [History API](https://docs.shieldlabs.ai/api/server-api) with the Private API Key. Scoring is asynchronous, so it polls every half second for up to about 10 seconds.
- **Every protected handler starts with the same guard**: no identification is refused as unverified (never treated as clean), the 999 rate-limit marker and the all-zero Device ID are refused, an identification older than 5 minutes or already used for another action is refused, and browser automation, disabled JavaScript or a Risk Score in the Dangerous band is refused. Risk Score bands: **Trusted** 0-29, **Suspicious** 30-59, **Dangerous** 60-100.
- **The use case rule keys on the Device ID**, which holds through cleared cookies, incognito windows and IP changes. The Visitor ID changes when cookies are cleared, so the tutorials do not key on it.

The refusal messages in the demos name the reason to make the tutorials easy to follow. In production, show a generic message and log the reason.

## Run the bot test

Each app has a `test-bot.js` Puppeteer script that runs the main flow in headless Chrome and prints the server's answer. On the starter branch the bot gets through:

```bash
node test-bot.js
```

On the final branch, point it at your development domain. Headless Chrome raises the Browser Automation signal, so the server refuses the action:

```bash
BASE_URL=https://tutorial.your-domain.com node test-bot.js
```

## Resetting the demo databases

Each app keeps its data in a local SQLite file, `db.sqlite`. To reset it:

- Click **Reset demo DB** at the bottom of the demo app page, or
- Run this from the app folder:

  ```bash
  npm run reset-db
  ```

## License

[MIT](LICENSE)
