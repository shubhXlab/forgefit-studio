'use strict';
/**
 * Single-use backup codes for 2FA recovery. Only SHA-256 hashes stored.
 * Display format: XXXX-XXXX (8 chars from an unambiguous alphabet).
 */
const crypto = require('crypto');
const { get, run, all } = require('../db');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode() {
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

function sha(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

/** Generate 10 fresh codes, replacing any old ones. Returns the plain codes (show once!). */
function generateBackupCodes(userId) {
  const now = Date.now();
  run('DELETE FROM backup_codes WHERE user_id = ?', userId);
  const codes = [];
  const ins = require('../db').db.prepare(
    'INSERT INTO backup_codes (user_id, code_hash, created_at) VALUES (?, ?, ?)');
  const seen = new Set();
  while (codes.length < 10) {
    const c = randomCode();
    if (seen.has(c)) continue;
    seen.add(c);
    try {
      ins.run(userId, sha(c), now);
      codes.push(c);
    } catch { /* hash collision — regenerate */ }
  }
  return codes;
}

/** Verify + consume a backup code. Returns true on success. */
function verifyBackupCode(userId, code) {
  const normalized = String(code || '').trim().toUpperCase();
  const rows = all('SELECT id, code_hash FROM backup_codes WHERE user_id = ? AND used_at IS NULL', userId);
  const target = sha(normalized);
  for (const row of rows) {
    if (row.code_hash.length === target.length &&
        crypto.timingSafeEqual(Buffer.from(row.code_hash, 'hex'), Buffer.from(target, 'hex'))) {
      run('UPDATE backup_codes SET used_at = ? WHERE id = ?', Date.now(), row.id);
      return true;
    }
  }
  return false;
}

function remainingBackupCodes(userId) {
  const row = get('SELECT COUNT(*) AS n FROM backup_codes WHERE user_id = ? AND used_at IS NULL', userId);
  return row ? row.n : 0;
}

module.exports = { generateBackupCodes, verifyBackupCode, remainingBackupCodes };
