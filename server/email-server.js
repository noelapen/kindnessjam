import 'dotenv/config'
import express from 'express'
import nodemailer from 'nodemailer'
import QRCode from 'qrcode'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// ── SMTP configuration from environment variables ──────────────────────────
const {
  SMTP_HOST = 'smtp.gmail.com',
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  EMAIL_SERVER_PORT = '3001',
} = process.env

if (!SMTP_USER || !SMTP_PASS) {
  console.error('⛔  SMTP_USER and SMTP_PASS environment variables are required.')
  process.exit(1)
}

const fromAddress = SMTP_FROM || `"Kindness Jam" <${SMTP_USER}>`

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
})

// ── Generate a QR ticket PNG ────────────────────────────────────────────────
// Uses the exact same token that the attendance scanner verifies.
// Participant name and reg number are displayed in the email HTML body
// alongside the embedded QR image for maximum compatibility (no native deps).
async function generateQrPng(token) {
  return QRCode.toBuffer(token, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
    color: { dark: '#2E1065', light: '#FFFFFF' },
  })
}

// ── Build the HTML email body ───────────────────────────────────────────────
function buildEmailHtml(name, regNo) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5edff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5edff;padding:24px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(62,25,111,0.12);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#32116f,#5421a4,#7b2db8);padding:32px 36px;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.7);text-transform:uppercase;">Your Registration is Confirmed</p>
    <h1 style="margin:10px 0 0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">Kindness Jam 🎶</h1>
    <p style="margin:8px 0 0;font-size:12px;font-weight:600;letter-spacing:0.15em;color:rgba(255,255,255,0.8);text-transform:uppercase;">Music · Movement · Community</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 36px;">
    <p style="margin:0;font-size:16px;color:#2E1065;">Hey <strong>${name}</strong>! 👋</p>
    <p style="margin:14px 0 0;font-size:15px;color:#3d2060;line-height:1.6;">
      Woohoo! You're officially registered for <strong>Kindness Jam</strong> 🎉💚<br>
      We're so excited to have you join the celebration of music, movement, and community!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f8f0ff;border-radius:14px;border:1px solid #e8dcf4;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#6a2da2;text-transform:uppercase;">Your Registration Number</p>
        <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#2E1065;font-family:monospace;letter-spacing:0.08em;">${regNo}</p>
      </td></tr>
    </table>

    <h2 style="margin:28px 0 14px;font-size:18px;font-weight:700;color:#2E1065;">📋 Event Details</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0ff;border-radius:14px;border:1px solid #e8dcf4;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 10px;font-size:14px;color:#3d2060;">📅 <strong>Saturday, 28 November 2026, at 3:30 PM</strong></p>
        <p style="margin:0 0 10px;font-size:14px;color:#3d2060;">📍 <strong>D.P.R.C (D'Monte Park Recreation Center)</strong><br>
          &nbsp;&nbsp;&nbsp;&nbsp;St Andrews Rd, Bandra West, Mumbai</p>
        <p style="margin:0;font-size:14px;color:#3d2060;">🗺️ <a href="https://maps.app.goo.gl/LQjSThtRdpREZHReA" style="color:#6425B8;font-weight:600;">Get Directions on Google Maps →</a></p>
      </td></tr>
    </table>

    <h2 style="margin:28px 0 14px;font-size:18px;font-weight:700;color:#2E1065;">🎒 What to Carry</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0ff;border-radius:14px;border:1px solid #e8dcf4;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 8px;font-size:14px;color:#3d2060;">🧢 Hat or cap (it's outdoors!)</p>
        <p style="margin:0 0 8px;font-size:14px;color:#3d2060;">💧 Water bottle</p>
        <p style="margin:0;font-size:14px;color:#3d2060;">🧺 Towel, picnic mat, or newspaper</p>
      </td></tr>
    </table>

    <!-- QR Ticket Section -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border-radius:14px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#5823a5,#7b2db8);padding:20px 24px;text-align:center;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;color:rgba(255,255,255,0.7);text-transform:uppercase;">Your QR Ticket — ${regNo}</p>
        <p style="margin:6px 0 0;font-size:13px;font-weight:700;color:#ffffff;">${name}</p>
      </td></tr>
      <tr><td style="background:#fbf8ff;padding:24px;text-align:center;">
        <img src="cid:ticket-qr" alt="Your unique QR ticket" width="280" style="border:2px solid #e6d5f8;border-radius:14px;" />
        <p style="margin:14px 0 0;font-size:14px;font-weight:800;color:#45206c;">Your all-access kindness pass 🎫</p>
        <p style="margin:6px 0 0;font-size:12px;color:#786b86;">Show this QR at the entrance</p>
      </td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:14px;color:#3d2060;line-height:1.6;">
      Can't wait to see you there! 🌟<br>
      Spread the kindness — bring a friend along! 💛
    </p>
    <p style="margin:20px 0 0;font-size:14px;color:#3d2060;">
      With love,<br>
      <strong>Team Kindness Unlimited</strong> 💚
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 36px;background:#f8f0ff;border-top:1px solid #e8dcf4;text-align:center;">
    <p style="margin:0;font-size:12px;color:#786b86;">Made with kindness by <strong>Kindness Unlimited</strong></p>
    <p style="margin:6px 0 0;font-size:11px;color:#a898b8;">This is an automated confirmation. Please don't reply to this email.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ── POST /api/send-confirmation-email ───────────────────────────────────────
app.post('/api/send-confirmation-email', async (req, res) => {
  const { email, name, regNo, token } = req.body || {}

  // Validate required fields
  if (!email || !name || !regNo || !token) {
    return res.status(400).json({ ok: false, error: 'Missing required fields: email, name, regNo, token.' })
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address.' })
  }

  try {
    // Generate the QR PNG (uses the exact same token as the scanner)
    const qrPng = await generateQrPng(token)

    // Send the email with inline QR and attachment
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "🎉 You're Registered for Kindness Jam! Your Ticket Inside 💚",
      html: buildEmailHtml(name, regNo),
      attachments: [
        {
          filename: `KindnessJam-Ticket-${regNo}.png`,
          content: qrPng,
          contentType: 'image/png',
          cid: 'ticket-qr',
        },
      ],
    })

    console.log(`✅ Confirmation email sent → ${email} (${regNo})`)
    return res.json({ ok: true, emailStatus: 'sent' })
  } catch (err) {
    console.error(`❌ Email failed for ${email} (${regNo}):`, err.message)
    return res.json({ ok: false, error: 'Email could not be sent. Registration is safe — try resending later.', emailStatus: 'failed' })
  }
})

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'kindness-jam-email' })
})

// ── Start server ────────────────────────────────────────────────────────────
const port = Number(EMAIL_SERVER_PORT)
app.listen(port, () => {
  console.log(`📧 Kindness Jam email server running on http://localhost:${port}`)
  console.log(`   SMTP: ${SMTP_HOST}:${SMTP_PORT} as ${SMTP_USER}`)
})
