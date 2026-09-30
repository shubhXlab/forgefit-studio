# ForgeFit Studio — Deployment Guide (cPanel)

ForgeFit is a Node.js + Express + SQLite app. It runs on any cPanel host with
**Setup Node.js App** (CloudLinux / cPanel 90+), or any VPS with Node 22+.

## What you get

- Public site: home, classes, trainers, plans, about, contact
- Auth: register with **email OTP verification**, login, **forgot password via OTP**,
  **2FA** (authenticator app with QR + backup codes, or email-code 2FA)
- Member area: dashboard, class bookings, profile, password, security settings
- Admin: stats dashboard, members, classes, trainers, plans, memberships,
  bookings, contact messages, site + SMTP settings, audit log
- All data lives in SQLite — no MySQL needed, no fake/seeded content

## Option A — cPanel "Setup Node.js App" (recommended)

1. In cPanel open **Setup Node.js App → Create Application**
   - Node.js version: 22 or higher
   - Application mode: production
   - Application root: e.g. `forgefit`
   - Application URL: your domain (or a subdirectory — the app serves from `/`)
   - Application startup file: `src/index.js`
2. Upload the zip contents into the application root and click **NPM Install**
   (or run `npm install --omit=dev` via the app's terminal).
3. Set environment variables in the Node.js app panel:
   - `SESSION_SECRET` — long random string (required in production)
   - `SECURE_COOKIES=1` (only if the site is served over HTTPS — it should be)
   - `TRUST_PROXY=1` (cPanel Passenger runs behind a proxy)
   - `BASE_URL=https://your-domain.com` (used in email links)
   - `PORT` is injected by Passenger — leave it alone
4. **Create the admin account** — open the app terminal and run:
   `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='choose-a-strong-password' npm run seed:admin`
5. Start the app. Open the site, log in as admin, go to **Admin → Settings**
   and fill in your SMTP details so OTP emails can be sent.

## Option B — any VPS / local machine

```bash
unzip forgefit-studio.zip && cd forgefit
npm install --omit=dev
SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" \
BASE_URL=https://your-domain.com \
node src/index.js
```

## Email (OTP) setup

OTP codes are emailed for: registration verification, email-code 2FA logins,
and password resets. Configure any SMTP server under **Admin → Settings → Email (SMTP)**:
host, port, username, password, from-address, STARTTLS (587) or SSL (465).

If SMTP is not configured, codes are appended to `data/mail-dev.log` instead —
handy for local development, never for production.

## Data & backups

- The database is `data/forgefit.sqlite` (WAL mode). Back up this file regularly.
- Uploaded class/trainer images live in `src/public/uploads/`.
- The AI-generated gallery images in `src/public/img/` are picked as defaults
  when creating classes/trainers from the admin panel.

## Security notes

- Passwords: scrypt hashing. OTPs: 6-digit, SHA-256 hashed at rest, 10-min expiry,
  8-attempt lockout. TOTP 2FA per RFC 6238 with ±1 step window.
- CSRF tokens on all state-changing forms, rate limits on login/OTP/register,
  sessions in SQLite (survive restarts), secure/httpOnly cookies in production.
- Admin actions and auth events are written to the audit log (Admin → Overview).
