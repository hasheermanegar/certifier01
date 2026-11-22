const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  issueCertificate,
  getIssuedCertificates,
  verifyCertificate,
  revokeCertificate,
  setCertificateExpiry,
  resendCertificateEmail,
  downloadCertificatePDF,
  getCertificateEmailStatuses
} = require("../controllers/issuedCertificateController");

router.get("/verify/:certificateId", verifyCertificate);

router.use(protect);

router.post("/issue", issueCertificate);
router.get("/", getIssuedCertificates);
router.post("/email-status", getCertificateEmailStatuses);
router.get("/:certificateId/pdf", downloadCertificatePDF);
router.patch("/:certificateId/revoke", revokeCertificate);
router.patch("/:certificateId/expiry", setCertificateExpiry);
router.post("/:certificateId/email", resendCertificateEmail);

module.exports = router;
