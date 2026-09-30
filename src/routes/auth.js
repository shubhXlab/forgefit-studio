'use strict';
/**
 * Authentication:
 *  - Register → email OTP verification → auto-login
 *  - Login → optional 2FA (authenticator TOTP or email OTP) → session
 *  - Forgot password → email OTP → reset (other sessions revoked)
 */
const express = require('express');
const { get, run } = require('../db');
const { hashPassword, verifyPassword } = require('../lib/password');
const { issueOtp, verifyOtp, secondsSinceLastIssue } = require('../lib/otp');
const { verifyTotp } = require('../lib/totp');
const { verifyBackupCode } = require('../lib/backupcodes');
const { sendMail, otpMail, welcomeMail, passwordChangedMail } = require('../lib/mailer');
const { cleanStr, isEmail, normalizeEmail, isPhone, passwordIssues } = require('../lib/validate');
const { rateLimit, check } = require('../lib/ratelimit');
const { audit } = require('../lib/audit');

const router = express.Router();
const OTP_TTL_MIN = 10;

/* ---------- helpers ---------- */

function finishLogin(req, res, user) {
  return new Promise((resolve) => {
    req.session.regenerate((err) => {
      if (err) { req.flash('error', 'Could not start session. Please try again.'); return res.redirect('/login'); }
      req.session.userId = user.id;
      req.session.sessionVersion = user.session_version;
      req.session.pending2fa = null;
      run('UPDATE users SET last_login_at = ? WHERE id = ?', Date.now(), user.id);
      audit({ actorId: user.id, action: 'login', ip: req.ip });
      resolve();
    });
  }).then(() => {
    const next = req.session.nextAfterLogin || (user.role === 'admin' ? '/admin' : '/dashboard');
    req.session.nextAfterLogin = null;
    res.redirect(next);
  });
}

async function sendOtpEmail(user, purpose, purposeLabel) {
  const code = issueOtp({ email: user.email, userId: user.id, purpose, ip: null, ttlMin: OTP_TTL_MIN });
  const mail = otpMail({ name: user.name, code, purposeLabel, ttlMin: OTP_TTL_MIN });
  await sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text });
}

/* ---------- register ---------- */

router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Create Account', form: {} });
});

router.post('/register',
  rateLimit({ key: 'register', max: 10, windowMs: 60 * 60 * 1000, message: 'Too many registrations from this address. Try again later.' }),
  async (req, res) => {
    if (req.user) return res.redirect('/dashboard');
    const form = {
      name: cleanStr(req.body.name, 80),
      email: normalizeEmail(req.body.email),
      phone: cleanStr(req.body.phone, 20),
      password: String(req.body.password || ''),
      confirm: String(req.body.confirm || ''),
    };
    const errors = [];
    if (form.name.length < 2) errors.push('Please enter your full name.');
    if (!isEmail(form.email)) errors.push('Please enter a valid email address.');
    if (!isPhone(form.phone)) errors.push('Please enter a valid phone number.');
    const pwIssues = passwordIssues(form.password);
    if (pwIssues.length) errors.push('Password needs ' + pwIssues.join(', ') + '.');
    if (form.password !== form.confirm) errors.push('Passwords do not match.');
    if (!errors.length && get('SELECT id FROM users WHERE email = ?', form.email)) {
      errors.push('An account with this email already exists. Try logging in instead.');
    }
    if (errors.length) {
      errors.forEach((e) => req.flash('error', e));
      return res.render('auth/register', { title: 'Create Account', form });
    }

    const now = Date.now();
    const info = run(
      `INSERT INTO users (name, email, phone, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      form.name, form.email, form.phone, hashPassword(form.password), now, now
    );
    const user = get('SELECT * FROM users WHERE id = ?', info.lastInsertRowid);
    audit({ actorId: user.id, action: 'register', detail: user.email, ip: req.ip });

    try {
      await sendOtpEmail(user, 'register_verify', 'verify your email address');
    } catch (e) {
      console.error('[forgefit] OTP mail failed:', e.message);
      req.flash('error', 'We could not send the verification email. Please try resending the code.');
    }
    req.session.verifyEmail = user.email;
    res.redirect('/verify-email');
  });

/* ---------- email verification ---------- */

router.get('/verify-email', (req, res) => {
  const email = req.session.verifyEmail || normalizeEmail(req.query.email);
  if (!email) return res.redirect('/register');
  const user = get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.redirect('/register');
  if (user.email_verified_at) return res.redirect('/login');
  res.render('auth/verify-email', { title: 'Verify Your Email', email, cooldown: secondsSinceLastIssue(email, 'register_verify') });
});

router.post('/verify-email',
  rateLimit({ key: (req) => `verify:${req.ip}`, max: 20, windowMs: 15 * 60 * 1000 }),
  async (req, res) => {
    const email = req.session.verifyEmail || normalizeEmail(req.body.email);
    const user = email && get('SELECT * FROM users WHERE email = ?', email);
    if (!user || user.email_verified_at) return res.redirect('/login');

    const result = verifyOtp({ email, purpose: 'register_verify', code: req.body.code });
    if (!result.ok) {
      const msg = { expired: 'That code expired. Please request a new one.', locked: 'Too many wrong attempts. Please request a new code.', not_found: 'No active code found. Please request a new one.', mismatch: 'Incorrect code. Please try again.' }[result.reason];
      req.flash('error', msg + (result.attemptsLeft != null ? ` (${result.attemptsLeft} attempts left)` : ''));
      audit({ actorId: user.id, action: 'verify_email_failed', detail: result.reason, ip: req.ip });
      return res.redirect('/verify-email');
    }
    run('UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?', Date.now(), Date.now(), user.id);
    req.session.verifyEmail = null;
    audit({ actorId: user.id, action: 'verify_email', ip: req.ip });
    try {
      const mail = welcomeMail({ name: user.name });
      await sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (e) { console.error('[forgefit] welcome mail failed:', e.message); }
    req.flash('success', 'Email verified — welcome to ForgeFit!');
    await finishLogin(req, res, get('SELECT * FROM users WHERE id = ?', user.id));
  });

router.post('/resend-otp',
  rateLimit({ key: (req) => `resend:${req.ip}`, max: 5, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
    const email = req.session.verifyEmail || normalizeEmail(req.body.email);
    const purpose = req.body.purpose === 'password_reset' ? 'password_reset' : 'register_verify';
    const user = email && get('SELECT * FROM users WHERE email = ?', email);
    const back = purpose === 'password_reset' ? '/forgot-password' : '/verify-email';
    if (!user || (purpose === 'register_verify' && user.email_verified_at)) return res.redirect('/register');
    const since = secondsSinceLastIssue(email, purpose);
    if (since < 60) {
      req.flash('error', `Please wait ${60 - since}s before requesting a new code.`);
      return res.redirect(back);
    }
    try {
      await sendOtpEmail(user, purpose, purpose === 'password_reset' ? 'reset your password' : 'verify your email address');
      req.flash('success', 'A new code was sent to your email.');
    } catch (e) {
      console.error('[forgefit] resend OTP failed:', e.message);
      req.flash('error', 'Could not send the email. Please try again in a minute.');
    }
    res.redirect(back);
  });

/* ---------- login ---------- */

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  if (req.query.next) req.session.nextAfterLogin = req.query.next;
  res.render('auth/login', { title: 'Log In', form: {} });
});

router.post('/login',
  rateLimit({ key: (req) => `login:${req.ip}:${normalizeEmail(req.body.email)}`, max: 8, windowMs: 15 * 60 * 1000,
    message: 'Too many login attempts. Please wait a few minutes.' }),
  async (req, res) => {
    if (req.user) return res.redirect('/dashboard');
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const user = email && get('SELECT * FROM users WHERE email = ?', email);

    // Constant-shape failure: don't reveal whether the email exists.
    if (!user || !verifyPassword(password, user.password_hash)) {
      audit({ action: 'login_failed', detail: email, ip: req.ip });
      req.flash('error', 'Incorrect email or password.');
      return res.render('auth/login', { title: 'Log In', form: { email } });
    }
    if (user.is_active !== 1) {
      audit({ actorId: user.id, action: 'login_blocked_inactive', ip: req.ip });
      req.flash('error', 'This account has been deactivated. Please contact the studio.');
      return res.render('auth/login', { title: 'Log In', form: { email } });
    }
    if (!user.email_verified_at) {
      req.session.verifyEmail = user.email;
      try { await sendOtpEmail(user, 'register_verify', 'verify your email address'); } catch (e) { console.error(e.message); }
      req.flash('error', 'Please verify your email first — we sent you a fresh code.');
      return res.redirect('/verify-email');
    }

    if (user.totp_enabled === 1) {
      req.session.pending2fa = { userId: user.id, method: 'totp' };
      audit({ actorId: user.id, action: 'login_step1_ok', detail: 'totp required', ip: req.ip });
      return res.redirect('/2fa');
    }
    if (user.email_2fa === 1) {
      const rl = check(`2fa-mail:${user.id}`, 3, 60 * 60 * 1000);
      if (!rl.ok) { req.flash('error', 'Too many 2FA codes requested. Try again later.'); return res.redirect('/login'); }
      req.session.pending2fa = { userId: user.id, method: 'email' };
      try { await sendOtpEmail(user, 'login_2fa', 'complete your login'); }
      catch (e) { console.error(e.message); req.flash('error', 'Could not send the login code.'); return res.redirect('/login'); }
      audit({ actorId: user.id, action: 'login_step1_ok', detail: 'email 2fa sent', ip: req.ip });
      return res.redirect('/2fa');
    }
    await finishLogin(req, res, user);
  });

/* ---------- 2FA challenge ---------- */

router.get('/2fa', (req, res) => {
  const pending = req.session.pending2fa;
  if (!pending) return res.redirect('/login');
  const user = get('SELECT * FROM users WHERE id = ?', pending.userId);
  if (!user) { req.session.pending2fa = null; return res.redirect('/login'); }
  res.render('auth/twofa', { title: 'Two-Factor Authentication', method: pending.method, email: user.email });
});

router.post('/2fa',
  rateLimit({ key: (req) => `2fa:${req.ip}`, max: 15, windowMs: 15 * 60 * 1000 }),
  async (req, res) => {
    const pending = req.session.pending2fa;
    if (!pending) return res.redirect('/login');
    const user = get('SELECT * FROM users WHERE id = ?', pending.userId);
    if (!user || user.is_active !== 1) { req.session.pending2fa = null; return res.redirect('/login'); }

    let ok = false;
    if (pending.method === 'totp' && user.totp_enabled === 1) {
      const code = String(req.body.code || '').trim();
      ok = verifyTotp(user.totp_secret, code) || verifyBackupCode(user.id, code);
      if (ok && verifyBackupCode.length) { /* consumed inside verifyBackupCode */ }
    } else if (pending.method === 'email' && user.email_2fa === 1) {
      const r = verifyOtp({ email: user.email, purpose: 'login_2fa', code: req.body.code });
      ok = r.ok;
      if (!ok) req.flash('error', r.reason === 'expired' ? 'That code expired.' : 'Incorrect code. Please try again.');
    }

    if (!ok) {
      if (pending.method === 'totp') req.flash('error', 'Incorrect code. Check your authenticator app or use a backup code.');
      audit({ actorId: user.id, action: '2fa_failed', detail: pending.method, ip: req.ip });
      return res.redirect('/2fa');
    }
    audit({ actorId: user.id, action: '2fa_ok', detail: pending.method, ip: req.ip });
    await finishLogin(req, res, user);
  });

/* ---------- forgot / reset password ---------- */

router.get('/forgot-password', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/forgot', { title: 'Forgot Password', step: 'email' });
});

router.post('/forgot-password',
  rateLimit({ key: (req) => `forgot:${req.ip}`, max: 5, windowMs: 60 * 60 * 1000,
    message: 'Too many password reset requests. Try again later.' }),
  async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const user = email && get('SELECT * FROM users WHERE email = ?', email);
    // Never reveal whether the account exists.
    if (user && user.email_verified_at && user.is_active === 1) {
      try { await sendOtpEmail(user, 'password_reset', 'reset your password'); }
      catch (e) { console.error('[forgefit] reset mail failed:', e.message); }
      req.session.pwResetEmail = email;
      audit({ actorId: user.id, action: 'password_reset_requested', ip: req.ip });
    }
    req.flash('success', 'If an account exists for that email, a reset code is on its way.');
    res.redirect('/forgot-password/verify');
  });

router.get('/forgot-password/verify', (req, res) => {
  const email = req.session.pwResetEmail;
  if (!email) return res.redirect('/forgot-password');
  res.render('auth/forgot', { title: 'Enter Reset Code', step: 'code', email });
});

router.post('/forgot-password/verify',
  rateLimit({ key: (req) => `forgotv:${req.ip}`, max: 15, windowMs: 15 * 60 * 1000 }),
  (req, res) => {
    const email = req.session.pwResetEmail;
    if (!email) return res.redirect('/forgot-password');
    const result = verifyOtp({ email, purpose: 'password_reset', code: req.body.code });
    if (!result.ok) {
      req.flash('error', result.reason === 'expired' ? 'That code expired. Please request a new one.' : 'Incorrect code. Please try again.');
      return res.redirect('/forgot-password/verify');
    }
    const user = get('SELECT * FROM users WHERE email = ?', email);
    req.session.pwReset = { userId: user.id, exp: Date.now() + 15 * 60 * 1000 };
    res.redirect('/reset-password');
  });

router.get('/reset-password', (req, res) => {
  const pr = req.session.pwReset;
  if (!pr || pr.exp < Date.now()) {
    req.session.pwReset = null;
    req.flash('error', 'Your reset session expired. Please start again.');
    return res.redirect('/forgot-password');
  }
  res.render('auth/reset', { title: 'Set New Password' });
});

router.post('/reset-password',
  rateLimit({ key: (req) => `reset:${req.ip}`, max: 10, windowMs: 15 * 60 * 1000 }),
  async (req, res) => {
    const pr = req.session.pwReset;
    if (!pr || pr.exp < Date.now()) {
      req.session.pwReset = null;
      req.flash('error', 'Your reset session expired. Please start again.');
      return res.redirect('/forgot-password');
    }
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm || '');
    const issues = passwordIssues(password);
    if (issues.length || password !== confirm) {
      req.flash('error', issues.length ? 'Password needs ' + issues.join(', ') + '.' : 'Passwords do not match.');
      return res.render('auth/reset', { title: 'Set New Password' });
    }
    const user = get('SELECT * FROM users WHERE id = ?', pr.userId);
    if (!user) return res.redirect('/forgot-password');
    const now = Date.now();
    // New password + bump session_version to revoke all other sessions.
    run('UPDATE users SET password_hash = ?, session_version = session_version + 1, updated_at = ? WHERE id = ?',
      hashPassword(password), now, user.id);
    req.session.pwReset = null;
    req.session.pwResetEmail = null;
    audit({ actorId: user.id, action: 'password_reset_done', ip: req.ip });
    try {
      const mail = passwordChangedMail({ name: user.name });
      await sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (e) { console.error('[forgefit] password-changed mail failed:', e.message); }
    req.flash('success', 'Password updated. Please log in with your new password.');
    res.redirect('/login');
  });

/* ---------- logout ---------- */

router.post('/logout', (req, res) => {
  const uid = req.session.userId;
  req.session.destroy(() => {
    if (uid) audit({ actorId: uid, action: 'logout', ip: req.ip });
    res.redirect('/');
  });
});

module.exports = router;
