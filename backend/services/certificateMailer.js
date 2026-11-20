const nodemailer = require("nodemailer");

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER &&
    process.env.SMTP_PASS && process.env.MAIL_FROM);

const sendCertificateEmail = async ({ to, recipientName, certificateTitle, verificationUrl, certificateId, pdfBuffer }) => {
  if (!isConfigured()) return { status: "not_configured" };

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Your certificate: ${certificateTitle}`,
    text: `Hello ${recipientName},\n\nYour certificate "${certificateTitle}" has been issued.\n\nVerify your certificate here: ${verificationUrl}\n`,
    html: `<p>Hello ${escapeHtml(recipientName)},</p><p>Your certificate <strong>${escapeHtml(certificateTitle)}</strong> has been issued.</p><p>Your certificate PDF is attached to this email.</p><p><a href="${escapeHtml(verificationUrl)}">View and verify your certificate</a></p>`,
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

module.exports = { sendCertificateEmail, isConfigured };
