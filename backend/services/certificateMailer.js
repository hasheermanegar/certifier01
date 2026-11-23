const nodemailer = require("nodemailer");
let transporter;

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER &&
    process.env.SMTP_PASS && process.env.MAIL_FROM);

const DEFAULT_SUPPORT_EMAIL = "hasheermanegar@gmail.com";

function buildCertificateEmail({ recipientName, verificationUrl }) {
  const name = recipientName || "you";
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
  const safeName = escapeHtml(name);
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const safeSupportEmail = escapeHtml(supportEmail);
  const intro = "Your achievement is available online so you can retrieve it anywhere, anytime, and use it in a variety of ways:";
  const actions = [
    "add it to your LinkedIn profile to get better job opportunities",
    "share it on social media to showcase your skills",
    "download the attached certificate PDF for printing"
  ];
  const deliveryNote = "The View Credential button opens the certificate verification page. A PDF copy of your certificate is attached to this email.";
  const footer = `Having trouble with your credential or want to unsubscribe from email list? Contact us at ${supportEmail}.`;

  const text = [
    `Congratulations, here is your certificate for ${name}!`,
    "",
    intro,
    "",
    ...actions.map(action => `- ${action}`),
    "",
    deliveryNote,
    "",
    `View Credential: ${verificationUrl}`,
    "",
    footer
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your credential is ready</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f1f1;font-family:Arial,Helvetica,sans-serif;color:#333333;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f1f1f1;">
      <tr>
        <td align="center" style="padding:40px 12px;">
          <table role="presentation" width="430" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:430px;background-color:#ffffff;border:1px solid #e4e4e4;">
            <tr>
              <td align="center" style="padding:30px 28px 18px;font-size:27px;line-height:1.2;font-weight:700;letter-spacing:-.7px;color:#1A4D2E;">
                Certify Pro
              </td>
            </tr>
            <tr>
              <td style="padding:0 38px 34px;">
                <h1 style="margin:0 0 16px;font-size:18px;line-height:1.45;font-weight:700;color:#333333;">Congratulations, here is your certificate for ${safeName}!</h1>
                <p style="margin:0 0 16px;font-size:13px;line-height:1.55;color:#555555;">${intro}</p>
                <ul style="margin:0 0 18px;padding-left:18px;font-size:13px;line-height:1.55;color:#555555;">
                  ${actions.map(action => `<li style="padding:1px 0;">${action}</li>`).join("")}
                </ul>
                <p style="margin:0 0 18px;font-size:12px;line-height:1.55;color:#555555;">${deliveryNote}</p>
                <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 15px;">
                  <tr>
                    <td align="center" bgcolor="#2f63d8" style="background-color:#2f63d8;border-radius:28px;">
                      <a href="${safeVerificationUrl}" style="display:inline-block;padding:15px 26px;color:#ffffff;font-size:14px;line-height:1;font-weight:700;text-decoration:none;">View Credential</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:11px;line-height:1.55;color:#777777;">Having trouble with your credential or want to unsubscribe from email list? Contact us at <a href="mailto:${safeSupportEmail}" style="color:#1688d4;text-decoration:none;">${safeSupportEmail}</a>.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

const sendCertificateEmail = async ({ to, recipientName, certificateTitle, verificationUrl, certificateId, pdfBuffer }) => {
  if (!isConfigured()) return { status: "not_configured" };

  if (!transporter) {
    transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 2,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 60000,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  const email = buildCertificateEmail({ recipientName, verificationUrl });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Your certificate: ${certificateTitle}`,
    text: email.text,
    html: email.html,
    attachments: pdfBuffer ? [{
      filename: (certificateId || "certificate") + ".pdf",
      content: pdfBuffer,
      contentType: "application/pdf"
    }] : []
  });
  return { status: "sent" };
};

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

module.exports = { buildCertificateEmail, sendCertificateEmail, isConfigured };
