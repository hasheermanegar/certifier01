const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const nodemailer = require("nodemailer");
const originalCreateTransport = nodemailer.createTransport;
let sentMail;
nodemailer.createTransport = () => ({
  sendMail: async options => {
    sentMail = options;
  }
});
const { buildCertificateEmail, sendCertificateEmail } = require("../services/certificateMailer");

test("builds branded credential email with dynamic name, link, and benefits", () => {
  const { html, text } = buildCertificateEmail({
    recipientName: "Avery",
    verificationUrl: "https://example.com/verify/CERT-123"
  });

  assert.match(html, /Certify<\/span><span[^>]*> pro/);
  assert.match(html, /Here is your credential for Avery!/);
  assert.match(html, /href="https:\/\/example\.com\/verify\/CERT-123"/);
  assert.match(html, /src="cid:certificate-hero"/);
  assert.match(html, /Add it to your LinkedIn profile/);
  assert.match(html, /Share it on social media/);
  assert.match(html, /Download the attached PDF/);
  assert.match(html, /A PDF copy of your certificate is attached/);
  assert.match(text, /View Credential: https:\/\/example\.com\/verify\/CERT-123/);
  assert.match(text, /Download the attached PDF for printing/);
});

test("sends the reference hero image inline alongside the certificate PDF", async () => {
  const env = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    MAIL_FROM: process.env.MAIL_FROM
  };
  process.env.SMTP_HOST = "smtp.example.com";
  process.env.SMTP_USER = "mailer@example.com";
  process.env.SMTP_PASS = "test-password";
  process.env.MAIL_FROM = "Certify Pro <mailer@example.com>";

  try {
    await sendCertificateEmail({
      to: "recipient@example.com",
      recipientName: "Avery",
      certificateTitle: "Completion",
      verificationUrl: "https://example.com/verify/CERT-123",
      certificateId: "CERT-123",
      pdfBuffer: Buffer.from("test-pdf")
    });

    const inlineImage = sentMail.attachments.find(item => item.cid === "certificate-hero");
    const certificatePdf = sentMail.attachments.find(item => item.contentType === "application/pdf");
    assert.ok(sentMail.html.includes('src="cid:certificate-hero"'));
    assert.ok(inlineImage);
    assert.equal(inlineImage.contentDisposition, "inline");
    assert.ok(fs.statSync(path.join(__dirname, "../email-assets/credential-hero.png")).size > 0);
    assert.ok(certificatePdf);
  } finally {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    nodemailer.createTransport = originalCreateTransport;
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
