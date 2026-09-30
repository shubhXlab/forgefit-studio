'use strict';
/**
 * Central configuration. Secrets come from environment variables only —
 * never commit them. SMTP can also be configured at runtime via the
 * Admin → Settings page (stored in the DB).
 */
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PORT = parseInt(process.env.PORT || '3100', 10);

let sessionSecret = process.env.SESSION_SECRET;
let sessionSecretGenerated = false;
if (!sessionSecret) {
  sessionSecret = crypto.randomBytes(48).toString('hex');
  sessionSecretGenerated = true;
}

module.exports = {
  root: ROOT,
  port: PORT,
  baseUrl: (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, ''),
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'forgefit',
  },
  phpMyAdminUrl: process.env.PHPMYADMIN_URL || 'http://localhost/phpmyadmin/index.php?route=/database/structure&db=forgefit',
  sessionSecret,
  sessionSecretGenerated,
  // Set SECURE_COOKIES=1 when serving over HTTPS (production).
  secureCookies: process.env.SECURE_COOKIES === '1',
  trustProxy: process.env.TRUST_PROXY === '1',
  // Optional SMTP override via env (takes precedence over DB settings).
  smtpEnv: {
    host: process.env.FORGEFIT_SMTP_HOST || '',
    port: process.env.FORGEFIT_SMTP_PORT ? parseInt(process.env.FORGEFIT_SMTP_PORT, 10) : 0,
    user: process.env.FORGEFIT_SMTP_USER || '',
    pass: process.env.FORGEFIT_SMTP_PASS || '',
    secure: process.env.FORGEFIT_SMTP_SECURE === '1',
    from: process.env.FORGEFIT_SMTP_FROM || '',
  },
  uploadsDir: path.join(ROOT, 'src', 'public', 'uploads'),
  siteName: 'ForgeFit Studio',
};
