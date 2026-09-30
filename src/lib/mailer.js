'use strict';
/**
 * Outgoing mail service.
 * SMTP configured via Admin → Settings (DB) or FORGEFIT_SMTP_* env vars.
 * All email templates feature:
 * - Brand header bar with in-email embedded logo (cid) and status badge
 * - Zero dead space at top
 * - Auto-capitalized member names
 * - Specific booked session date, time, duration, coach name, and booking reference
 * - Action CTAs: View Booking, Add to Google Calendar, Manage/Cancel
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config');
const { getSetting } = require('../db');

function formatName(name) {
  if (!name) return 'Athlete';
  return String(name)
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function calculateNextSessionDate(scheduleStr, baseDate = new Date()) {
  const dayMap = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
  };

  const scheduleParts = String(scheduleStr || '').split('·');
  const daysPart = scheduleParts[0] || '';
  const timePart = scheduleParts[1] || '';

  const targetDays = [];
  const tokens = daysPart.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/);
  for (const token of tokens) {
    if (dayMap[token] !== undefined && !targetDays.includes(dayMap[token])) {
      targetDays.push(dayMap[token]);
    }
  }

  const timeMatch = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hour = 8;
  let min = 30;
  let timeDisplay = '08:30 AM';
  if (timeMatch) {
    timeDisplay = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]} ${timeMatch[3].toUpperCase()}`;
    hour = parseInt(timeMatch[1], 10);
    if (timeMatch[3].toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (timeMatch[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
    min = parseInt(timeMatch[2], 10);
  }

  const now = new Date(baseDate);
  let candidate = new Date(now);
  candidate.setHours(hour, min, 0, 0);

  if (targetDays.length === 0) {
    candidate.setDate(candidate.getDate() + 1);
  } else {
    for (let i = 0; i < 7; i++) {
      if (targetDays.includes(candidate.getDay()) && candidate > now) {
        break;
      }
      candidate.setDate(candidate.getDate() + 1);
    }
  }

  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const formattedDate = candidate.toLocaleDateString('en-US', options);

  const endTime = new Date(candidate.getTime() + 60 * 60 * 1000);
  const formatUtcIso = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  return {
    dateDisplay: formattedDate,
    timeDisplay: timeDisplay,
    fullDisplay: `${formattedDate} @ ${timeDisplay}`,
    startIso: formatUtcIso(candidate),
    endIso: formatUtcIso(endTime),
  };
}

function smtpConfig() {
  const env = config.smtpEnv;
  if (env.host && env.user) {
    return { host: env.host, port: env.port || 587, user: env.user, pass: env.pass, secure: env.secure, from: env.from || env.user };
  }
  const host = getSetting('smtp_host');
  if (!host) return null;
  return {
    host,
    port: parseInt(getSetting('smtp_port') || '587', 10),
    user: getSetting('smtp_user'),
    pass: getSetting('smtp_pass'),
    secure: getSetting('smtp_secure') === '1',
    from: getSetting('smtp_from') || getSetting('smtp_user'),
  };
}

function brand(inner, preheader, { badge = 'CONFIRMED' } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background-color:#0c0f12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || ''}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c0f12;padding:6px 8px 30px;margin:0;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width:580px;background-color:#141920;border:1px solid #232b35;border-top:4px solid #c8f542;border-radius:14px;overflow:hidden;margin:0 auto;box-shadow:0 12px 30px rgba(0,0,0,0.5);" cellpadding="0" cellspacing="0">
          <!-- Header Bar with In-Email Brand Logo -->
          <tr>
            <td style="padding:18px 24px 16px;background:linear-gradient(180deg,#192028 0%,#141920 100%);border-bottom:1px solid #232a33;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="42" style="vertical-align:middle;">
                    <img src="cid:forgefit-logo" alt="ForgeFit" width="38" height="38" style="display:block;border-radius:9px;border:1px solid #2d3642;" />
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font-size:19px;font-weight:900;color:#f2f5f7;letter-spacing:1.5px;line-height:1.1;">FORGE<span style="color:#c8f542;">FIT</span></div>
                    <div style="color:#8a99a8;font-size:11px;font-weight:700;letter-spacing:2px;margin-top:2px;">STUDIO</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;padding:4px 10px;background:#1e2630;border:1px solid #2c3846;color:#c8f542;font-size:11px;font-weight:700;letter-spacing:0.8px;border-radius:20px;text-transform:uppercase;">${badge}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:26px 24px 22px;color:#dbe2e9;font-size:15px;line-height:1.6;">
              ${inner}
            </td>
          </tr>
          <!-- Polished Footer -->
          <tr>
            <td style="padding:20px 24px 22px;background:#10141a;border-top:1px solid #1f262f;color:#6b7683;font-size:12px;line-height:1.6;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-weight:600;color:#8a99a8;margin-bottom:4px;">ForgeFit Studio · Train hard. Recover harder.</div>
                    <div>Questions? Reach our team at <a href="mailto:concierge@forgefit.com" style="color:#c8f542;text-decoration:none;">concierge@forgefit.com</a></div>
                    <div style="margin-top:8px;font-size:11px;color:#55606d;">If you did not make this request, you can safely ignore this email or review your account security.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function bookingMail({ name, classTitle, schedule, trainerName, durationMin, bookingId, baseUrl }) {
  const capName = formatName(name);
  const session = calculateNextSessionDate(schedule);
  const ref = bookingId ? `FFB-${String(bookingId).padStart(5, '0')}` : `FFB-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const siteUrl = baseUrl || config.baseUrl;
  const trainer = trainerName || 'ForgeFit Certified Coach';
  const duration = durationMin || 60;

  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(classTitle + ' - ForgeFit Studio')}&dates=${session.startIso}/${session.endIso}&details=${encodeURIComponent('Class: ' + classTitle + '\nCoach: ' + trainer + '\nBooking Ref: ' + ref + '\nStudio: ForgeFit Studio\nAddress: Main Arena, ForgeFit')}&location=${encodeURIComponent('ForgeFit Studio')}`;

  const subject = `Booking Confirmed: ${classTitle} (#${ref})`;

  const inner = `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:22px;color:#f2f5f7;margin:0 0 6px 0;font-weight:800;">Your spot is confirmed!</h2>
      <p style="margin:0;color:#9aa6b2;font-size:15px;">Hi <strong style="color:#f2f5f7;">${capName}</strong>, we have reserved your place on the floor.</p>
    </div>

    <!-- Booking Summary Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a2029;border:1px solid #283340;border-radius:12px;overflow:hidden;margin:20px 0 24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #26313e;background:#1e2632;">
          <div style="color:#8a99a8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Class Details</div>
          <div style="font-size:18px;font-weight:800;color:#c8f542;margin-top:2px;">${classTitle}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#8a99a8;font-size:13px;width:120px;">🗓️ Session Date:</td>
              <td style="padding:6px 0;color:#f2f5f7;font-weight:700;font-size:14px;">${session.dateDisplay}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#8a99a8;font-size:13px;">⏰ Time & Duration:</td>
              <td style="padding:6px 0;color:#f2f5f7;font-weight:700;font-size:14px;">${session.timeDisplay} (${duration} mins)</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#8a99a8;font-size:13px;">💪 Coach:</td>
              <td style="padding:6px 0;color:#f2f5f7;font-weight:700;font-size:14px;">${trainer}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#8a99a8;font-size:13px;">📍 Venue:</td>
              <td style="padding:6px 0;color:#f2f5f7;font-size:14px;">ForgeFit Studio · Main Floor</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#8a99a8;font-size:13px;">🔖 Booking Ref:</td>
              <td style="padding:6px 0;color:#c8f542;font-family:monospace;font-weight:700;font-size:14px;">#${ref}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#8a99a8;font-size:13px;">🔄 Timetable:</td>
              <td style="padding:6px 0;color:#9aa6b2;font-size:13px;">${schedule || 'Studio Timetable'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Call to Action Buttons -->
    <div style="margin:24px 0 16px;text-align:center;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${siteUrl}/bookings" style="display:inline-block;background-color:#c8f542;color:#0c0f12;font-weight:800;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none;box-shadow:0 4px 14px rgba(200,245,66,0.3);margin:4px 6px;">
              View My Bookings
            </a>
            <a href="${calUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#232c38;color:#f2f5f7;border:1px solid #364455;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;margin:4px 6px;">
              📅 Add to Google Calendar
            </a>
          </td>
        </tr>
      </table>
    </div>

    <p style="text-align:center;font-size:13px;color:#8a99a8;margin-top:16px;">
      Need to reschedule or cancel? <a href="${siteUrl}/bookings" style="color:#c8f542;text-decoration:none;font-weight:600;">Manage your booking here →</a>
    </p>
  `;

  const text = `Hi ${capName},\n\nYour spot is confirmed for ${classTitle}!\n\nBooking Ref: #${ref}\nSession Date: ${session.dateDisplay}\nTime: ${session.timeDisplay} (${duration} mins)\nCoach: ${trainer}\nVenue: ForgeFit Studio · Main Floor\nRegular Timetable: ${schedule || ''}\n\nView booking or cancel: ${siteUrl}/bookings\nAdd to calendar: ${calUrl}\n\nSee you on the floor!`;

  return { subject, html: brand(inner, subject, { badge: 'CONFIRMED' }), text };
}

function otpMail({ name, code, purposeLabel, ttlMin, baseUrl }) {
  const capName = formatName(name);
  const siteUrl = baseUrl || config.baseUrl;
  const subject = `Your ForgeFit verification code: ${code}`;
  const ttl = ttlMin || 10;

  const inner = `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:22px;color:#f2f5f7;margin:0 0 6px 0;font-weight:800;">One-Time Security Code</h2>
      <p style="margin:0;color:#9aa6b2;font-size:15px;">Hi <strong style="color:#f2f5f7;">${capName}</strong>, use the verification code below to ${purposeLabel || 'complete verification'}.</p>
    </div>

    <!-- OTP Code Box -->
    <div style="background:#1b222c;border:1px dashed #c8f542;border-radius:12px;padding:22px 16px;text-align:center;margin:24px 0;">
      <div style="font-size:38px;font-weight:900;letter-spacing:12px;color:#c8f542;font-family:monospace;margin-left:12px;">${code}</div>
      <div style="color:#8a99a8;font-size:12px;margin-top:8px;">Expires in <strong>${ttl} minutes</strong> · Single use only</div>
    </div>

    <div style="background:#171d24;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:20px 0;font-size:13px;color:#9aa6b2;">
      🔒 <strong>Security Notice:</strong> Never share this code with anyone. ForgeFit staff will never ask for your verification code.
    </div>

    <div style="text-align:center;margin-top:24px;">
      <a href="${siteUrl}/login" style="display:inline-block;background-color:#c8f542;color:#0c0f12;font-weight:800;font-size:14px;padding:11px 24px;border-radius:9px;text-decoration:none;">
        Open ForgeFit Studio
      </a>
    </div>
  `;

  const text = `Hi ${capName},\n\nYour ForgeFit verification code is: ${code}\n\nIt expires in ${ttl} minutes.\nNever share this code with anyone.`;
  return { subject, html: brand(inner, subject, { badge: 'SECURITY OTP' }), text };
}

function welcomeMail({ name, baseUrl }) {
  const capName = formatName(name);
  const siteUrl = baseUrl || config.baseUrl;
  const subject = `Welcome to ForgeFit Studio, ${capName}!`;

  const inner = `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:22px;color:#f2f5f7;margin:0 0 6px 0;font-weight:800;">Welcome to the Clan! 🚀</h2>
      <p style="margin:0;color:#9aa6b2;font-size:15px;">Hi <strong style="color:#f2f5f7;">${capName}</strong>, your email is verified and your ForgeFit account is active.</p>
    </div>

    <div style="background:#1a2029;border:1px solid #283340;border-radius:12px;padding:18px 20px;margin:20px 0;">
      <div style="font-size:14px;font-weight:700;color:#c8f542;margin-bottom:10px;">What's next for you:</div>
      <div style="padding:5px 0;color:#dbe2e9;font-size:14px;">✓ Explore small-group strength, conditioning and mobility classes</div>
      <div style="padding:5px 0;color:#dbe2e9;font-size:14px;">✓ Book your spot in seconds directly from the member portal</div>
      <div style="padding:5px 0;color:#dbe2e9;font-size:14px;">✓ Access certified coach support and personal progress tracking</div>
    </div>

    <div style="margin:26px 0 16px;text-align:center;">
      <a href="${siteUrl}/dashboard" style="display:inline-block;background-color:#c8f542;color:#0c0f12;font-weight:800;font-size:15px;padding:13px 28px;border-radius:10px;text-decoration:none;box-shadow:0 4px 14px rgba(200,245,66,0.3);margin:4px 6px;">
        Open My Dashboard
      </a>
      <a href="${siteUrl}/classes" style="display:inline-block;background-color:#232c38;color:#f2f5f7;border:1px solid #364455;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;text-decoration:none;margin:4px 6px;">
        Explore Classes
      </a>
    </div>
  `;

  const text = `Hi ${capName},\n\nYour ForgeFit account is ready!\n\nOpen your dashboard to book your first class: ${siteUrl}/dashboard\n\nTrain hard. Recover harder.\nForgeFit Studio`;
  return { subject, html: brand(inner, subject, { badge: 'ACCOUNT READY' }), text };
}

function passwordChangedMail({ name, baseUrl }) {
  const capName = formatName(name);
  const siteUrl = baseUrl || config.baseUrl;
  const timeStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const subject = 'Security Alert: Your ForgeFit password was changed';

  const inner = `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:22px;color:#f2f5f7;margin:0 0 6px 0;font-weight:800;">Password Updated</h2>
      <p style="margin:0;color:#9aa6b2;font-size:15px;">Hi <strong style="color:#f2f5f7;">${capName}</strong>, this is confirmation that your ForgeFit account password was changed.</p>
    </div>

    <div style="background:#1b2129;border:1px solid #2d3846;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <div style="color:#8a99a8;font-size:13px;">Timestamp: <strong style="color:#f2f5f7;">${timeStr}</strong></div>
      <div style="color:#8a99a8;font-size:13px;margin-top:6px;">Status: <span style="color:#c8f542;font-weight:700;">All other active sessions have been revoked</span></div>
    </div>

    <div style="background:#261819;border-left:3px solid #ef4444;padding:14px 16px;border-radius:6px;margin:20px 0;font-size:13.5px;color:#fca5a5;">
      ⚠️ <strong>Didn't make this change?</strong> Your account may be compromised. Reset your password immediately:
    </div>

    <div style="text-align:center;margin:24px 0 16px;">
      <a href="${siteUrl}/forgot" style="display:inline-block;background-color:#ef4444;color:#ffffff;font-weight:800;font-size:14px;padding:12px 24px;border-radius:9px;text-decoration:none;margin:4px 6px;">
        Reset Password Immediately
      </a>
      <a href="${siteUrl}/security" style="display:inline-block;background-color:#232c38;color:#f2f5f7;border:1px solid #364455;font-weight:700;font-size:14px;padding:11px 20px;border-radius:9px;text-decoration:none;margin:4px 6px;">
        Review Security Settings
      </a>
    </div>
  `;

  const text = `Hi ${capName},\n\nYour ForgeFit account password was changed on ${timeStr}.\n\nIf you did not make this change, please reset your password immediately at: ${siteUrl}/forgot`;
  return { subject, html: brand(inner, subject, { badge: 'SECURITY ALERT' }), text };
}

async function sendMail({ to, subject, html, text, attachments = [] }) {
  const cfg = smtpConfig();
  if (!cfg) {
    const logPath = path.join(config.root, 'data', 'mail-dev.log');
    fs.appendFileSync(logPath,
      `\n[${new Date().toISOString()}] NO-SMTP-CONFIGURED — email NOT sent\nTo: ${to}\nSubject: ${subject}\n${text || ''}\n---\n`);
    return { ok: true, dev: true };
  }

  // Ensure brand logo is attached inline for CID rendering
  const mailAttachments = [...attachments];
  const logoPath = path.join(config.root, 'src', 'public', 'img', 'logo.png');
  if (fs.existsSync(logoPath) && !mailAttachments.some(a => a.cid === 'forgefit-logo')) {
    mailAttachments.push({
      filename: 'logo.png',
      path: logoPath,
      cid: 'forgefit-logo',
    });
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    tls: { minVersion: 'TLSv1.2' },
  });

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject,
    html,
    text: text || undefined,
    attachments: mailAttachments,
  });
  return { ok: true };
}

module.exports = {
  sendMail,
  otpMail,
  welcomeMail,
  bookingMail,
  passwordChangedMail,
  smtpConfig,
  formatName,
  calculateNextSessionDate,
};
