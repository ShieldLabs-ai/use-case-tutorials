import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Stores a password as "salt:hash" with scrypt. Never store plain passwords.
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  return timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(hash, 'hex'));
}
