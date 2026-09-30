'use strict';
/**
 * Authentication middleware.
 * - loadUser: attaches req.user / res.locals.user when a valid session exists.
 *   Sessions are invalidated if the account is deactivated or the
 *   session_version changed (password change / forced logout).
 * - requireAuth / requireAdmin / requireVerified
 * - ensureFullAuth: blocks account pages while a 2FA step is pending.
 */
const { get } = require('../db');

function loadUser(req, res, next) {
  req.user = null;
  res.locals.user = null;
  const sid = req.session.userId;
  const sver = req.session.sessionVersion;
  if (sid) {
    const user = get('SELECT * FROM users WHERE id = ?', sid);
    if (user && user.is_active === 1 && user.session_version === sver) {
      req.user = user;
      res.locals.user = user;
    } else {
      // Stale or deactivated — drop the session silently.
      req.session.userId = null;
      req.session.pending2fa = null;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access denied',
      message: 'This area is restricted to studio administrators.',
    });
  }
  next();
}

function ensureFullAuth(req, res, next) {
  if (req.session.pending2fa) return res.redirect('/2fa');
  next();
}

module.exports = { loadUser, requireAuth, requireAdmin, ensureFullAuth };
