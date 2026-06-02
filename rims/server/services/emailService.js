const nodemailer = require('nodemailer');

function getTransporter() {
  // If SMTP credentials are not configured, use Nodemailer's built-in
  // Ethereal test account generator so the server still boots cleanly.
  // In this mode we skip sending and just print the link to the console.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port:   Number(process.env.SMTP_PORT) || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordReset(to, resetUrl, firstName) {
  const transporter = getTransporter();

  if (!transporter) {
    // Dev-mode: no SMTP configured — print link to console so you can test the flow
    console.log('\n\x1b[33m[DEV] Password reset link (no SMTP configured):\x1b[0m');
    console.log(`\x1b[36m  ${resetUrl}\x1b[0m\n`);
    return; // treat as success
  }

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || '"LedgerLink" <noreply@ledgerlink.app>',
    to,
    subject: 'Reset your RIMS password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f7f9f4;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:36px;">💰</div>
          <h1 style="color:#1a2e1a;margin:8px 0 4px;font-size:22px;font-weight:800;">LedgerLink</h1>
          <p style="color:#7a9b72;font-size:11px;margin:0;letter-spacing:1px;text-transform:uppercase;">Smart Finance Platform</p>
        </div>
        <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #d6e8d0;">
          <h2 style="color:#1a2e1a;margin:0 0 12px;font-size:18px;">Password Reset Request</h2>
          <p style="color:#4a6741;font-size:14px;line-height:1.7;margin:0 0 20px;">
            Hi ${firstName || 'there'},<br>
            We received a request to reset the password for your RIMS account.
            Click the button below to choose a new password.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}"
              style="display:inline-block;background:#2d7a3a;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Reset Password
            </a>
          </div>
          <p style="color:#7a9b72;font-size:12px;line-height:1.6;margin:20px 0 0;text-align:center;">
            This link expires in <strong>1 hour</strong>.<br>
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
        <p style="color:#7a9b72;font-size:11px;text-align:center;margin:16px 0 0;">
          © ${new Date().getFullYear()} LedgerLink · Secure Financial Management
        </p>
      </div>
    `,
  });
}

module.exports = { sendPasswordReset };
