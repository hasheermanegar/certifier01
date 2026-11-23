const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_SUPPORT_EMAIL = "hasheermanegar@gmail.com";
const HERO_IMAGE_PATH = path.join(__dirname, "../email-assets/credential-hero.png");

const isConfigured = () =>
  Boolean(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.MAIL_FROM
  );

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
    { icon: "↓", text: "Download it in PDF format for printing" }
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
              <td align="center" bgcolor="#26744f" style="padding:0;background-color:#26744f;">
                <img src="cid:certificate-hero" width="620" alt="Certificate with an award seal" style="display:block;width:100%;max-width:620px;height:auto;border:0;">
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
                              <tr><td align="center" valign="middle" style="color:#1a4d2e;font-size:16px;line-height:46px;font-weight:700;">${action.icon}</td></tr>
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


function encodeMimeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value || ""), "utf8").toString("base64")}?=`;
}

function wrapBase64(value) {
  return String(value).match(/.{1,76}/g)?.join("\r\n") || "";
}

function safeHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

const sendCertificateEmail = async ({
  to,
  recipientName,
  certificateTitle,
  verificationUrl,
  certificateId,
  pdfBuffer
}) => {
  if (!isConfigured()) return { status: "not_configured" };

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });

  const tokenData = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok || !tokenData.access_token) {
    const reason = tokenData.error_description || tokenData.error || "OAuth token request failed";
    throw new Error(`Gmail OAuth authentication failed: ${safeHeader(reason)}`);
  }

  const email = buildCertificateEmail({ recipientName, verificationUrl });
  const from = safeHeader(process.env.MAIL_FROM);
  const recipient = safeHeader(to);

  if (!recipient || /[<>]/.test(recipient)) {
    throw new Error("Invalid certificate recipient email address.");
  }

  const mixedBoundary = `certifypro_mixed_${require("crypto").randomUUID()}`;
  const relatedBoundary = `certifypro_related_${require("crypto").randomUUID()}`;
  const alternativeBoundary = `certifypro_alt_${require("crypto").randomUUID()}`;

  const subject = encodeMimeHeader(`Your certificate: ${certificateTitle}`);
  const filename = `${String(certificateId || "certificate").replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
  const heroImage = fs.readFileSync(HERO_IMAGE_PATH);

  let mime = [
    `From: ${from}`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/related; boundary="${relatedBoundary}"; type="multipart/alternative"`,
    "",
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(email.text, "utf8").toString("base64")),
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(email.html, "utf8").toString("base64")),
    `--${alternativeBoundary}--`,
    `--${relatedBoundary}`,
    'Content-Type: image/png; name="credential-hero.png"',
    "Content-Transfer-Encoding: base64",
    "Content-ID: <certificate-hero>",
    'Content-Disposition: inline; filename="credential-hero.png"',
    "",
    wrapBase64(heroImage.toString("base64")),
    `--${relatedBoundary}--`
  ].join("\r\n");

  if (pdfBuffer) {
    const pdf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

    mime += [
      "",
      `--${mixedBoundary}`,
      "Content-Type: application/pdf",
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${filename}"`,
      "",
      wrapBase64(pdf.toString("base64"))
    ].join("\r\n");
  }

  mime += `\r\n--${mixedBoundary}--\r\n`;

  const gmailResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        raw: Buffer.from(mime, "utf8").toString("base64url")
      })
    }
  );

  const gmailData = await gmailResponse.json().catch(() => ({}));

  if (!gmailResponse.ok) {
    const reason = gmailData.error?.message || "Gmail API rejected the message";
    throw new Error(`Gmail API email delivery failed (${gmailResponse.status}): ${safeHeader(reason)}`);
  }

  return { status: "sent" };
};

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

module.exports = { buildCertificateEmail, sendCertificateEmail, isConfigured };
