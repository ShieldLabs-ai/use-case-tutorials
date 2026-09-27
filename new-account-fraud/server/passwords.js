import { randomBytes, scryptSync } from 'node:crypto';

// Stores a password as "salt:hash" with scrypt. Never store plain passwords.
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}
