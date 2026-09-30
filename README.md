# FORGEFIT STUDIO // ATHLETIC PERFORMANCE PLATFORM

![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-Templates-B4CA65?style=for-the-badge&logo=ejs&logoColor=white)
![Security](https://img.shields.io/badge/Security-2FA%20%7C%20OTP%20%7C%20CSRF-B7FF00?style=for-the-badge&logo=auth0&logoColor=black)

> High-performance athletic club web platform engineered with a cinematic dark aesthetic, neon electric lime accents (`#B7FF00`), complete authentication with 2FA/OTP, member portal, real-time booking engine, and an enterprise administrative command hub powered by MySQL/MariaDB.

---

## ⚡ Key Highlights & Architecture

- **Visual Design**: High-end athletic aesthetic inspired by luxury athletic brands — near-black `#050708` canvas, neon electric lime `#B7FF00` glow accents, glassmorphic cards, custom typography, and responsive micro-interactions.
- **Full-Stack Stack**: Node.js 22+, Express, EJS layout templating, and `sync-mysql` connecting to MariaDB / MySQL.
- **Relational Database**: 12 structured relational tables with foreign keys, cascading deletions, composite indices, and complete schema dumps included (`forgefit.sql` and `database.sql`).
- **Comprehensive Auth & 2FA**:
  - Email OTP registration and verification.
  - Two-Factor Authentication via Authenticator Apps (Google Authenticator, 1Password, Authy) with inline QR code generation and emergency backup codes.
  - Fallback email-code 2FA and password resets via time-limited OTP tokens.
  - Cryptographic password hashing with `scrypt` and timing-safe comparisons.
- **Member Portal**:
  - Live session booking with seat capacity enforcement and real-time counter decrement.
  - Active reservation management, cancellation, and past booking history.
  - Profile customization and self-service security controls.
- **Master Admin Command Console (`/admin`)**:
  - **Executive KPI Dashboard**: 8 real-time metrics (Gross Revenue, Active Members, Timetable Capacity, Coach Roster, Pending Inquiries).
  - **Security & Audit Hub (`/admin/security`)**: Real-time 2FA adoption telemetry, brute-force failure tracking, active database session counts, defense-in-depth architecture checklist, emergency session revocation controls (*Revoke All Member Sessions*, *Revoke Other Admin Sessions*, *Purge Stale Tokens*), and a searchable audit log.
  - **Catalog Management**: Full CRUD for Classes, Trainers (with custom portrait uploads), Membership Plans, and Class Bookings.
  - **Communications Desk**: Member contact inquiries with real-time unread counter badge.
  - **System Settings**: Dynamic SMTP configuration and direct deep-link to phpMyAdmin.

---

## 📁 Repository Structure

```text
forgefit/
├── database.sql                  # Complete SQL schema & catalog dump (MySQL / MariaDB)
├── forgefit.sql                  # Alternative 1-click import SQL dump
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules (protects credentials & logs)
├── start.bat                     # Windows one-click local launcher
├── package.json                  # Dependencies & execution scripts
├── scripts/
│   ├── migrate-to-mysql.js       # SQLite to MySQL database migration script
│   ├── seed-admin.js             # Initial administrator seed utility
│   └── seed-catalog.js           # Catalog seed (Plans, Indian Master Coaches, Classes)
├── src/
│   ├── app.js                    # Express application configuration & middleware
│   ├── config.js                 # Centralized configuration & environment loader
│   ├── db.js                     # MySQL connection manager & auto-migration engine
│   ├── index.js                  # HTTP server entrypoint
│   ├── mail.js                   # Nodemailer SMTP transporter & email templates
│   ├── middleware/
│   │   ├── auth.js               # Route guards (requireAuth, requireAdmin)
│   │   ├── csrf.js               # CSRF token generation & validation
│   │   ├── rateLimit.js          # Memory-backed sliding window rate limiters
│   │   └── upload.js             # Multer image upload filter & disk storage
│   ├── models/                   # Core business logic (auth, user, booking, otp)
│   ├── routes/
│   │   ├── account.js            # Member dashboard, profile & 2FA routes
│   │   ├── admin.js              # Administrative console & security routes
│   │   ├── auth.js               # Register, login, OTP verify, password reset
│   │   └── public.js             # Home, classes, coaches, plans, about, contact
│   ├── views/                    # EJS views & UI partials
│   └── public/                   # Static assets (CSS, JS, optimized WebP/JPG images, video)
```

---

## 🚀 In-Detail Installation Guide

### Prerequisites

Ensure you have the following installed on your machine:
1. **Node.js**: Version `22.0.0` or higher ([Download Node.js](https://nodejs.org/)).
2. **Git**: Version `2.x` or higher ([Download Git](https://git-scm.com/)).
3. **MySQL or MariaDB Database**:
   - **Recommended on Windows**: [XAMPP](https://www.apachefriends.org/) (includes Apache, MariaDB/MySQL, and phpMyAdmin).
   - **Alternative**: Standalone MySQL Community Server 8.x or MariaDB 10.4+.

---

### Step 1: Clone the Repository

Open your terminal or PowerShell and clone the project:

```bash
git clone https://github.com/shubhXlab/forgefit-studio.git
cd forgefit-studio
```

---

### Step 2: Install Node Dependencies

Install all required production dependencies:

```bash
npm install
```

---

### Step 3: Setup the Database (MySQL / MariaDB)

You can set up the database using **Method A (phpMyAdmin Web UI)** or **Method B (Command Line)**.

#### Method A: Using phpMyAdmin (Quickest & Easiest)
1. Open the XAMPP Control Panel and start **Apache** and **MySQL**.
2. Open your browser and navigate to: `http://localhost/phpmyadmin`
3. Click on the **Databases** tab, type `forgefit` in the *Create database* field, and click **Create** (Collation: `utf8mb4_general_ci` or `utf8mb4_unicode_ci`).
4. Select the newly created `forgefit` database from the left sidebar.
5. Click on the **Import** tab in the top navigation.
6. Click **Choose File** and select `forgefit.sql` (or `database.sql`) from the project root.
7. Scroll to the bottom and click **Import** (or **Go**).
8. You will see green success alerts indicating all 12 tables and initial records were imported.

#### Method B: Using MySQL Command Line

```bash
# If using XAMPP on Windows:
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS forgefit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
"C:\xampp\mysql\bin\mysql.exe" -u root forgefit < forgefit.sql

# If using native MySQL on Linux/macOS:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS forgefit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p forgefit < forgefit.sql
```

---

### Step 4: Configure Environment Variables

Create your `.env` configuration file by copying the provided template:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS / Bash
cp .env.example .env
```

Open `.env` in your code editor and verify your database settings:

```ini
PORT=3100
BASE_URL=http://localhost:3100
NODE_ENV=development

# Database Settings (Default XAMPP settings: root with no password)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=forgefit

# Optional phpMyAdmin Quick Link for Admin Console
PHPMYADMIN_URL=http://localhost/phpmyadmin/index.php?route=/database/structure&db=forgefit

# Session Security (Change to a long random secret in production)
SESSION_SECRET=forgefit_dev_secret_key_8493021984210984102984102984

# Cookie Security (Keep 0 on localhost; set to 1 when using HTTPS)
SECURE_COOKIES=0
TRUST_PROXY=0

# SMTP / Email Configuration (Used for real-time OTP delivery)
FORGEFIT_SMTP_HOST=smtp.gmail.com
FORGEFIT_SMTP_PORT=465
FORGEFIT_SMTP_USER=your_email@gmail.com
FORGEFIT_SMTP_PASS=your_gmail_app_password_here
FORGEFIT_SMTP_SECURE=1
FORGEFIT_SMTP_FROM="ForgeFit Studio <noreply@forgefit.com>"
```

> **Note on Email / OTP Delivery**:
> If SMTP credentials are not configured or invalid, OTP codes are automatically logged to the server console and to `data/mail-dev.log` so you can test full registration and login without an email service.

---

### Step 5: Start the Application

#### Option 1: Via npm
```bash
npm start
```

#### Option 2: Windows 1-Click Launcher
Double-click `start.bat` in the project root directory.

You will see:
```text
ForgeFit Studio running at http://localhost:3100
```

---

## 🔑 Default Credentials

### Administrator Portal
- **URL**: `http://localhost:3100/admin` (or click **Console** in navigation when logged in)
- **Email**: `admin@forgefit.com`
- **Password**: `Admin@ForgeFit2026!`

*(You can also seed custom admin credentials at any time via:*
`ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='YourPassword123!' npm run seed:admin`)

### Public Web Experience
- **Public Homepage**: `http://localhost:3100/`
- **Class Timetable**: `http://localhost:3100/classes`
- **Master Coaches Roster**: `http://localhost:3100/trainers`
- **Membership Plans**: `http://localhost:3100/plans`
- **Manifesto & About**: `http://localhost:3100/about`
- **Concierge Desk**: `http://localhost:3100/contact`

---

## 🗄️ Database Architecture & Tables

The `forgefit.sql` database dump includes 12 relational tables:

| Table | Purpose | Key Attributes |
| :--- | :--- | :--- |
| `users` | Member & administrator accounts | `id`, `name`, `email`, `password_hash`, `role`, `two_factor_enabled`, `two_factor_secret`, `is_active` |
| `trainers` | Certified master coach faculty roster | `id`, `name`, `specialty`, `bio`, `image`, `sort_order`, `is_active` |
| `classes` | Studio training curriculum & timetable | `id`, `title`, `slug`, `trainer_name`, `schedule`, `capacity`, `duration_min`, `level`, `price`, `image` |
| `plans` | Membership subscription tiers | `id`, `name`, `price`, `duration_days`, `features`, `sort_order`, `is_active` |
| `bookings` | Member class reservations | `id`, `user_id`, `class_id`, `status` (`booked`, `cancelled`), `created_at` |
| `memberships` | Active subscriptions linked to members | `id`, `user_id`, `plan_id`, `starts_at`, `ends_at`, `status` |
| `messages` | Contact form leads & inquiries | `id`, `name`, `email`, `subject`, `body`, `is_read`, `created_at` |
| `sessions` | Express session storage | `id`, `expires`, `data` (survives process restarts) |
| `settings` | Dynamic studio & SMTP configurations | `key`, `value` (overrides DB settings via UI) |
| `audit_log` | Security surveillance & admin audit trail | `id`, `actor_id`, `action`, `detail`, `ip`, `created_at` |
| `otps` | One-Time Password tokens (email auth) | `id`, `user_id`, `purpose`, `code_hash`, `attempts`, `expires_at` |
| `backup_codes`| Emergency 2FA recovery codes | `id`, `user_id`, `code_hash`, `used_at`, `created_at` |

---

## 🛡️ Security Features

1. **Defense-in-Depth Session Revocation**: Administrators can terminate all member sessions or other administrator sessions in one click during emergency security triage.
2. **Audit Logging**: Every sensitive action (`admin_login`, `trainer_create`, `class_update`, `emergency_revoke_members`, etc.) is logged with actor ID, IP address, and timestamp.
3. **Anti-Brute Force Protection**: IP and user-targeted rate limiting on `/login`, `/register`, `/forgot-password`, and OTP endpoints.
4. **CSRF Protection**: Cryptographic CSRF tokens embedded in all POST forms with strict origin validation.
5. **Secure Headers**: Pre-configured `helmet` HTTP headers protecting against clickjacking, MIME-sniffing, and XSS attacks.

---

## 🛠️ Maintenance & CLI Scripts

```bash
# Seed initial administrator account
npm run seed:admin

# Reset & re-seed catalog (Plans, Master Coaches, Classes)
npm run seed:catalog

# Migrate existing SQLite data into MySQL
npm run migrate:mysql
```

---

## 📜 License & Credits

- **Platform Architecture & Engineering**: ForgeFit Studio Engineering Team & [shubhXlab](https://github.com/shubhXlab).
- **License**: MIT License — open for commercial and personal customization.
