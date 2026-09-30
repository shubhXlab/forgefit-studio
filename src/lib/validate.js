'use strict';
/** Server-side input validation helpers. */

function cleanStr(v, max = 500) {
  return String(v == null ? '' : v).trim().replace(/\s+/g, ' ').slice(0, max);
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim().toLowerCase());
}

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}

/** Accepts 10-digit Indian numbers with optional +91 / 91 / 0 prefix, or generic 7–15 digit numbers. */
function isPhone(v) {
  const d = String(v || '').replace(/[^\d]/g, '');
  if (/^(91)?[6-9]\d{9}$/.test(d)) return true; // India mobile
  return d.length >= 7 && d.length <= 15;
}

function passwordIssues(pw) {
  const issues = [];
  const s = String(pw || '');
  if (s.length < 10) issues.push('at least 10 characters');
  if (!/[a-zA-Z]/.test(s)) issues.push('at least one letter');
  if (!/\d/.test(s)) issues.push('at least one number');
  return issues;
}

function isPositiveInt(v, max = 100000) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= max;
}

module.exports = { cleanStr, isEmail, normalizeEmail, isPhone, passwordIssues, isPositiveInt };
