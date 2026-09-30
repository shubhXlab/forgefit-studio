'use strict';
/** Append-only audit trail for admin and auth events. */
const { run } = require('../db');

function audit({ actorId = null, action, detail = '', ip = null }) {
  try {
    run('INSERT INTO audit_log (actor_id, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)',
      actorId, String(action).slice(0, 80), String(detail).slice(0, 2000), ip, Date.now());
  } catch { /* audit must never break the request */ }
}

module.exports = { audit };
