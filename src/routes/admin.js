'use strict';
/**
 * Admin dashboard: overview, members, classes, trainers, plans,
 * memberships, bookings, contact messages, site/email settings.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { db, get, all, run, getSetting, setSetting } = require('../db');
const { requireAdmin, ensureFullAuth } = require('../middleware/auth');
const config = require('../config');
const { cleanStr, isPositiveInt } = require('../lib/validate');
const { rateLimit } = require('../lib/ratelimit');
const { audit } = require('../lib/audit');

const router = express.Router();
router.use(requireAdmin, ensureFullAuth);

/* ---------- image uploads ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadsDir),
  filename: (req, file, cb) => {
    const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype] || '.bin';
    cb(null, 'img-' + Date.now().toString(36) + '-' + crypto.randomBytes(6).toString('hex') + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG or WebP images are allowed.'));
  },
}).single('image');

function handleUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      req.flash('error', err.message || 'Image upload failed.');
      return res.redirect('back');
    }
    // Verify magic bytes — don't trust the mimetype alone.
    if (req.file) {
      const head = fs.readFileSync(req.file.path).subarray(0, 12);
      const isJpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
      const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
      const isWebp = head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP';
      if (!isJpg && !isPng && !isWebp) {
        fs.unlinkSync(req.file.path);
        req.file = null;
        req.flash('error', 'That file is not a valid image.');
        return res.redirect('back');
      }
    }
    next();
  });
}

function resolveImage(req, existing) {
  if (req.file) {
    if (existing) { try { fs.unlinkSync(path.join(config.uploadsDir, path.basename(existing))); } catch {} }
    return '/uploads/' + path.basename(req.file.path);
  }
  const gallery = cleanStr(req.body.gallery_image, 120);
  if (gallery && gallery.startsWith('/img/') && !gallery.includes('..')) return gallery;
  return existing || '';
}

function slugify(title, idHint) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'class';
  return `${base}-${idHint || crypto.randomBytes(3).toString('hex')}`;
}

/* ---------- overview ---------- */

router.get('/', (req, res) => {
  const stats = {
    members: get(`SELECT COUNT(*) AS n FROM users WHERE role = 'member'`).n,
    admins: get(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`).n,
    activeClasses: get(`SELECT COUNT(*) AS n FROM classes WHERE is_active = 1`).n,
    bookings: get(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'booked'`).n,
    bookingsMonth: get(`SELECT COUNT(*) AS n FROM bookings WHERE created_at > ?`, Date.now() - 30 * 864e5).n,
    unreadMessages: get(`SELECT COUNT(*) AS n FROM messages WHERE is_read = 0`).n,
    activeMemberships: get(`SELECT COUNT(*) AS n FROM memberships WHERE status = 'active' AND ends_at > ?`, Date.now()).n,
    newMembersWeek: get(`SELECT COUNT(*) AS n FROM users WHERE created_at > ?`, Date.now() - 7 * 864e5).n,
  };
  const recentBookings = all(
    `SELECT b.*, u.name AS user_name, c.title AS class_title
     FROM bookings b JOIN users u ON u.id = b.user_id JOIN classes c ON c.id = b.class_id
     ORDER BY b.created_at DESC LIMIT 8`);
  const recentMembers = all(`SELECT * FROM users ORDER BY created_at DESC LIMIT 6`);
  const recentAudit = all(`SELECT a.*, u.name AS actor_name FROM audit_log a
    LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 8`);
  res.render('admin/dashboard', { title: 'Admin Dashboard', stats, recentBookings, recentMembers, recentAudit });
});

/* ---------- members ---------- */

router.get('/members', (req, res) => {
  const q = cleanStr(req.query.q || '', 80);
  let members;
  if (q) {
    const like = `%${q}%`;
    members = all(`SELECT * FROM users WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY created_at DESC LIMIT 100`,
      like, like, like);
  } else {
    members = all(`SELECT * FROM users ORDER BY created_at DESC LIMIT 100`);
  }
  res.render('admin/members', { title: 'Members', members, q });
});

router.post('/members/:id/toggle-active', (req, res) => {
  const m = get('SELECT * FROM users WHERE id = ?', req.params.id);
  if (!m || m.id === req.user.id) { req.flash('error', 'Cannot change this account.'); return res.redirect('/admin/members'); }
  run('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?', m.is_active ? 0 : 1, Date.now(), m.id);
  audit({ actorId: req.user.id, action: m.is_active ? 'member_deactivated' : 'member_activated', detail: m.email, ip: req.ip });
  req.flash('success', `${m.name} ${m.is_active ? 'deactivated' : 'activated'}.`);
  res.redirect('/admin/members');
});

router.post('/members/:id/role', (req, res) => {
  const m = get('SELECT * FROM users WHERE id = ?', req.params.id);
  const role = req.body.role === 'admin' ? 'admin' : 'member';
  if (!m || m.id === req.user.id) { req.flash('error', 'Cannot change this account.'); return res.redirect('/admin/members'); }
  run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', role, Date.now(), m.id);
  audit({ actorId: req.user.id, action: 'member_role', detail: `${m.email} -> ${role}`, ip: req.ip });
  req.flash('success', `${m.name} is now ${role}.`);
  res.redirect('/admin/members');
});

router.post('/members/:id/delete', (req, res) => {
  const m = get('SELECT * FROM users WHERE id = ?', req.params.id);
  if (!m || m.id === req.user.id || m.role === 'admin') { req.flash('error', 'Cannot delete this account.'); return res.redirect('/admin/members'); }
  run('DELETE FROM users WHERE id = ?', m.id);
  audit({ actorId: req.user.id, action: 'member_deleted', detail: m.email, ip: req.ip });
  req.flash('success', `${m.name} deleted.`);
  res.redirect('/admin/members');
});

/* ---------- classes ---------- */

router.get('/classes', (req, res) => {
  const classes = all(`SELECT c.*, (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status = 'booked') AS booked
    FROM classes c ORDER BY c.is_active DESC, c.title`);
  res.render('admin/classes', { title: 'Manage Classes', classes });
});

router.get('/classes/new', (req, res) => {
  res.render('admin/class-form', { title: 'New Class', cls: {}, gallery: galleryImages(), formAction: '/admin/classes' });
});

router.post('/classes', handleUpload, (req, res) => {
  const f = readClassForm(req);
  if (f.errors.length) { f.errors.forEach((e) => req.flash('error', e)); if (req.file) fs.unlinkSync(req.file.path);
    return res.render('admin/class-form', { title: 'New Class', cls: f.cls, gallery: galleryImages(), formAction: '/admin/classes' }); }
  const now = Date.now();
  const info = run(`INSERT INTO classes (title, slug, description, trainer_name, schedule, capacity, duration_min, level, price, image, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    f.cls.title, slugify(f.cls.title), f.cls.description, f.cls.trainer_name, f.cls.schedule, f.cls.capacity,
    f.cls.duration_min, f.cls.level, f.cls.price, resolveImage(req, ''), now, now);
  audit({ actorId: req.user.id, action: 'class_create', detail: f.cls.title, ip: req.ip });
  req.flash('success', 'Class created.');
  res.redirect('/admin/classes');
});

router.get('/classes/:id/edit', (req, res) => {
  const cls = get('SELECT * FROM classes WHERE id = ?', req.params.id);
  if (!cls) return res.redirect('/admin/classes');
  res.render('admin/class-form', { title: 'Edit Class', cls, gallery: galleryImages(), formAction: `/admin/classes/${cls.id}` });
});

router.post('/classes/:id', handleUpload, (req, res) => {
  const cls = get('SELECT * FROM classes WHERE id = ?', req.params.id);
  if (!cls) return res.redirect('/admin/classes');
  const f = readClassForm(req);
  if (f.errors.length) { f.errors.forEach((e) => req.flash('error', e)); if (req.file) fs.unlinkSync(req.file.path);
    return res.render('admin/class-form', { title: 'Edit Class', cls: { ...cls, ...f.cls }, gallery: galleryImages(), formAction: `/admin/classes/${cls.id}` }); }
  run(`UPDATE classes SET title = ?, description = ?, trainer_name = ?, schedule = ?, capacity = ?,
    duration_min = ?, level = ?, price = ?, image = ?, updated_at = ? WHERE id = ?`,
    f.cls.title, f.cls.description, f.cls.trainer_name, f.cls.schedule, f.cls.capacity,
    f.cls.duration_min, f.cls.level, f.cls.price, resolveImage(req, cls.image), Date.now(), cls.id);
  audit({ actorId: req.user.id, action: 'class_update', detail: f.cls.title, ip: req.ip });
  req.flash('success', 'Class updated.');
  res.redirect('/admin/classes');
});

router.post('/classes/:id/toggle', (req, res) => {
  const cls = get('SELECT * FROM classes WHERE id = ?', req.params.id);
  if (cls) {
    run('UPDATE classes SET is_active = ?, updated_at = ? WHERE id = ?', cls.is_active ? 0 : 1, Date.now(), cls.id);
    audit({ actorId: req.user.id, action: 'class_toggle', detail: cls.title, ip: req.ip });
  }
  res.redirect('/admin/classes');
});

router.post('/classes/:id/delete', (req, res) => {
  const cls = get('SELECT * FROM classes WHERE id = ?', req.params.id);
  if (!cls) return res.redirect('/admin/classes');
  const n = get(`SELECT COUNT(*) AS n FROM bookings WHERE class_id = ? AND status = 'booked'`, cls.id).n;
  if (n > 0) { req.flash('error', `Cannot delete — ${n} active booking(s) exist. Deactivate it instead.`); return res.redirect('/admin/classes'); }
  if (cls.image && cls.image.startsWith('/uploads/')) { try { fs.unlinkSync(path.join(config.uploadsDir, path.basename(cls.image))); } catch {} }
  run('DELETE FROM classes WHERE id = ?', cls.id);
  audit({ actorId: req.user.id, action: 'class_delete', detail: cls.title, ip: req.ip });
  req.flash('success', 'Class deleted.');
  res.redirect('/admin/classes');
});

function readClassForm(req) {
  const cls = {
    title: cleanStr(req.body.title, 120),
    description: cleanStr(req.body.description, 2000),
    trainer_name: cleanStr(req.body.trainer_name, 80),
    schedule: cleanStr(req.body.schedule, 120),
    capacity: parseInt(req.body.capacity, 10),
    duration_min: parseInt(req.body.duration_min, 10),
    level: cleanStr(req.body.level, 40),
    price: parseFloat(req.body.price),
  };
  const errors = [];
  if (cls.title.length < 3) errors.push('Title needs at least 3 characters.');
  if (!isPositiveInt(cls.capacity, 500)) errors.push('Capacity must be a positive number.');
  if (!isPositiveInt(cls.duration_min, 600)) errors.push('Duration must be a positive number of minutes.');
  if (!(cls.price >= 0) || cls.price > 1000000) errors.push('Price must be a valid amount.');
  cls.capacity = Math.max(1, cls.capacity || 20);
  cls.duration_min = Math.max(1, cls.duration_min || 60);
  cls.price = Math.max(0, cls.price || 0);
  return { cls, errors };
}

function galleryImages() {
  try {
    return fs.readdirSync(path.join(config.root, 'src', 'public', 'img'))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => '/img/' + f);
  } catch { return []; }
}

/* ---------- trainers ---------- */

router.get('/trainers', (req, res) => {
  const trainers = all('SELECT * FROM trainers ORDER BY sort_order, id');
  res.render('admin/trainers', { title: 'Manage Trainers', trainers });
});

router.get('/trainers/new', (req, res) => {
  res.render('admin/trainer-form', { title: 'New Trainer', t: {}, gallery: galleryImages(), formAction: '/admin/trainers' });
});

function readTrainerForm(req) {
  const t = {
    name: cleanStr(req.body.name, 80),
    specialty: cleanStr(req.body.specialty, 120),
    bio: cleanStr(req.body.bio, 2000),
    sort_order: parseInt(req.body.sort_order, 10) || 0,
  };
  const errors = [];
  if (t.name.length < 2) errors.push('Name is required.');
  return { t, errors };
}

router.post('/trainers', handleUpload, (req, res) => {
  const { t, errors } = readTrainerForm(req);
  if (errors.length) { errors.forEach((e) => req.flash('error', e)); if (req.file) fs.unlinkSync(req.file.path);
    return res.render('admin/trainer-form', { title: 'New Trainer', t, gallery: galleryImages(), formAction: '/admin/trainers' }); }
  run('INSERT INTO trainers (name, specialty, bio, image, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    t.name, t.specialty, t.bio, resolveImage(req, ''), t.sort_order, Date.now());
  audit({ actorId: req.user.id, action: 'trainer_create', detail: t.name, ip: req.ip });
  req.flash('success', 'Trainer added.');
  res.redirect('/admin/trainers');
});

router.get('/trainers/:id/edit', (req, res) => {
  const t = get('SELECT * FROM trainers WHERE id = ?', req.params.id);
  if (!t) return res.redirect('/admin/trainers');
  res.render('admin/trainer-form', { title: 'Edit Trainer', t, gallery: galleryImages(), formAction: `/admin/trainers/${t.id}` });
});

router.post('/trainers/:id', handleUpload, (req, res) => {
  const t0 = get('SELECT * FROM trainers WHERE id = ?', req.params.id);
  if (!t0) return res.redirect('/admin/trainers');
  const { t, errors } = readTrainerForm(req);
  if (errors.length) { errors.forEach((e) => req.flash('error', e)); if (req.file) fs.unlinkSync(req.file.path);
    return res.render('admin/trainer-form', { title: 'Edit Trainer', t: { ...t0, ...t }, gallery: galleryImages(), formAction: `/admin/trainers/${t0.id}` }); }
  run('UPDATE trainers SET name = ?, specialty = ?, bio = ?, image = ?, sort_order = ? WHERE id = ?',
    t.name, t.specialty, t.bio, resolveImage(req, t0.image), t.sort_order, t0.id);
  audit({ actorId: req.user.id, action: 'trainer_update', detail: t.name, ip: req.ip });
  req.flash('success', 'Trainer updated.');
  res.redirect('/admin/trainers');
});

router.post('/trainers/:id/toggle', (req, res) => {
  const t = get('SELECT * FROM trainers WHERE id = ?', req.params.id);
  if (t) run('UPDATE trainers SET is_active = ? WHERE id = ?', t.is_active ? 0 : 1, t.id);
  res.redirect('/admin/trainers');
});

router.post('/trainers/:id/delete', (req, res) => {
  const t = get('SELECT * FROM trainers WHERE id = ?', req.params.id);
  if (t) {
    if (t.image && t.image.startsWith('/uploads/')) { try { fs.unlinkSync(path.join(config.uploadsDir, path.basename(t.image))); } catch {} }
    run('DELETE FROM trainers WHERE id = ?', t.id);
    audit({ actorId: req.user.id, action: 'trainer_delete', detail: t.name, ip: req.ip });
    req.flash('success', 'Trainer deleted.');
  }
  res.redirect('/admin/trainers');
});

/* ---------- plans ---------- */

router.get('/plans', (req, res) => {
  const plans = all('SELECT * FROM plans ORDER BY sort_order, price');
  res.render('admin/plans', { title: 'Membership Plans', plans });
});

function readPlanForm(req) {
  const p = {
    name: cleanStr(req.body.name, 80),
    price: parseFloat(req.body.price),
    duration_days: parseInt(req.body.duration_days, 10),
    features: cleanStr(req.body.features, 2000),
    sort_order: parseInt(req.body.sort_order, 10) || 0,
  };
  const errors = [];
  if (p.name.length < 2) errors.push('Plan name is required.');
  if (!(p.price >= 0) || p.price > 10000000) errors.push('Price must be a valid amount.');
  if (!isPositiveInt(p.duration_days, 3650)) errors.push('Duration must be a positive number of days.');
  p.price = Math.max(0, p.price || 0);
  p.duration_days = Math.max(1, p.duration_days || 30);
  return { p, errors };
}

router.get('/plans/new', (req, res) => {
  res.render('admin/plan-form', { title: 'New Plan', p: {}, formAction: '/admin/plans' });
});

router.post('/plans', (req, res) => {
  const { p, errors } = readPlanForm(req);
  if (errors.length) { errors.forEach((e) => req.flash('error', e));
    return res.render('admin/plan-form', { title: 'New Plan', p, formAction: '/admin/plans' }); }
  run('INSERT INTO plans (name, price, duration_days, features, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    p.name, p.price, p.duration_days, p.features, p.sort_order, Date.now());
  audit({ actorId: req.user.id, action: 'plan_create', detail: p.name, ip: req.ip });
  req.flash('success', 'Plan created.');
  res.redirect('/admin/plans');
});

router.get('/plans/:id/edit', (req, res) => {
  const p = get('SELECT * FROM plans WHERE id = ?', req.params.id);
  if (!p) return res.redirect('/admin/plans');
  res.render('admin/plan-form', { title: 'Edit Plan', p, formAction: `/admin/plans/${p.id}` });
});

router.post('/plans/:id', (req, res) => {
  const p0 = get('SELECT * FROM plans WHERE id = ?', req.params.id);
  if (!p0) return res.redirect('/admin/plans');
  const { p, errors } = readPlanForm(req);
  if (errors.length) { errors.forEach((e) => req.flash('error', e));
    return res.render('admin/plan-form', { title: 'Edit Plan', p: { ...p0, ...p }, formAction: `/admin/plans/${p0.id}` }); }
  run('UPDATE plans SET name = ?, price = ?, duration_days = ?, features = ?, sort_order = ? WHERE id = ?',
    p.name, p.price, p.duration_days, p.features, p.sort_order, p0.id);
  audit({ actorId: req.user.id, action: 'plan_update', detail: p.name, ip: req.ip });
  req.flash('success', 'Plan updated.');
  res.redirect('/admin/plans');
});

router.post('/plans/:id/toggle', (req, res) => {
  const p = get('SELECT * FROM plans WHERE id = ?', req.params.id);
  if (p) run('UPDATE plans SET is_active = ? WHERE id = ?', p.is_active ? 0 : 1, p.id);
  res.redirect('/admin/plans');
});

router.post('/plans/:id/delete', (req, res) => {
  const p = get('SELECT * FROM plans WHERE id = ?', req.params.id);
  if (!p) return res.redirect('/admin/plans');
  const n = get('SELECT COUNT(*) AS n FROM memberships WHERE plan_id = ?', p.id).n;
  if (n > 0) { req.flash('error', 'Cannot delete — memberships use this plan. Deactivate it instead.'); return res.redirect('/admin/plans'); }
  run('DELETE FROM plans WHERE id = ?', p.id);
  audit({ actorId: req.user.id, action: 'plan_delete', detail: p.name, ip: req.ip });
  req.flash('success', 'Plan deleted.');
  res.redirect('/admin/plans');
});

/* ---------- memberships ---------- */

router.get('/memberships', (req, res) => {
  const memberships = all(
    `SELECT m.*, u.name AS user_name, u.email AS user_email, p.name AS plan_name
     FROM memberships m JOIN users u ON u.id = m.user_id JOIN plans p ON p.id = m.plan_id
     ORDER BY m.created_at DESC LIMIT 200`);
  const members = all(`SELECT id, name, email FROM users WHERE role = 'member' AND is_active = 1 ORDER BY name LIMIT 500`);
  const plans = all(`SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order`);
  res.render('admin/memberships', { title: 'Memberships', memberships, members, plans });
});

router.post('/memberships/assign',
  rateLimit({ key: 'massign', max: 30, windowMs: 60 * 60 * 1000 }),
  (req, res) => {
    const userId = parseInt(req.body.user_id, 10);
    const planId = parseInt(req.body.plan_id, 10);
    const user = get(`SELECT * FROM users WHERE id = ? AND role = 'member'`, userId);
    const plan = get('SELECT * FROM plans WHERE id = ? AND is_active = 1', planId);
    if (!user || !plan) { req.flash('error', 'Invalid member or plan.'); return res.redirect('/admin/memberships'); }
    const now = Date.now();
    run(`UPDATE memberships SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`, userId);
    run(`INSERT INTO memberships (user_id, plan_id, starts_at, ends_at, created_at) VALUES (?, ?, ?, ?, ?)`,
      userId, planId, now, now + plan.duration_days * 864e5, now);
    audit({ actorId: req.user.id, action: 'membership_assign', detail: `${user.email} -> ${plan.name}`, ip: req.ip });
    req.flash('success', `${plan.name} assigned to ${user.name}.`);
    res.redirect('/admin/memberships');
  });

router.post('/memberships/:id/cancel', (req, res) => {
  run(`UPDATE memberships SET status = 'cancelled' WHERE id = ?`, req.params.id);
  audit({ actorId: req.user.id, action: 'membership_cancel', detail: 'id ' + req.params.id, ip: req.ip });
  req.flash('success', 'Membership cancelled.');
  res.redirect('/admin/memberships');
});

/* ---------- bookings ---------- */

router.get('/bookings', (req, res) => {
  const status = ['booked', 'cancelled', 'attended'].includes(req.query.status) ? req.query.status : '';
  const where = status ? `WHERE b.status = '${status}'` : '';
  const bookings = all(
    `SELECT b.*, u.name AS user_name, u.email AS user_email, c.title AS class_title
     FROM bookings b JOIN users u ON u.id = b.user_id JOIN classes c ON c.id = b.class_id
     ${where} ORDER BY b.created_at DESC LIMIT 200`);
  res.render('admin/bookings', { title: 'Bookings', bookings, status });
});

router.post('/bookings/:id/status', (req, res) => {
  const status = ['booked', 'cancelled', 'attended'].includes(req.body.status) ? req.body.status : null;
  if (!status) { req.flash('error', 'Invalid status.'); return res.redirect('/admin/bookings'); }
  run('UPDATE bookings SET status = ? WHERE id = ?', status, req.params.id);
  audit({ actorId: req.user.id, action: 'booking_status', detail: `id ${req.params.id} -> ${status}`, ip: req.ip });
  req.flash('success', 'Booking updated.');
  res.redirect('/admin/bookings');
});

/* ---------- messages ---------- */

router.get('/messages', (req, res) => {
  const messages = all('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200');
  res.render('admin/messages', { title: 'Contact Messages', messages });
});

router.post('/messages/:id/read', (req, res) => {
  run('UPDATE messages SET is_read = 1 WHERE id = ?', req.params.id);
  res.redirect('/admin/messages');
});

router.post('/messages/:id/delete', (req, res) => {
  run('DELETE FROM messages WHERE id = ?', req.params.id);
  audit({ actorId: req.user.id, action: 'message_delete', detail: 'id ' + req.params.id, ip: req.ip });
  req.flash('success', 'Message deleted.');
  res.redirect('/admin/messages');
});

/* ---------- settings ---------- */

router.get('/settings', (req, res) => {
  const keys = ['site_name', 'contact_email', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from'];
  const settings = {};
  keys.forEach((k) => { settings[k] = getSetting(k); });
  res.render('admin/settings', { title: 'Settings', settings });
});

router.post('/settings', (req, res) => {
  const keys = ['site_name', 'contact_email', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_from'];
  keys.forEach((k) => setSetting(k, cleanStr(req.body[k] || '', 200)));
  setSetting('smtp_secure', req.body.smtp_secure === '1' ? '1' : '0');
  // Only overwrite the SMTP password when a new one was typed.
  if (String(req.body.smtp_pass || '').length > 0) setSetting('smtp_pass', String(req.body.smtp_pass).slice(0, 200));
  audit({ actorId: req.user.id, action: 'settings_update', ip: req.ip });
  req.flash('success', 'Settings saved.');
  res.redirect('/admin/settings');
});

/* ---------- security & audit hub ---------- */

router.get('/security', (req, res) => {
  const q = cleanStr(req.query.q || '', 80);
  const actionFilter = cleanStr(req.query.action || '', 50);

  // Security telemetry
  const totalUsers = get('SELECT COUNT(*) AS n FROM users').n;
  const totpUsers = get('SELECT COUNT(*) AS n FROM users WHERE totp_enabled = 1').n;
  const email2faUsers = get('SELECT COUNT(*) AS n FROM users WHERE email_2fa = 1').n;
  const adminUsers = all('SELECT id, name, email, totp_enabled, email_2fa, last_login_at FROM users WHERE role = "admin"');
  const failedLogins24h = get('SELECT COUNT(*) AS n FROM audit_log WHERE action = "login_failed" AND created_at > ?', Date.now() - 24 * 3600 * 1000).n;
  const totalAuditEvents = get('SELECT COUNT(*) AS n FROM audit_log').n;
  const activeSessionsCount = get('SELECT COUNT(*) AS n FROM sessions WHERE expires IS NULL OR expires > ?', Date.now()).n;
  const pendingOtps = get('SELECT COUNT(*) AS n FROM otps WHERE expires_at > ? AND consumed_at IS NULL', Date.now()).n;

  // Build audit query with filters
  let params = [];
  let whereClauses = [];

  if (actionFilter) {
    whereClauses.push('a.action = ?');
    params.push(actionFilter);
  }
  if (q) {
    whereClauses.push('(a.detail LIKE ? OR a.ip LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const auditLogs = all(
    `SELECT a.*, u.name AS actor_name, u.email AS actor_email
     FROM audit_log a
     LEFT JOIN users u ON u.id = a.actor_id
     ${whereSql}
     ORDER BY a.created_at DESC LIMIT 150`,
    ...params
  );

  const distinctActions = all('SELECT DISTINCT action FROM audit_log ORDER BY action').map(r => r.action);

  res.render('admin/security', {
    title: 'Security & Audit Hub',
    telemetry: {
      totalUsers,
      totpUsers,
      email2faUsers,
      twoFaAdoption: totalUsers ? Math.round(((totpUsers + email2faUsers) / totalUsers) * 100) : 0,
      adminUsers,
      failedLogins24h,
      totalAuditEvents,
      activeSessionsCount,
      pendingOtps,
    },
    auditLogs,
    distinctActions,
    q,
    actionFilter,
  });
});

router.post('/security/revoke-members',
  rateLimit({ key: 'revokemembers', max: 5, windowMs: 15 * 60 * 1000 }),
  (req, res) => {
    run('UPDATE users SET session_version = session_version + 1 WHERE role != "admin"');
    audit({ actorId: req.user.id, action: 'security_revoke_members', detail: 'All member sessions terminated', ip: req.ip });
    req.flash('success', 'Security Action Executed: All active member sessions have been revoked.');
    res.redirect('/admin/security');
  }
);

router.post('/security/revoke-admins',
  rateLimit({ key: 'revokeadmins', max: 5, windowMs: 15 * 60 * 1000 }),
  (req, res) => {
    run('UPDATE users SET session_version = session_version + 1 WHERE role = "admin" AND id != ?', req.user.id);
    audit({ actorId: req.user.id, action: 'security_revoke_admins', detail: 'All other admin sessions terminated', ip: req.ip });
    req.flash('success', 'Security Action Executed: All other administrator sessions have been invalidated.');
    res.redirect('/admin/security');
  }
);

router.post('/security/purge-stale',
  rateLimit({ key: 'purgestale', max: 10, windowMs: 15 * 60 * 1000 }),
  (req, res) => {
    const now = Date.now();
    run('DELETE FROM otps WHERE expires_at < ? OR consumed_at IS NOT NULL', now);
    run('DELETE FROM sessions WHERE expires IS NOT NULL AND expires < ?', now);
    audit({ actorId: req.user.id, action: 'security_purge_stale', detail: 'Expired OTPs and stale sessions purged', ip: req.ip });
    req.flash('success', 'Database Hygiene: Expired OTPs and stale session tokens purged successfully.');
    res.redirect('/admin/security');
  }
);

module.exports = router;
