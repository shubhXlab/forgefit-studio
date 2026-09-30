# FORGEFIT STUDIO // IN-DETAIL INSTALLATION & DEPLOYMENT MANUAL

This guide provides exhaustive, step-by-step instructions for installing and running **ForgeFit Studio** across Windows (with XAMPP or Native MySQL), Linux (Ubuntu / Debian VPS), and Production environments.

---

## 📑 Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Included Database Dumps](#2-included-database-dumps)
3. [Windows Installation Guide (Using XAMPP)](#3-windows-installation-guide-using-xampp)
4. [Windows Installation Guide (Standalone MySQL Community Server)](#4-windows-installation-guide-standalone-mysql-community-server)
5. [Linux (Ubuntu / Debian VPS) Production Guide](#5-linux-ubuntu--debian-vps-production-guide)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Default Access Credentials](#7-default-access-credentials)
8. [Configuring Email (SMTP) & OTP Delivery](#8-configuring-email-smtp--otp-delivery)
9. [Setting Up 2-Factor Authentication (2FA)](#9-setting-up-2-factor-authentication-2fa)
10. [Troubleshooting & Frequently Asked Questions](#10-troubleshooting--frequently-asked-questions)

---

## 1. System Requirements

- **Operating System**: Windows 10/11, macOS 12+, or Linux (Ubuntu 22.04+ / Debian 12+)
- **Node.js**: `v22.0.0` or higher (`node -v` to verify)
- **Package Manager**: `npm` `v10.x` or higher
- **Database**:
  - MariaDB `10.4+` or MySQL `8.0+`
  - phpMyAdmin (optional, for web-based GUI management)
- **Network Ports**:
  - `3100` (Node application server, customizable)
  - `3306` (MySQL / MariaDB database server)
  - `80` / `443` (Apache / Nginx if using web GUI / reverse proxy)

---

## 2. Included Database Dumps

The repository includes two identical SQL files in the root folder:

- `forgefit.sql`: Complete MySQL/MariaDB database dump including `CREATE DATABASE IF NOT EXISTS forgefit`, table structures, foreign key constraints, default settings, and seeded studio data.
- `database.sql`: Exact mirror of `forgefit.sql` for automated import scripts and standard CI/CD pipelines.

Both files include:
- `users` (Admin and sample accounts)
- `trainers` (Faculty master coaches with synchronized portrait paths)
- `classes` (Discipline curriculum with assigned coaches and capacity limits)
- `plans` (Tiered membership packages)
- `memberships`, `bookings`, `messages`, `sessions`, `settings`, `audit_log`, `otps`, `backup_codes`

---

## 3. Windows Installation Guide (Using XAMPP)

XAMPP is the fastest and easiest way to run MySQL and phpMyAdmin on Windows.

### Step 3.1: Download & Install Prerequisites
1. Download **Node.js 22+ (LTS)** from [https://nodejs.org/](https://nodejs.org/) and run the installer.
2. Download **XAMPP for Windows** from [https://www.apachefriends.org/](https://www.apachefriends.org/) and install it (default path: `C:\xampp`).

### Step 3.2: Start Apache and MySQL in XAMPP
1. Launch **XAMPP Control Panel**.
2. Click **Start** next to **Apache** (Wait until PID and Port 80, 443 appear in green).
3. Click **Start** next to **MySQL** (Wait until PID and Port 3306 appear in green).

### Step 3.3: Clone the Repository
Open PowerShell or Command Prompt:

```powershell
cd C:\Users\YourUsername\Projects
git clone https://github.com/shubhXlab/forgefit-studio.git
cd forgefit-studio
```

### Step 3.4: Install Dependencies
```powershell
npm install
```

### Step 3.5: Import Database Dump
Choose either the Web UI or PowerShell CLI:

#### Option A: phpMyAdmin (Web UI)
1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click **Import** in the top navigation bar.
3. Click **Choose File** and navigate to your `forgefit-studio` folder, then select `forgefit.sql`.
4. Leave all settings at defaults (Character set: `utf-8`) and click the **Import** button at the bottom.
5. You will see a success message: *Import has been successfully finished, 50+ queries executed.*

#### Option B: PowerShell CLI
```powershell
# Using XAMPP's mysql client:
& "C:\xampp\mysql\bin\mysql.exe" -u root < forgefit.sql
```

### Step 3.6: Configure Environment
Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

The default values inside `.env` match standard XAMPP defaults (`host=localhost`, `user=root`, `password=` blank).

### Step 3.7: Launch the Application
You can run:
```powershell
npm start
```
Or simply double-click the included `start.bat` file in Windows Explorer!

Open your browser to:
`http://localhost:3100`

---

## 4. Windows Installation Guide (Standalone MySQL Community Server)

If you already have MySQL Community Server 8.x installed without XAMPP:

1. Open PowerShell as Administrator.
2. Log in to MySQL:
   ```powershell
   mysql -u root -p
   ```
3. Enter your MySQL root password.
4. Run:
   ```sql
   CREATE DATABASE IF NOT EXISTS forgefit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```
5. Import the dump:
   ```powershell
   mysql -u root -p forgefit < forgefit.sql
   ```
6. Open `.env` in `forgefit-studio` and update `MYSQL_PASSWORD` with your MySQL root password:
   ```ini
   MYSQL_PASSWORD=YourRootPasswordHere
   ```
7. Start the application:
   ```powershell
   npm start
   ```

---

## 5. Linux (Ubuntu / Debian VPS) Production Guide

### Step 5.1: Install Node.js 22, Git, and MariaDB Server
```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Git and build tools
sudo apt install -y git curl ufw build-essential

# Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install MariaDB Server
sudo apt install -y mariadb-server mariadb-client
sudo systemctl enable --now mariadb
```

### Step 5.2: Secure Database & Create ForgeFit User
```bash
sudo mysql_secure_installation

# Log into MySQL shell:
sudo mysql -u root

# Inside MariaDB console:
CREATE DATABASE forgefit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'forgefit_user'@'localhost' IDENTIFIED BY 'StrongDatabasePassword2026!';
GRANT ALL PRIVILEGES ON forgefit.* TO 'forgefit_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5.3: Clone Project & Import SQL
```bash
cd /var/www
sudo git clone https://github.com/shubhXlab/forgefit-studio.git forgefit
cd forgefit
sudo chown -R $USER:$USER /var/www/forgefit

# Install dependencies
npm install --omit=dev

# Import the database schema
mysql -u forgefit_user -p forgefit < forgefit.sql
```

### Step 5.4: Setup Production Environment
```bash
cp .env.example .env
nano .env
```

Update your `.env`:
```ini
PORT=3100
BASE_URL=https://yourdomain.com
NODE_ENV=production

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=forgefit_user
MYSQL_PASSWORD=StrongDatabasePassword2026!
MYSQL_DATABASE=forgefit

SESSION_SECRET=paste_a_random_64_character_string_here
SECURE_COOKIES=1
TRUST_PROXY=1
```

### Step 5.5: Run With PM2 Process Manager
```bash
sudo npm install -g pm2
pm2 start src/index.js --name "forgefit"
pm2 save
pm2 startup
```

### Step 5.6: Setup Nginx Reverse Proxy & Free SSL (Certbot)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

sudo nano /etc/nginx/sites-available/forgefit
```

Paste the following Nginx virtual host block:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and obtain SSL:
```bash
sudo ln -s /etc/nginx/sites-available/forgefit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue Let's Encrypt SSL:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 6. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3100` | Port on which the HTTP server listens |
| `BASE_URL` | `http://localhost:3100` | Fully-qualified public URL (used in email links) |
| `NODE_ENV` | `development` | Set to `production` in live deployments |
| `MYSQL_HOST` | `localhost` | MySQL / MariaDB server hostname or IP |
| `MYSQL_PORT` | `3306` | MySQL port (standard default: 3306) |
| `MYSQL_USER` | `root` | Database username |
| `MYSQL_PASSWORD` | *(blank)* | Database user password |
| `MYSQL_DATABASE` | `forgefit` | Target database name |
| `PHPMYADMIN_URL` | `http://localhost/phpmyadmin/...` | Direct link used by Admin Console navbar |
| `SESSION_SECRET` | *(auto-generated)* | 64+ char secret used to sign session cookies |
| `SECURE_COOKIES` | `0` | Set `1` only when serving through HTTPS |
| `TRUST_PROXY` | `0` | Set `1` behind Nginx, Cloudflare, or cPanel |
| `FORGEFIT_SMTP_HOST` | `smtp.gmail.com` | Outgoing SMTP mail server |
| `FORGEFIT_SMTP_PORT` | `465` | SMTP port (`465` for SSL, `587` for STARTTLS) |
| `FORGEFIT_SMTP_USER` | `your_email@gmail.com` | SMTP authentication username / email |
| `FORGEFIT_SMTP_PASS` | `""` | SMTP app-specific password |
| `FORGEFIT_SMTP_SECURE` | `1` | `1` for SSL, `0` for TLS |
| `FORGEFIT_SMTP_FROM` | `"ForgeFit Studio <...>`" | Sender header for system emails |

---

## 7. Default Access Credentials

### Administrator Account
- **Portal Link**: `http://localhost:3100/admin`
- **Email**: `admin@forgefit.com`
- **Password**: `Admin@ForgeFit2026!`

### Member Test Account
- **Portal Link**: `http://localhost:3100/login`
- **Email**: `member@forgefit.com`
- *(Or self-register with any valid email via `/register`)*

### Re-seeding Admin
If you ever need to create or reset the administrator password, run:
```bash
ADMIN_EMAIL=admin@yourgym.com ADMIN_PASSWORD='YourSecurePassword!' npm run seed:admin
```

---

## 8. Configuring Email (SMTP) & OTP Delivery

ForgeFit uses email OTP codes for:
- Member registration email validation.
- Password reset links and verification.
- Two-Factor Authentication fallback codes.

### Configuring Gmail SMTP:
1. Go to your **Google Account** &rarr; **Security**.
2. Ensure **2-Step Verification** is turned ON.
3. Under *2-Step Verification*, scroll down to **App passwords**.
4. Generate a new App Password named `ForgeFit`.
5. Google will provide a 16-character code (e.g. `abcd efgh ijkl mnop`).
6. Place this code in `.env`:
   ```ini
   FORGEFIT_SMTP_HOST=smtp.gmail.com
   FORGEFIT_SMTP_PORT=465
   FORGEFIT_SMTP_USER=your_email@gmail.com
   FORGEFIT_SMTP_PASS=abcdefghijklmnop
   FORGEFIT_SMTP_SECURE=1
   ```
7. Or configure it dynamically inside **Admin &rarr; Settings &rarr; Email (SMTP)**.

> **Local Development Fallback**:
> If SMTP is left unconfigured, OTP codes are logged directly to the server terminal and appended to `data/mail-dev.log` for offline testing.

---

## 9. Setting Up 2-Factor Authentication (2FA)

1. Log into your account (`/login`).
2. Navigate to **Account Settings &rarr; Security**.
3. Under **Two-Factor Authentication (2FA)**, click **Enable 2FA**.
4. Scan the rendered QR Code using **Google Authenticator**, **1Password**, or **Authy**.
5. Enter the 6-digit code displayed on your phone to confirm activation.
6. Save the **8 emergency backup recovery codes** displayed in a safe place.

---

## 10. Troubleshooting & Frequently Asked Questions

### Q1: `ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'`
- **Cause**: MySQL has a root password set, but `.env` has `MYSQL_PASSWORD=` empty.
- **Fix**: Open `.env` and set `MYSQL_PASSWORD=your_actual_password`.

### Q2: `ECONNREFUSED 127.0.0.1:3306`
- **Cause**: MySQL server is not running.
- **Fix**: Open XAMPP Control Panel and click **Start** next to MySQL. If using Linux, run `sudo systemctl start mariadb`.

### Q3: `Port 3100 is already in use`
- **Cause**: Another Node process is running on port 3100.
- **Fix**: In PowerShell run `Stop-Process -Name node -Force`, or change `PORT=3200` in `.env`.

### Q4: `ER_BAD_DB_ERROR: Unknown database 'forgefit'`
- **Cause**: The database hasn't been imported or created yet.
- **Fix**: Import `forgefit.sql` using phpMyAdmin or run:
  ```powershell
  & "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE forgefit;"
  & "C:\xampp\mysql\bin\mysql.exe" -u root forgefit < forgefit.sql
  ```

---

*Manual maintained by ForgeFit Studio Engineering & shubhXlab.*
