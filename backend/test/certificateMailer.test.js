const assert = require("node:assert/strict");
const { test } = require("node:test");
const { buildCertificateEmail } = require("../services/certificateMailer");

test("builds branded credential email with dynamic name, link, and benefits", () => {
  const { html, text } = buildCertificateEmail({
    recipientName: "Avery",
    verificationUrl: "https://example.com/verify/CERT-123"
  });

  assert.match(html, /Certify<\/span><span[^>]*> pro/);
  assert.match(html, /Here is your credential for Avery!/);
  assert.match(html, /href="https:\/\/example\.com\/verify\/CERT-123"/);
  assert.match(html, /Add it to your LinkedIn profile/);
  assert.match(html, /Share it on social media/);
  assert.match(html, /Download the attached PDF/);
  assert.match(html, /A PDF copy of your certificate is attached/);
  assert.match(text, /View Credential: https:\/\/example\.com\/verify\/CERT-123/);
  assert.match(text, /Download the attached PDF for printing/);
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
