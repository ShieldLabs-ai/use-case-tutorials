# ShieldLabs Returning Visitor Tutorial

This tutorial shows how to recognize a returning visitor with ShieldLabs: search history and saved items are keyed to the device, so they are still there in an incognito window or after the visitor clears cookies.

See the full guide at [Returning Visitor](https://docs.shieldlabs.ai/use-case/returning-visitor).

This is the **starter** branch: the demo app without ShieldLabs. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- personalization`.

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

1. Search for `lamp` and `mug`, and save a couple of products. They appear under **Recent searches** and **Saved items**.
2. Open the store in an incognito window, or clear the site's cookies and reload. The history and the saved items are gone: the store only knew the visitor by a cookie.

## Run the bot test

With the server running, search and save a product from headless Chrome:

```bash
node test-bot.js
```

The bot's search and saved item are stored like anyone else's.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
