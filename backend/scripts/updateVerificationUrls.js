require("dotenv").config();
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const IssuedCertificate = require("../models/IssuedCertificate");

async function run() {
  const baseUrl = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
  if (!baseUrl.startsWith("https://")) {
    throw new Error("A valid HTTPS FRONTEND_URL is required.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const certificates = await IssuedCertificate.find({});
  let updated = 0;

  for (const certificate of certificates) {
    const verificationUrl = `${baseUrl}/verify/${certificate.certificateId}`;
    const qrCode = await QRCode.toDataURL(verificationUrl);

    certificate.verificationUrl = verificationUrl;
    certificate.qrCode = qrCode;
    await certificate.save();
    updated++;
  }

  console.log(`SUCCESS: Updated ${updated} certificate verification links and QR codes.`);
}

run()
  .catch((error) => {
    console.error("Update failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
