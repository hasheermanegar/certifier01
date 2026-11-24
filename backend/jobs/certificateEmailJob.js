"use strict";

const IssuedCertificate = require("../models/IssuedCertificate");
const { processNextPendingCertificateEmail } = require("../controllers/issuedCertificateController");

const STALE_ATTEMPT_MS = 15 * 60 * 1000;
const RECOVERY_INTERVAL_MS = 60 * 1000;
let timer = null;
let running = false;
let lastRecoveryAt = 0;

async function recoverStaleEmailAttempts() {
  const staleBefore = new Date(Date.now() - STALE_ATTEMPT_MS);
  const result = await IssuedCertificate.updateMany(
    {
      emailStatus: "sending",
      emailAttemptStartedAt: { $lte: staleBefore }
    },
    { $set: { emailStatus: "pending", emailAttemptStartedAt: null } }
  );
  if (result.modifiedCount) {
    console.warn(`Certificate email job: requeued ${result.modifiedCount} stale email(s).`);
  }
  lastRecoveryAt = Date.now();
}

async function processPendingEmails() {
  if (running) return;
  running = true;
  try {
    if (Date.now() - lastRecoveryAt >= RECOVERY_INTERVAL_MS) {
      await recoverStaleEmailAttempts();
    }
    await processNextPendingCertificateEmail();
  } catch (error) {
    console.error("Certificate email job failed:", error.message);
  } finally {
    running = false;
  }
}

function startCertificateEmailJob() {
  if (timer) return;
  void processPendingEmails();
  timer = setInterval(processPendingEmails, 1000);
  if (timer.unref) timer.unref();
  console.log("Certificate email job scheduled.");
}

module.exports = { startCertificateEmailJob, processPendingEmails };
