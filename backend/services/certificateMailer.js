const DEFAULT_SUPPORT_EMAIL = "hasheermanegar@gmail.com";

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
  const intro = "Your achievement is available in an online format so that you can retrieve it anywhere, anytime, and use it in a variety of ways:";
  const actions = [
    "add it to your LinkedIn profile to get better job opportunities",
    "share it on social media to showcase your skills",
    "download it in PDF format for printing"
  ];
  const footer = `Having trouble with your credential or want to unsubscribe from email list? Contact us at ${supportEmail}.`;

  const text = [
    `Congratulations, here is your credential for ${name}!`,
    "",
    intro,
    "",
    ...actions.map(action => `- ${action}`),
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
              <td align="center" style="padding:30px 28px 18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="middle" style="padding-right:10px;">
                      <table role="presentation" width="32" cellpadding="0" cellspacing="0" border="0" style="width:32px;">
                        <tr><td height="16" style="height:16px;border:4px solid #111111;border-bottom:0;border-radius:18px 18px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
                        <tr><td height="4" style="height:4px;background-color:#111111;font-size:0;line-height:0;">&nbsp;</td></tr>
                        <tr><td height="4" style="height:4px;background-color:#111111;font-size:0;line-height:0;">&nbsp;</td></tr>
                      </table>
                    </td>
                    <td valign="middle" style="font-size:32px;line-height:1;font-weight:700;letter-spacing:-1.5px;color:#050505;">Certifier</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 38px 34px;">
                <h1 style="margin:0 0 16px;font-size:18px;line-height:1.45;font-weight:700;color:#333333;">Congratulations, here is your credential for ${safeName}!</h1>
                <p style="margin:0 0 16px;font-size:13px;line-height:1.55;color:#555555;">${intro}</p>
                <ul style="margin:0 0 18px;padding-left:18px;font-size:13px;line-height:1.55;color:#555555;">
                  ${actions.map(action => `<li style="padding:1px 0;">${action}</li>`).join("")}
                </ul>
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
  const alternativeBoundary = `certifypro_alt_${require("crypto").randomUUID()}`;

  const subject = encodeMimeHeader(`Your certificate: ${certificateTitle}`);
  const filename = `${String(certificateId || "certificate").replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;

  let mime = [
    `From: ${from}`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
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
    `--${alternativeBoundary}--`
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
