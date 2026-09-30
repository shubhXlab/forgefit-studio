'use strict';
/**
 * Password hashing with scrypt (node:crypto, no dependencies).
 * Stored format: scrypt$N$r$p$<salt b64>$<hash b64>
 */
const crypto = require('crypto');

const N = 16384, r = 8, p = 1, KEYLEN = 32, SALTLEN = 16;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALTLEN);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function verifyPassword(password, stored) {
  try {
    const parts = String(stored).split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const salt = Buffer.from(parts[4], 'base64');
    const expected = Buffer.from(parts[5], 'base64');
    const hash = crypto.scryptSync(String(password), salt, expected.length, {
      N: parseInt(parts[1], 10), r: parseInt(parts[2], 10), p: parseInt(parts[3], 10),
    });
    return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
