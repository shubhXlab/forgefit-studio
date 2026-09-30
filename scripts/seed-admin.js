'use strict';
/**
 * Create (or reset) the admin account.
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Strong#Pass123' node scripts/seed-admin.js
 * If ADMIN_PASSWORD is omitted, a strong random password is generated and printed once.
 */
const crypto = require('crypto');
const { get, run } = require('../src/db');
const { hashPassword } = require('../src/lib/password');
const { isEmail } = require('../src/lib/validate');

const email = (process.env.ADMIN_EMAIL || 'admin@forgefit.local').trim().toLowerCase();
let password = process.env.ADMIN_PASSWORD;
let generated = false;
if (!password) {
  password = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) + '#A1';
  generated = true;
}
if (!isEmail(email)) { console.error('Invalid ADMIN_EMAIL'); process.exit(1); }
if (password.length < 10) { console.error('ADMIN_PASSWORD must be at least 10 characters'); process.exit(1); }

const now = Date.now();
const existing = get('SELECT * FROM users WHERE email = ?', email);
if (existing) {
  run(`UPDATE users SET password_hash = ?, role = 'admin', is_active = 1, email_verified_at = COALESCE(email_verified_at, ?),
    session_version = session_version + 1, updated_at = ? WHERE id = ?`,
    hashPassword(password), now, now, existing.id);
  console.log(`Admin account updated: ${email}`);
} else {
  run(`INSERT INTO users (name, email, phone, password_hash, role, email_verified_at, created_at, updated_at)
       VALUES ('Studio Admin', ?, '0000000000', ?, 'admin', ?, ?, ?)`,
    email, hashPassword(password), now, now, now);
  console.log(`Admin account created: ${email}`);
}
console.log(`Password: ${password}`);
if (generated) console.log('NOTE: this password was generated — save it now, it will not be shown again.');
console.log('Change it after first login via Security → Change password.');
