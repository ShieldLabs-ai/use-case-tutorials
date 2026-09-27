# ShieldLabs Ban Evasion Tutorial

This tutorial shows how to make bans stick with ShieldLabs: banning a member also bans every device they signed in from, so a fresh account on the same device does not get them back in.

See the full guide at [Ban Evasion](https://docs.shieldlabs.ai/use-case/ban-evasion).

This is the **starter** branch: the demo app without protection. The **final** branch adds the ShieldLabs integration. See what it adds with `git diff starter final -- ban-evasion`.

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

1. Sign up as a new member, for example `trouble_1`, and write a post.
2. In **Moderator tools**, ban `trouble_1`. The session ends and `trouble_1` can no longer sign in.
3. Sign up again as `trouble_2` in the same browser and post again. The ban only covered the account, so the same person is back in seconds.

## Run the bot test

With the server running, create an account from headless Chrome:

```bash
node test-bot.js
```

The bot gets an account too.

## Reset the demo database

Click **Reset demo DB** at the bottom of the page, or run:

```bash
npm run reset-db
```
