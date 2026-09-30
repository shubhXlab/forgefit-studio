'use strict';
/**
 * Migrates data from SQLite to MySQL (XAMPP).
 * Creates all tables in MySQL database `forgefit` and imports all records.
 */
const { DatabaseSync } = require('node:sqlite');
const Mysql = require('sync-mysql');
const path = require('path');
const fs = require('fs');

const sqlitePath = path.join(__dirname, '..', 'data', 'forgefit.sqlite');
if (!fs.existsSync(sqlitePath)) {
  console.error('SQLite database not found at:', sqlitePath);
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath);

const mysql = new Mysql({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
});

console.log('Ensuring MySQL database `forgefit` exists...');
mysql.query('CREATE DATABASE IF NOT EXISTS forgefit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
mysql.query('USE forgefit;');

console.log('Creating MySQL tables...');
const tables = [
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

for (const sql of tables) {
  mysql.query(sql);
}

console.log('Tables created. Migrating data from SQLite to MySQL...');

function migrateTable(tableName, idCol = 'id') {
  const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
  if (!rows || rows.length === 0) {
    console.log(`- ${tableName}: 0 rows`);
    return;
  }
  for (const row of rows) {
    const cols = Object.keys(row);
    const escapedCols = cols.map(c => `\`${c}\``).join(', ');
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map(c => row[c]);
    const updateClauses = cols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');

    const query = `INSERT INTO \`${tableName}\` (${escapedCols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClauses}`;
    mysql.query(query, values);
  }
  console.log(`✓ ${tableName}: ${rows.length} rows migrated`);
}

// Migrate in dependency order
migrateTable('users');
migrateTable('trainers');
migrateTable('plans');
migrateTable('classes');
migrateTable('settings');
migrateTable('otps');
migrateTable('backup_codes');
migrateTable('memberships');
migrateTable('bookings');
migrateTable('messages');
migrateTable('audit_log');
migrateTable('sessions');

console.log('\nMigration complete! MySQL database `forgefit` is up to date.');
