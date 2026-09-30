'use strict';
/**
 * One-time passcodes (6 digits). Only SHA-256 hashes are stored —
 * a database leak never reveals a live code.
 * Purposes: register_verify, login_2fa, password_reset.
 */
const crypto = require('crypto');
const { get, run } = require('../db');

const MAX_ATTEMPTS = 8;

function sha(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

/** Issue a fresh code, invalidating any previous unconsumed one. Returns the plain code. */
function issueOtp({ email, userId = null, purpose, ip = null, ttlMin = 10 }) {
  const now = Date.now();
  run('UPDATE otps SET consumed_at = ? WHERE email = ? AND purpose = ? AND consumed_at IS NULL',
    now, email, purpose);
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  run(
    `INSERT INTO otps (email, user_id, purpose, code_hash, expires_at, created_at, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    email, userId, purpose, sha(code), now + ttlMin * 60 * 1000, now, ip
  );
  return code;
}

/** Verify a code. Returns { ok, reason?, attemptsLeft? }. */
function verifyOtp({ email, purpose, code }) {
  const row = get(
    `SELECT * FROM otps WHERE email = ? AND purpose = ? AND consumed_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    email, purpose
  );
  if (!row) return { ok: false, reason: 'not_found' };
  const now = Date.now();
  if (now > row.expires_at) {
    run('UPDATE otps SET consumed_at = ? WHERE id = ?', now, row.id);
    return { ok: false, reason: 'expired' };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    run('UPDATE otps SET consumed_at = ? WHERE id = ?', now, row.id);
    return { ok: false, reason: 'locked' };
  }
  run('UPDATE otps SET attempts = attempts + 1 WHERE id = ?', row.id);
  const candidate = sha(String(code).trim());
  const ok = candidate.length === row.code_hash.length &&
    crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(row.code_hash, 'hex'));
  if (ok) {
    run('UPDATE otps SET consumed_at = ? WHERE id = ?', now, row.id);
    return { ok: true, userId: row.user_id };
  }
  return { ok: false, reason: 'mismatch', attemptsLeft: MAX_ATTEMPTS - (row.attempts + 1) };
}

/** Seconds until the most recent unconsumed code for this email+purpose was issued. */
function secondsSinceLastIssue(email, purpose) {
  const row = get(
    `SELECT created_at FROM otps WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1`,
    email, purpose
  );
  if (!row) return Infinity;
  return Math.floor((Date.now() - row.created_at) / 1000);
}

module.exports = { issueOtp, verifyOtp, secondsSinceLastIssue, MAX_ATTEMPTS };
