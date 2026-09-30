'use strict';
/**
 * MySQL database driver using sync-mysql.
 * Connects to MySQL/MariaDB (e.g. XAMPP on localhost:3306),
 * ensures schema exists, and provides get(), all(), run(), getSetting(), setSetting().
 */
const Mysql = require('sync-mysql');
const fs = require('fs');
const path = require('path');
const config = require('./config');

fs.mkdirSync(config.uploadsDir, { recursive: true });

// First connect to MySQL server to ensure database exists
const serverConn = new Mysql({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
});

serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.mysql.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

// Connect directly to the application database
const client = new Mysql({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
});

function normalizeSql(sql) {
  return String(sql || '')
    .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT IGNORE INTO')
    .replace(/\bWHERE\s+key\s*=/gi, 'WHERE `key` =')
    .replace(/\bSELECT\s+value\s+FROM\s+settings\s+WHERE\s+key\s*=/gi, 'SELECT `value` FROM settings WHERE `key` =');
}

function flattenParams(params) {
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

function migrate() {
  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      phone VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      email_verified_at BIGINT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      totp_secret VARCHAR(255) NULL,
      totp_enabled TINYINT(1) NOT NULL DEFAULT 0,
      email_2fa TINYINT(1) NOT NULL DEFAULT 0,
      session_version INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      last_login_at BIGINT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(191) NOT NULL,
      user_id INT NULL,
      purpose VARCHAR(50) NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      expires_at BIGINT NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      consumed_at BIGINT NULL,
      created_at BIGINT NOT NULL,
      ip VARCHAR(100) NULL,
      INDEX ix_otps_email_purpose (email, purpose),
      CONSTRAINT fk_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS backup_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      code_hash VARCHAR(191) NOT NULL UNIQUE,
      used_at BIGINT NULL,
      created_at BIGINT NOT NULL,
      CONSTRAINT fk_backup_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(191) NOT NULL UNIQUE,
      description TEXT,
      trainer_name VARCHAR(255) NOT NULL DEFAULT '',
      schedule VARCHAR(255) NOT NULL DEFAULT '',
      capacity INT NOT NULL DEFAULT 20,
      duration_min INT NOT NULL DEFAULT 60,
      level VARCHAR(50) NOT NULL DEFAULT 'All levels',
      price DOUBLE NOT NULL DEFAULT 0,
      image VARCHAR(255) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS trainers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      specialty VARCHAR(255) NOT NULL DEFAULT '',
      bio TEXT,
      image VARCHAR(255) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DOUBLE NOT NULL DEFAULT 0,
      duration_days INT NOT NULL DEFAULT 30,
      features TEXT,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      class_id INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'booked',
      created_at BIGINT NOT NULL,
      INDEX ix_bookings_class (class_id, status),
      INDEX ix_bookings_user_class (user_id, class_id),
      CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_bookings_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS memberships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      plan_id INT NOT NULL,
      starts_at BIGINT NOT NULL,
      ends_at BIGINT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at BIGINT NOT NULL,
      CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_memberships_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(191) NOT NULL,
      subject VARCHAR(255) NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`value\` TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      actor_id INT NULL,
      action VARCHAR(100) NOT NULL,
      detail TEXT,
      ip VARCHAR(100) NULL,
      created_at BIGINT NOT NULL,
      CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      expires BIGINT NULL,
      data MEDIUMTEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (const s of schema) {
    try { client.query(s); } catch (err) { console.error('Migration error:', err.message); }
  }

  // Default settings
  const defaults = {
    site_name: 'ForgeFit Studio',
    contact_email: 'concierge@forgefit.com',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '465',
    smtp_user: '',
    smtp_pass: '',
    smtp_secure: '1',
    smtp_from: 'ForgeFit Studio <concierge@forgefit.com>',
  };
  for (const [k, v] of Object.entries(defaults)) {
    try {
      client.query('INSERT IGNORE INTO settings (`key`, `value`) VALUES (?, ?)', [k, v]);
    } catch {}
  }
}

migrate();

function query(sql, ...params) {
  const norm = normalizeSql(sql);
  const p = flattenParams(params);
  return client.query(norm, p.length ? p : undefined);
}

function get(sql, ...params) {
  const res = query(sql, ...params);
  if (Array.isArray(res) && res.length > 0) return res[0];
  return undefined;
}

function all(sql, ...params) {
  const res = query(sql, ...params);
  if (Array.isArray(res)) return res;
  return [];
}

function run(sql, ...params) {
  const res = query(sql, ...params);
  return {
    changes: res && res.affectedRows != null ? res.affectedRows : 0,
    lastInsertRowid: res && res.insertId != null ? res.insertId : 0,
  };
}

function prepare(sql) {
  return {
    get: (...p) => get(sql, ...p),
    all: (...p) => all(sql, ...p),
    run: (...p) => run(sql, ...p),
  };
}

module.exports = {
  db: {
    prepare,
    exec: (sql) => query(sql),
    query,
  },
  get,
  all,
  run,
  prepare,
  getSetting(key) {
    const row = get('SELECT `value` FROM settings WHERE `key` = ?', key);
    return row ? row.value : '';
  },
  setSetting(key, value) {
    run('REPLACE INTO settings (`key`, `value`) VALUES (?, ?)', key, value);
  },
};
