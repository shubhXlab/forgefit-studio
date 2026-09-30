'use strict';
/**
 * Tiny in-memory sliding-window rate limiter.
 * Keyed per route+IP (+email where relevant). Not distributed — fine for
 * a single-process deployment; sessions live in SQLite anyway.
 */
const buckets = new Map();

// Sweep stale buckets every 5 minutes.
setInterval(() => {
  const now = Date.now();
  for (const [key, stamps] of buckets) {
    const fresh = stamps.filter((t) => now - t < 10 * 60 * 1000);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}, 5 * 60 * 1000).unref();

/** Returns { ok, retryAfterSec }. Records the hit when ok. */
function check(key, max, windowMs) {
  const now = Date.now();
  const stamps = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (stamps.length >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((stamps[0] + windowMs - now) / 1000)) };
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return { ok: true };
}

/** Express middleware factory. */
function rateLimit({ key, max, windowMs, message }) {
  return (req, res, next) => {
    const k = typeof key === 'function' ? key(req) : `${key}:${req.ip}`;
    const r = check(k, max, windowMs);
    if (!r.ok) {
      req.flash('error', message || `Too many attempts. Please wait ${r.retryAfterSec}s and try again.`);
      const back = req.get('Referer') || '/';
      return res.status(429).redirect(back);
    }
    next();
  };
}

module.exports = { check, rateLimit };
