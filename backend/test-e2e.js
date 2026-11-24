require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PDFDocument } = require("pdf-lib");

const User = require("./models/User");
const Certificate = require("./models/Certificate");
const Recipient = require("./models/Recipient");
const IssuedCertificate = require("./models/IssuedCertificate");

const base = `http://localhost:${process.env.PORT || 5000}/api`;
const runId = Date.now();
const email = `certifypro_e2e_${runId}@example.com`;

let userId, templateId, recipientId, issuedMongoId, expiryIssuedMongoId, token;
let passed = 0;

function check(label, condition) {
  if (!condition) throw new Error(`FAILED: ${label}`);
  passed++;
  console.log(`PASS: ${label}`);
}

async function api(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {})
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : Buffer.from(await response.arrayBuffer());

  return { response, body };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const user = await User.create({
    name: "CertifyPro E2E Test",
    email,
    password: await bcrypt.hash("Temporary-Test-Password-9284", 12),
    organization: "Snapshot Test Organization"
  });

  userId = user._id;
  token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  check("Temporary test account created", !!userId);

  const design = {
    width: 1120,
    height: 790,
    background: "#f5f0e6",
    elements: [
      {
        id: "title", type: "text",
        text: "CERTIFICATE OF COMPLETION",
        x: 180, y: 100, width: 760, height: 60,
        fontSize: 30, color: "#17365d", bold: true, align: "center"
      },
      {
        id: "recipient", type: "text",
        text: "{{recipient_name}}",
        x: 200, y: 270, width: 720, height: 65,
        fontSize: 36, color: "#222222", bold: true, align: "center"
      },
      {
        id: "course", type: "text",
        text: "Successfully completed Backend Testing",
        x: 200, y: 390, width: 720, height: 50,
        fontSize: 20, color: "#333333", align: "center"
      },
      {
        id: "qr", type: "qr", qrMode: "automatic",
        x: 930, y: 620, width: 100, height: 100
      }
    ]
  };

  const templateResult = await api("/certificates", {
    method: "POST",
    body: JSON.stringify({
      title: "Backend Testing Certificate",
      description: "End-to-end test template",
      organization: "Snapshot Test Organization",
      design
    })
  });

  check("Template creation API succeeded", templateResult.response.status === 201);
  templateId = templateResult.body.certificate?._id;

  check("Template ID received", !!templateId);

  const recipientResult = await api("/recipients", {
    method: "POST",
    body: JSON.stringify({
      name: "Original Test Recipient",
      email: `recipient_${runId}@example.com`,
      organization: "Original Recipient Organization"
    })
  });

  check("Recipient creation API succeeded", recipientResult.response.status === 201);
  recipientId = recipientResult.body.recipient?._id;

  check("Recipient ID received", !!recipientId);

  const issueResult = await api("/issued-certificates/issue", {
    method: "POST",
    body: JSON.stringify({ templateId, recipientId, sendEmail: false })
  });

  check("Certificate issue API succeeded", issueResult.response.status === 201);

  const issued = issueResult.body.certificate;
  check("Issued certificate details returned", !!issued?.certificateId);

  issuedMongoId = issued.id || issued._id;

  const emailStatusResult = await api("/issued-certificates/email-status", {
    method: "POST",
    body: JSON.stringify({ certificateIds: [issued.certificateId] })
  });
  check(
    "Certificate email status lookup returned the issued certificate",
    emailStatusResult.response.status === 200 &&
    emailStatusResult.body.certificates?.[0]?.certificateId === issued.certificateId
  );

  const stored = await IssuedCertificate.findById(issuedMongoId).lean();

  check("Design snapshot saved", stored?.designSnapshot?.elements?.length === 4);
  check("Recipient snapshot saved", stored?.recipientSnapshot?.name === "Original Test Recipient");
  check("Template snapshot saved", stored?.templateSnapshot?.title === "Backend Testing Certificate");

  await Certificate.findByIdAndUpdate(templateId, {
    $set: { title: "Changed Template Title" }
  });

  await Recipient.findByIdAndUpdate(recipientId, {
    $set: { name: "Changed Recipient Name" }
  });

  const verification = await api(
    `/issued-certificates/verify/${issued.certificateId}`
  );

  check(
    "Verification retains original snapshot details",
    verification.response.status === 200 &&
    verification.body.verified === true &&
    verification.body.certificate?.recipientName === "Original Test Recipient" &&
    verification.body.certificate?.certificateTitle === "Backend Testing Certificate"
  );

  const pdf = await api(`/issued-certificates/${issued.certificateId}/pdf`);

  check(
    "PDF download returns a valid PDF",
    pdf.response.status === 200 &&
    Buffer.isBuffer(pdf.body) &&
    pdf.body.subarray(0, 5).toString() === "%PDF-"
  );

  const pdfDocument = await PDFDocument.load(pdf.body);
  check("PDF contains exactly one page", pdfDocument.getPageCount() === 1);

  // Separate temporary certificate for expiry lifecycle tests.
  const initialExpiry = new Date(Date.now() + 30 * 86400000).toISOString();
  const expiryIssueResult = await api("/issued-certificates/issue", {
    method: "POST",
    body: JSON.stringify({ templateId, recipientId, expiresAt: initialExpiry, sendEmail: false })
  });

  check("Expiry test certificate issued", expiryIssueResult.response.status === 201);
  const expiryIssued = expiryIssueResult.body.certificate;
  expiryIssuedMongoId = expiryIssued?.id || expiryIssued?._id;

  check(
    "Expiry date saved during issuance",
    !!expiryIssuedMongoId && !!expiryIssued.expiresAt
  );

  const updatedExpiry = new Date(Date.now() + 60 * 86400000).toISOString();
  const expiryUpdate = await api(
    `/issued-certificates/${expiryIssued.certificateId}/expiry`,
    { method: "PATCH", body: JSON.stringify({ expiresAt: updatedExpiry }) }
  );

  check(
    "Expiry update API succeeds",
    expiryUpdate.response.status === 200 &&
    !!expiryUpdate.body.certificate?.expiresAt
  );

  await IssuedCertificate.findByIdAndUpdate(expiryIssuedMongoId, {
    $set: { expiresAt: new Date(Date.now() - 86400000), status: "valid" }
  });

  const expiredResend = await api(
    `/issued-certificates/${expiryIssued.certificateId}/email`,
    { method: "POST" }
  );

  const afterExpiredResend = await IssuedCertificate.findById(expiryIssuedMongoId);
  check(
    "Expired certificate email resend is blocked before SMTP",
    expiredResend.response.status === 409 &&
    afterExpiredResend?.status === "expired"
  );

  await IssuedCertificate.findByIdAndUpdate(expiryIssuedMongoId, {
    $set: { status: "valid" }
  });

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_FROM) {
    const unconfiguredResend = await api(
      `/issued-certificates/${expiryIssued.certificateId}/email`,
      { method: "POST" }
    );
    check(
      "Resend reports missing SMTP configuration instead of success",
      unconfiguredResend.response.status === 503 &&
      unconfiguredResend.body.emailStatus === "not_configured"
    );
  }

  const expiredPdf = await api(
    `/issued-certificates/${expiryIssued.certificateId}/pdf`
  );

  const afterExpiredPdf = await IssuedCertificate.findById(expiryIssuedMongoId);
  check(
    "Expired certificate PDF download is blocked and status updated",
    expiredPdf.response.status === 400 &&
    afterExpiredPdf?.status === "expired"
  );

  const expiredVerification = await api(
    `/issued-certificates/verify/${expiryIssued.certificateId}`
  );

  check(
    "Public verification rejects expired certificate",
    expiredVerification.response.status === 200 &&
    expiredVerification.body.verified === false &&
    expiredVerification.body.status === "expired"
  );

  const revoke = await api(
    `/issued-certificates/${issued.certificateId}/revoke`,
    { method: "PATCH" }
  );

  check("Certificate revocation API succeeded", revoke.response.status === 200);

  const revokedVerification = await api(
    `/issued-certificates/verify/${issued.certificateId}`
  );

  check(
    "Public verification rejects revoked certificate",
    revokedVerification.response.status === 200 &&
    revokedVerification.body.verified === false &&
    revokedVerification.body.status === "revoked"
  );

  const revokedPdf = await api(
    `/issued-certificates/${issued.certificateId}/pdf`
  );

  check("PDF download is blocked after revocation", revokedPdf.response.status === 400);

  console.log(`\nSUCCESS: ${passed} checks passed.`);
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error("\nTEST FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      if (issuedMongoId) await IssuedCertificate.deleteOne({ _id: issuedMongoId });
      if (expiryIssuedMongoId) await IssuedCertificate.deleteOne({ _id: expiryIssuedMongoId });
      if (templateId) await Certificate.deleteOne({ _id: templateId });
      if (recipientId) await Recipient.deleteOne({ _id: recipientId });
      if (userId) await User.deleteOne({ _id: userId });
      console.log("Temporary test records cleaned up.");
    } catch (error) {
      console.error("Cleanup warning:", error.message);
      process.exitCode = 1;
    }

    await mongoose.disconnect();
  }
})();
