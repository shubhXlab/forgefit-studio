'use strict';
/**
 * CSRF protection (synchronizer token stored in the session).
 * Apply `csrfMiddleware` globally; `verifyCsrf` runs on unsafe methods.
 */
const crypto = require('crypto');

function csrfMiddleware(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrfToken = req.session.csrf;
  next();
}

function verifyCsrf(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = (req.body && req.body._csrf) || req.headers['x-csrf-token'];
    const expected = req.session.csrf || '';
    const ok = typeof token === 'string' && token.length === expected.length &&
      expected.length > 0 &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    if (!ok) {
      return res.status(403).render('error', {
        title: 'Security check failed',
        message: 'Your session token did not match. Please go back and try again.',
      });
    }
  }
  next();
}

module.exports = { csrfMiddleware, verifyCsrf };
