const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { buildCertificateEmail, sendCertificateEmail } = require("../services/certificateMailer");

test("builds the branded certificate email with dynamic content", () => {
  const { html, text } = buildCertificateEmail({
    recipientName: "Avery",
    verificationUrl: "https://example.com/verify/CERT-123"
  });

  assert.match(html, /VistaraCertifications/);
  assert.doesNotMatch(html, /CertifyPro|vistara-logo|cid:vistara-logo/);
  assert.match(html, /src="cid:certificate-hero"/);
  assert.match(html, /Here is your credential Avery!/);
  assert.match(html, /href="https:\/\/example\.com\/verify\/CERT-123"/);
  assert.match(html, /Add it to your LinkedIn profile/);
  assert.match(html, /Share it on social media/);
  assert.match(html, /Download it in PDF format/);
  assert.match(html, /src="cid:linkedin-badge"/);
  assert.match(html, /src="cid:share-badge"/);
  assert.match(html, /src="cid:download-badge"/);
  assert.doesNotMatch(html, /VIEW CREDENTIAL[^<]*↗/);
  assert.match(text, /View Credential: https:\/\/example\.com\/verify\/CERT-123/);
  const anotherRecipient = buildCertificateEmail({
    recipientName: "Hasheer Manegar",
    verificationUrl: "https://example.com/verify/CERT-456"
  });
  assert.match(anotherRecipient.html, /Here is your credential Hasheer Manegar!/);
  assert.match(anotherRecipient.text, /^VistaraCertifications\n\nHere is your credential Hasheer Manegar!/);
  const hashPrefixedName = buildCertificateEmail({
    recipientName: "# Hasheer Manegar",
    verificationUrl: "https://example.com/verify/CERT-789"
  });
  assert.match(hashPrefixedName.html, /Here is your credential Hasheer Manegar!/);
  assert.doesNotMatch(hashPrefixedName.html, /credential for/);
});

test("sends the reference hero and matching badges inline with the certificate PDF", async () => {
  const env = {
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    MAIL_FROM: process.env.MAIL_FROM
  };
  const originalFetch = global.fetch;
  let rawMessage;
  process.env.GMAIL_CLIENT_ID = "test-client";
  process.env.GMAIL_CLIENT_SECRET = "test-secret";
  process.env.GMAIL_REFRESH_TOKEN = "test-refresh-token";
  process.env.MAIL_FROM = "VistaraCertifications <mailer@example.com>";
  global.fetch = async (url, options) => {
    if (url === "https://oauth2.googleapis.com/token") {
      return { ok: true, json: async () => ({ access_token: "test-access-token" }) };
    }
    assert.equal(url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    rawMessage = Buffer.from(JSON.parse(options.body).raw, "base64url").toString("utf8");
    return { ok: true, json: async () => ({ id: "test-message" }) };
  };

  try {
    await sendCertificateEmail({
      to: "recipient@example.com",
      recipientName: "Avery",
      certificateTitle: "Completion",
      verificationUrl: "https://example.com/verify/CERT-123",
      certificateId: "CERT-123",
      pdfBuffer: Buffer.from("%PDF-test")
    });

    assert.match(rawMessage, /Content-Type: multipart\/related/);
    assert.match(rawMessage, /Content-ID: <certificate-hero>/);
    assert.match(rawMessage, /Content-Disposition: inline; filename="certificate-hero\.png"/);
    assert.match(rawMessage, /Content-Disposition: attachment; filename="CERT-123\.pdf"/);

    const inlineImages = {
      "certificate-hero": "credential-hero.png",
      "linkedin-badge": "linkedin-badge.png",
      "share-badge": "share-badge.png",
      "download-badge": "download-badge.png"
    };
    for (const [cid, filename] of Object.entries(inlineImages)) {
      const imagePart = rawMessage.split(`Content-ID: <${cid}>\r\n`)[1].split("\r\n--certifypro_related_")[0];
      const imageBase64 = imagePart.split("\r\n\r\n")[1].replace(/\s/g, "");
      const expectedImage = fs.readFileSync(path.join(__dirname, `../email-assets/${filename}`));
      assert.deepEqual(Buffer.from(imageBase64, "base64"), expectedImage);
    }

    const htmlPart = rawMessage.match(/Content-Type: text\/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n([\s\S]*?)\r\n--certifypro_alt_/);
    assert.ok(htmlPart);
    const html = Buffer.from(htmlPart[1].replace(/\s/g, ""), "base64").toString("utf8");
    assert.match(html, /src="cid:certificate-hero"/);
    assert.match(html, /Here is your credential Avery!/);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("escapes recipient, verification URL, and support email in HTML", () => {
  const previousSupportEmail = process.env.SUPPORT_EMAIL;
  process.env.SUPPORT_EMAIL = 'team&<test>"@example.com';

  try {
    const { html } = buildCertificateEmail({
      recipientName: '<img src=x onerror="alert(1)">',
      verificationUrl: 'https://example.com/verify?id="x"&other=<script>'
    });

    assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
    assert.ok(html.includes('href="https://example.com/verify?id=&quot;x&quot;&amp;other=&lt;script&gt;"'));
    assert.ok(html.includes('mailto:team&amp;&lt;test&gt;&quot;@example.com'));
    assert.ok(!html.includes("<img src=x"));
    assert.ok(!html.includes("<script>"));
  } finally {
    if (previousSupportEmail === undefined) delete process.env.SUPPORT_EMAIL;
    else process.env.SUPPORT_EMAIL = previousSupportEmail;
  }
});
