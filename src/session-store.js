'use strict';
/**
 * express-session store backed by MySQL (sessions table).
 * Survives restarts; sessions expire via the `expires` column.
 */
const session = require('express-session');
const { db } = require('./db');

class MySQLStore extends session.Store {
  constructor() {
    super();
    this.getStmt = db.prepare('SELECT data FROM sessions WHERE id = ? AND (expires IS NULL OR expires > ?)');
    this.setStmt = db.prepare('REPLACE INTO sessions (id, expires, data) VALUES (?, ?, ?)');
    this.destroyStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    this.touchStmt = db.prepare('UPDATE sessions SET expires = ? WHERE id = ?');
    // Opportunistic cleanup of expired rows.
    setInterval(() => {
      try { db.prepare('DELETE FROM sessions WHERE expires IS NOT NULL AND expires < ?').run(Date.now()); } catch {}
    }, 15 * 60 * 1000).unref();
  }

  get(sid, cb) {
    try {
      const row = this.getStmt.get(sid, Date.now());
      cb(null, row ? JSON.parse(row.data) : null);
    } catch (err) { cb(err); }
  }

  set(sid, sess, cb) {
    try {
      const expires = sess.cookie && sess.cookie.expires ? new Date(sess.cookie.expires).getTime() : null;
      this.setStmt.run(sid, expires, JSON.stringify(sess));
      cb(null);
    } catch (err) { cb(err); }
  }

  destroy(sid, cb) {
    try { this.destroyStmt.run(sid); cb(null); } catch (err) { cb(err); }
  }

  touch(sid, sess, cb) {
    try {
      const expires = sess.cookie && sess.cookie.expires ? new Date(sess.cookie.expires).getTime() : null;
      this.touchStmt.run(expires, sid);
      cb(null);
    } catch (err) { cb(err); }
  }
}

module.exports = { SQLiteStore: MySQLStore, MySQLStore };
