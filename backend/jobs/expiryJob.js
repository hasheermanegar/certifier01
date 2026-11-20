"use strict";

const IssuedCertificate = require("../models/IssuedCertificate");

let timer = null;
let running = false;

async function markExpiredCertificates() {
  if (running) return;
  running = true;
  try {
    const result = await IssuedCertificate.updateMany(
      {
        status: "valid",
        expiresAt: { $ne: null, $lte: new Date() }
      },
      { $set: { status: "expired" } }
    );
    if (result.modifiedCount) {
      console.log("Expiry job: marked " + result.modifiedCount + " certificate(s) expired.");
    }
  } catch (error) {
    console.error("Certificate expiry job failed:", error.message);
  } finally {
    running = false;
  }
}

function startExpiryJob() {
  if (timer) return;
  markExpiredCertificates();
  timer = setInterval(markExpiredCertificates, 60 * 1000);
  if (timer.unref) timer.unref();
  console.log("Certificate expiry job scheduled (every 60 seconds).");
}

module.exports = { startExpiryJob, markExpiredCertificates };
