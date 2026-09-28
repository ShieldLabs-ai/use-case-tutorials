import { db } from './db.js';

const WALLET_RE = /^0x[a-fA-F0-9]{6,40}$/;

// Claims 100 simulated ACME tokens. Nothing ties a claim to the browser that
// made it, so the same visitor can claim again and again, with a new wallet
// address every time.
export async function claim({ walletAddress }) {
  walletAddress = String(walletAddress ?? '').trim();
  if (!WALLET_RE.test(walletAddress)) {
    return { success: false, message: 'Enter a wallet address: 0x followed by 6 to 40 hex characters.' };
  }

  db.prepare('INSERT INTO claims (wallet_address, claimed_at) VALUES (?, ?)').run(walletAddress, Date.now());

  return { success: true, message: `Claimed. 100 ACME tokens are on their way to ${walletAddress}.` };
}

// The public claim counter.
export function claimCount() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM claims').get();
  return count;
}
