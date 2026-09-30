'use strict';
/** Public marketing pages. */
const express = require('express');
const { get, all, run } = require('../db');
const { cleanStr, isEmail } = require('../lib/validate');
const { rateLimit } = require('../lib/ratelimit');
const { audit } = require('../lib/audit');

const router = express.Router();

function classWithCounts(row) {
  const c = get(`SELECT COUNT(*) AS n FROM bookings WHERE class_id = ? AND status = 'booked'`, row.id);
  return { ...row, booked: c ? c.n : 0, spotsLeft: Math.max(0, row.capacity - (c ? c.n : 0)) };
}

router.get('/', (req, res) => {
  const classes = all(`SELECT * FROM classes WHERE is_active = 1 ORDER BY id DESC LIMIT 3`).map(classWithCounts);
  const trainers = all(`SELECT * FROM trainers WHERE is_active = 1 ORDER BY sort_order, id LIMIT 3`);
  const plans = all(`SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order, price LIMIT 3`);
  res.render('index', { title: 'Forge Your Strongest Self', classes, trainers, plans });
});

router.get('/classes', (req, res) => {
  const classes = all(`SELECT * FROM classes WHERE is_active = 1 ORDER BY title`).map(classWithCounts);
  res.render('classes', { title: 'Classes', classes });
});

router.get('/classes/:slug', (req, res) => {
  const cls = get(`SELECT * FROM classes WHERE slug = ? AND is_active = 1`, req.params.slug);
  if (!cls) return res.status(404).render('error', { title: 'Class not found', message: 'This class is no longer available.' });
  const c = get(`SELECT COUNT(*) AS n FROM bookings WHERE class_id = ? AND status = 'booked'`, cls.id);
  const booked = c ? c.n : 0;
  let myBooking = null;
  if (req.user) {
    myBooking = get(`SELECT * FROM bookings WHERE user_id = ? AND class_id = ? AND status = 'booked'`,
      req.user.id, cls.id);
  }
  res.render('class-detail', {
    title: cls.title, cls: { ...cls, booked, spotsLeft: Math.max(0, cls.capacity - booked) }, myBooking,
  });
});

router.get('/trainers', (req, res) => {
  const trainers = all(`SELECT * FROM trainers WHERE is_active = 1 ORDER BY sort_order, id`);
  res.render('trainers', { title: 'Trainers', trainers });
});

router.get('/plans', (req, res) => {
  const plans = all(`SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order, price`);
  res.render('plans', { title: 'Membership Plans', plans });
});

router.get('/about', (req, res) => {
  const trainers = all(`SELECT * FROM trainers WHERE is_active = 1 ORDER BY sort_order, id LIMIT 4`);
  res.render('about', { title: 'About Us', trainers });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact', form: {} });
});

router.post('/contact',
  rateLimit({ key: 'contact', max: 5, windowMs: 60 * 60 * 1000, message: 'Too many messages sent. Please try again later.' }),
  (req, res) => {
    const form = {
      name: cleanStr(req.body.name, 80),
      email: cleanStr(req.body.email, 120),
      subject: cleanStr(req.body.subject, 120),
      body: cleanStr(req.body.message, 2000),
    };
    const errors = [];
    if (form.name.length < 2) errors.push('Please enter your name.');
    if (!isEmail(form.email)) errors.push('Please enter a valid email address.');
    if (form.body.length < 10) errors.push('Please write a message of at least 10 characters.');
    if (errors.length) {
      errors.forEach((e) => req.flash('error', e));
      return res.render('contact', { title: 'Contact', form });
    }
    run('INSERT INTO messages (name, email, subject, body, created_at) VALUES (?, ?, ?, ?, ?)',
      form.name, form.email, form.subject, form.body, Date.now());
    audit({ actorId: req.user ? req.user.id : null, action: 'contact_message', detail: form.email, ip: req.ip });
    req.flash('success', 'Message received. Our team will get back to you within 24 hours.');
    res.redirect('/contact');
  });

module.exports = router;
