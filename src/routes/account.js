'use strict';
/**
 * Member area: dashboard, class booking, profile, password, 2FA settings.
 */
const express = require('express');
const { get, all, run } = require('../db');
const { requireAuth, ensureFullAuth } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../lib/password');
const { generateTotpSecret, verifyTotp, otpauthUri } = require('../lib/totp');
const { generateBackupCodes, remainingBackupCodes } = require('../lib/backupcodes');
const { sendMail, bookingMail, passwordChangedMail } = require('../lib/mailer');
const { cleanStr, isPhone, passwordIssues } = require('../lib/validate');
const { rateLimit } = require('../lib/ratelimit');
const { audit } = require('../lib/audit');

const router = express.Router();
router.use(requireAuth, ensureFullAuth);

function activeMembership(userId) {
  const now = Date.now();
  return get(`SELECT m.*, p.name AS plan_name, p.price AS plan_price, p.duration_days
    FROM memberships m JOIN plans p ON p.id = m.plan_id
    WHERE m.user_id = ? AND m.status = 'active' AND m.ends_at > ?
    ORDER BY m.ends_at DESC LIMIT 1`, userId, now);
}

router.get('/dashboard', (req, res) => {
  const bookings = all(
    `SELECT b.*, c.title, c.slug, c.schedule, c.trainer_name, c.image
     FROM bookings b JOIN classes c ON c.id = b.class_id
     WHERE b.user_id = ? AND b.status = 'booked' ORDER BY b.created_at DESC`, req.user.id);
  const past = all(
    `SELECT b.*, c.title FROM bookings b JOIN classes c ON c.id = b.class_id
     WHERE b.user_id = ? AND b.status != 'booked' ORDER BY b.created_at DESC LIMIT 5`, req.user.id);
  const membership = activeMembership(req.user.id);
  res.render('account/dashboard', { title: 'My Dashboard', bookings, past, membership });
});

router.get('/bookings', (req, res) => {
  const bookings = all(
    `SELECT b.*, c.title, c.slug, c.schedule, c.trainer_name
     FROM bookings b JOIN classes c ON c.id = b.class_id
     WHERE b.user_id = ? ORDER BY b.created_at DESC`, req.user.id);
  res.render('account/bookings', { title: 'My Bookings', bookings });
});

router.post('/classes/:id/book',
  rateLimit({ key: (req) => `book:${req.user.id}`, max: 20, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
    const cls = get('SELECT * FROM classes WHERE id = ? AND is_active = 1', req.params.id);
    if (!cls) { req.flash('error', 'This class is not available.'); return res.redirect('/classes'); }
    const count = get(`SELECT COUNT(*) AS n FROM bookings WHERE class_id = ? AND status = 'booked'`, cls.id);
    if (count.n >= cls.capacity) { req.flash('error', 'This class is fully booked.'); return res.redirect('/classes/' + cls.slug); }
    const existing = get(`SELECT id FROM bookings WHERE user_id = ? AND class_id = ? AND status = 'booked'`,
      req.user.id, cls.id);
    if (existing) { req.flash('error', 'You already have a spot in this class.'); return res.redirect('/classes/' + cls.slug); }
    let bookingResult;
    try {
      bookingResult = run('INSERT INTO bookings (user_id, class_id, created_at) VALUES (?, ?, ?)', req.user.id, cls.id, Date.now());
    } catch (e) {
      req.flash('error', 'Could not complete the booking. Please try again.');
      return res.redirect('/classes/' + cls.slug);
    }
    audit({ actorId: req.user.id, action: 'book_class', detail: cls.title, ip: req.ip });
    try {
      const mail = bookingMail({
        name: req.user.name,
        classTitle: cls.title,
        schedule: cls.schedule,
        trainerName: cls.trainer_name,
        durationMin: cls.duration_min,
        bookingId: bookingResult ? bookingResult.lastInsertRowid : null,
        baseUrl: req.protocol + '://' + req.get('host'),
      });
      await sendMail({ to: req.user.email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (e) { console.error('[forgefit] booking mail failed:', e.message); }
    req.flash('success', `You're booked for ${cls.title}. See you on the floor!`);
    res.redirect('/dashboard');
  });

router.post('/bookings/:id/cancel', (req, res) => {
  const b = get(`SELECT b.*, c.title FROM bookings b JOIN classes c ON c.id = b.class_id
    WHERE b.id = ? AND b.user_id = ? AND b.status = 'booked'`, req.params.id, req.user.id);
  if (!b) { req.flash('error', 'Booking not found.'); return res.redirect('/bookings'); }
  run(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, b.id);
  audit({ actorId: req.user.id, action: 'cancel_booking', detail: b.title, ip: req.ip });
  req.flash('success', 'Booking cancelled.');
  res.redirect('/bookings');
});

router.get('/profile', (req, res) => {
  res.render('account/profile', { title: 'My Profile', form: { name: req.user.name, phone: req.user.phone } });
});

router.post('/profile', (req, res) => {
  const name = cleanStr(req.body.name, 80);
  const phone = cleanStr(req.body.phone, 20);
  if (name.length < 2) { req.flash('error', 'Please enter your name.'); return res.redirect('/profile'); }
  if (!isPhone(phone)) { req.flash('error', 'Please enter a valid phone number.'); return res.redirect('/profile'); }
  run('UPDATE users SET name = ?, phone = ?, updated_at = ? WHERE id = ?', name, phone, Date.now(), req.user.id);
  audit({ actorId: req.user.id, action: 'profile_update', ip: req.ip });
  req.flash('success', 'Profile updated.');
  res.redirect('/profile');
});

router.get('/change-password', (req, res) => {
  res.render('account/change-password', { title: 'Change Password' });
});

router.post('/change-password',
  rateLimit({ key: (req) => `chpw:${req.user.id}`, max: 10, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
    const user = get('SELECT * FROM users WHERE id = ?', req.user.id);
    if (!verifyPassword(String(req.body.current || ''), user.password_hash)) {
      req.flash('error', 'Your current password is incorrect.');
      return res.redirect('/change-password');
    }
    const password = String(req.body.password || '');
    const issues = passwordIssues(password);
    if (issues.length) { req.flash('error', 'New password needs ' + issues.join(', ') + '.'); return res.redirect('/change-password'); }
    if (password !== String(req.body.confirm || '')) { req.flash('error', 'New passwords do not match.'); return res.redirect('/change-password'); }
    run('UPDATE users SET password_hash = ?, session_version = session_version + 1, updated_at = ? WHERE id = ?',
      hashPassword(password), Date.now(), user.id);
    req.session.sessionVersion = user.session_version + 1; // keep this session alive
    audit({ actorId: user.id, action: 'password_change', ip: req.ip });
    try {
      const mail = passwordChangedMail({ name: user.name });
      await sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (e) { console.error('[forgefit] password-changed mail failed:', e.message); }
    req.flash('success', 'Password changed. Other devices were signed out.');
    res.redirect('/security');
  });

/* ---------- security / 2FA settings ---------- */

router.get('/security', (req, res) => {
  res.render('account/security', {
    title: 'Security & 2FA',
    totpEnabled: req.user.totp_enabled === 1,
    email2fa: req.user.email_2fa === 1,
    backupLeft: remainingBackupCodes(req.user.id),
  });
});

// Step 1: generate a secret, show QR + manual key.
router.post('/security/totp/start', (req, res) => {
  if (req.user.totp_enabled === 1) return res.redirect('/security');
  const secret = generateTotpSecret();
  req.session.totpPending = { secret, exp: Date.now() + 10 * 60 * 1000 };
  const uri = otpauthUri({ issuer: 'ForgeFit Studio', account: req.user.email, secret });
  res.render('account/totp-setup', { title: 'Set Up Authenticator App', secret, uri });
});

// Step 2: confirm with a live code → enable, issue backup codes.
router.post('/security/totp/confirm',
  rateLimit({ key: (req) => `totpc:${req.user.id}`, max: 10, windowMs: 15 * 60 * 1000 }),
  (req, res) => {
    const pending = req.session.totpPending;
    if (!pending || pending.exp < Date.now()) {
      req.flash('error', 'Setup session expired. Please start again.');
      return res.redirect('/security');
    }
    if (!verifyTotp(pending.secret, req.body.code)) {
      req.flash('error', 'That code did not match. Check your authenticator app time and try again.');
      const uri = otpauthUri({ issuer: 'ForgeFit Studio', account: req.user.email, secret: pending.secret });
      return res.render('account/totp-setup', { title: 'Set Up Authenticator App', secret: pending.secret, uri });
    }
    run('UPDATE users SET totp_secret = ?, totp_enabled = 1, updated_at = ? WHERE id = ?',
      pending.secret, Date.now(), req.user.id);
    req.session.totpPending = null;
    const codes = generateBackupCodes(req.user.id);
    audit({ actorId: req.user.id, action: 'totp_enabled', ip: req.ip });
    req.flash('success', 'Authenticator 2FA is now on. Save your backup codes — each works once.');
    res.render('account/backup-codes', { title: 'Backup Codes', codes, fresh: true });
  });

router.post('/security/totp/disable', (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!verifyPassword(String(req.body.password || ''), user.password_hash)) {
    req.flash('error', 'Password incorrect — 2FA was not disabled.');
    return res.redirect('/security');
  }
  run('UPDATE users SET totp_secret = NULL, totp_enabled = 0, updated_at = ? WHERE id = ?', Date.now(), user.id);
  run('DELETE FROM backup_codes WHERE user_id = ?', user.id);
  audit({ actorId: user.id, action: 'totp_disabled', ip: req.ip });
  req.flash('success', 'Authenticator 2FA turned off.');
  res.redirect('/security');
});

router.post('/security/email-2fa', (req, res) => {
  const enable = req.body.enable === '1';
  run('UPDATE users SET email_2fa = ?, updated_at = ? WHERE id = ?', enable ? 1 : 0, Date.now(), req.user.id);
  audit({ actorId: req.user.id, action: enable ? 'email_2fa_enabled' : 'email_2fa_disabled', ip: req.ip });
  req.flash('success', enable ? 'Email code 2FA is now on.' : 'Email code 2FA turned off.');
  res.redirect('/security');
});

router.post('/security/backup-codes/regenerate', (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (user.totp_enabled !== 1 || !verifyPassword(String(req.body.password || ''), user.password_hash)) {
    req.flash('error', 'Password incorrect.');
    return res.redirect('/security');
  }
  const codes = generateBackupCodes(user.id);
  audit({ actorId: user.id, action: 'backup_codes_regenerated', ip: req.ip });
  res.render('account/backup-codes', { title: 'Backup Codes', codes, fresh: true });
});

module.exports = router;
