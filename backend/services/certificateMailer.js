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
    { icon: "in", text: "Add it to your LinkedIn profile to get better job opportunities" },
    { icon: "↗", text: "Share it on social media to showcase your skills" },
    { icon: "↓", text: "Download the attached PDF for printing" }
  ];
  const deliveryNote = "A PDF copy of your certificate is attached to this email.";
  const footer = `Having trouble with your credential or want to unsubscribe from email list? Contact us at ${supportEmail}.`;

  const text = [
    `Congratulations! Here is your credential for ${name}.`,
    "",
    intro,
    "",
    ...actions.map(action => `- ${action.text}`),
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
  <body style="width:100%;margin:0;padding:0;background-color:#eaf4ed;font-family:Arial,Helvetica,sans-serif;color:#102216;-webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eaf4ed" style="width:100%;background-color:#eaf4ed;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:620px;background-color:#ffffff;border:1px solid #d6e8da;border-radius:18px;overflow:hidden;">
            <tr>
              <td align="center" bgcolor="#102216" style="padding:24px 18px;background-color:#102216;font-size:29px;line-height:1.2;font-weight:700;letter-spacing:-.8px;">
                <span style="color:#ffffff;">Certify</span><span style="color:#11d452;"> pro</span>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#26744f" style="padding:42px 18px;background-color:#26744f;">
                <table role="presentation" width="360" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:360px;">
                  <tr>
                    <td align="center" bgcolor="#f9fffb" style="padding:13px;background-color:#f9fffb;border:2px solid #d8efdf;border-radius:12px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px dashed #7cb28a;">
                        <tr>
                          <td align="center" style="padding:19px 16px 8px;">
                            <span style="display:inline-block;width:90px;height:9px;background-color:#1a4d2e;border-radius:8px;font-size:0;line-height:0;">&nbsp;</span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:0 16px 14px;">
                            <span style="display:inline-block;width:52px;height:5px;background-color:#4c9a66;border-radius:5px;font-size:0;line-height:0;">&nbsp;</span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:0 20px 10px;">
                            <span style="display:block;height:10px;background-color:#183d29;border-radius:8px;font-size:0;line-height:0;">&nbsp;</span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:0 30px 8px;">
                            <span style="display:block;height:5px;background-color:#d6eadb;border-radius:5px;font-size:0;line-height:0;">&nbsp;</span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:0 42px 18px;">
                            <span style="display:block;height:5px;background-color:#d6eadb;border-radius:5px;font-size:0;line-height:0;">&nbsp;</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:12px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" valign="middle" width="48" height="48" bgcolor="#11b85b" style="width:48px;height:48px;background-color:#11b85b;border:4px solid #d5f8e2;border-radius:50%;color:#ffffff;font-size:28px;line-height:48px;font-weight:700;">✓</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:38px 34px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
                  <tr>
                    <td valign="middle" width="36" style="width:36px;border-top:1px solid #4c9a66;font-size:0;line-height:0;">&nbsp;</td>
                    <td align="center" style="padding:0 12px;color:#1a4d2e;font-size:13px;line-height:1.3;font-weight:700;letter-spacing:2px;">CONGRATULATIONS</td>
                    <td valign="middle" width="36" style="width:36px;border-top:1px solid #4c9a66;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
                <h1 style="max-width:500px;margin:0 0 20px;color:#102216;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.2;font-weight:700;text-align:center;">Here is your credential for ${safeName}!</h1>
                <p style="max-width:500px;margin:0 auto 24px;color:#34443a;font-size:16px;line-height:1.7;text-align:center;">${intro}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:500px;">
                  ${actions.map(action => `<tr>
                    <td style="padding:0 0 10px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5faf6" style="width:100%;background-color:#f5faf6;border:1px solid #d6e8da;border-radius:10px;">
                        <tr>
                          <td valign="middle" width="68" style="width:68px;padding:12px 0 12px 14px;">
                            <table role="presentation" width="46" height="46" cellpadding="0" cellspacing="0" border="0" bgcolor="#e7f3eb" style="width:46px;height:46px;background-color:#e7f3eb;border-radius:50%;">
                              <tr><td align="center" valign="middle" style="color:#1a4d2e;font-size:23px;line-height:46px;font-weight:700;">${action.icon}</td></tr>
                            </table>
                          </td>
                          <td valign="middle" style="padding:12px 16px 12px 8px;color:#24372a;font-size:15px;line-height:1.5;font-weight:600;">${action.text}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>`).join("")}
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 12px;">
                  <tr>
                    <td align="center" bgcolor="#1a4d2e" style="background-color:#1a4d2e;border-radius:8px;">
                      <a href="${safeVerificationUrl}" style="display:inline-block;padding:17px 30px;color:#ffffff;font-size:14px;line-height:1;font-weight:700;letter-spacing:.8px;text-decoration:none;">VIEW CREDENTIAL&nbsp;&nbsp;↗</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#627368;font-size:12px;line-height:1.6;text-align:center;">${deliveryNote}</p>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#f5faf6" style="padding:24px 28px;background-color:#f5faf6;border-top:1px solid #d6e8da;color:#627368;font-size:14px;line-height:1.6;text-align:center;">
                Having trouble with your credential or want to unsubscribe from the email list? Contact us at<br>
                <a href="mailto:${safeSupportEmail}" style="color:#1a4d2e;font-weight:700;text-decoration:underline;">${safeSupportEmail}</a>
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
