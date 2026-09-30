'use strict';
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const config = require('./config');
require('./db'); // ensure schema exists
const { getSetting, get } = require('./db');
const { SQLiteStore } = require('./session-store');
const { csrfMiddleware, verifyCsrf } = require('./lib/csrf');
const { loadUser } = require('./middleware/auth');
const expressLayouts = require('express-ejs-layouts');

const app = express();

if (config.trustProxy) app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(helmet({
  contentSecurityPolicy: false, // pages use small inline scripts (QR render, menus)
  crossOriginEmbedderPolicy: false,
}));
app.use(express.static(path.join(__dirname, 'public'), { 
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  etag: true,
}));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(express.json({ limit: '256kb' }));

app.use(session({
  name: 'forgefit.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: new SQLiteStore(),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
  },
}));

// Flash messages: req.flash(type, msg) / consumed into res.locals.flash
app.use((req, res, next) => {
  req.flash = (type, msg) => {
    req.session.flash = req.session.flash || [];
    req.session.flash.push({ type, msg });
  };
  next();
});

app.use(csrfMiddleware);
app.use(loadUser);

// Global template locals
app.use((req, res, next) => {
  const flash = req.session.flash || [];
  req.session.flash = [];
  res.locals.flash = flash;
  res.locals.siteName = getSetting('site_name') || config.siteName;
  res.locals.baseUrl = config.baseUrl;
  res.locals.currentPath = req.path;
  res.locals.isAdminPage = req.path.startsWith('/admin');
  res.locals.query = req.query;
  res.locals.config = config;
  res.locals.unreadCount = 0;
  if (res.locals.isAdminPage) {
    try {
      const resCount = get('SELECT COUNT(*) AS n FROM messages WHERE is_read = 0');
      if (resCount) res.locals.unreadCount = resCount.n;
    } catch {}
  }
  next();
});

app.use(verifyCsrf);

app.use('/', require('./routes/public'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/account'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    message: 'The page you are looking for does not exist or was moved.',
  });
});

// 500
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[forgefit]', err);
  res.status(500).render('error', {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again in a moment.',
  });
});

module.exports = app;
