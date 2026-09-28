import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

const WALLET_RE = /^0x[a-fA-F0-9]{6,40}$/;

// Claims 100 simulated ACME tokens: one claim per device, ever.
export async function claim({ walletAddress, requestId }) {
  walletAddress = String(walletAddress ?? '').trim();

  // Read the identification behind this claim. Unverified, automated and
  // Dangerous claims are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Claim refused: ${check.message}` };
  }
  const { device_id: deviceId } = check.identification;

  // One claim per device, no matter which wallet claims next. The Device ID
  // stays the same when cookies are cleared, in an incognito window and on a new
  // IP address, so a sybil attacker cannot claim again just by switching wallets.
  const existing = db.prepare('SELECT wallet_address FROM claims WHERE device_id = ?').get(deviceId);
  if (existing) {
    return {
      success: false,
      message: `Claim refused: this device already claimed the airdrop, with wallet ${truncate(existing.wallet_address)}.`,
    };
  }

  if (!WALLET_RE.test(walletAddress)) {
    return { success: false, message: 'Enter a wallet address: 0x followed by 6 to 40 hex characters.' };
  }

  db.prepare('INSERT INTO claims (device_id, wallet_address, claimed_at) VALUES (?, ?, ?)').run(
    deviceId,
    walletAddress,
    Date.now(),
  );

  return { success: true, message: `Claimed. 100 ACME tokens are on their way to ${walletAddress}.` };
}

// The public claim counter.
export function claimCount() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM claims').get();
  return count;
}

function truncate(walletAddress) {
  return walletAddress.length > 8 ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-3)}` : walletAddress;
}
