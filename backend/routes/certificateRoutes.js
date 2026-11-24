const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  createCertificate,
  getCertificates,
  getCertificate,
  updateCertificate,
  deleteCertificate
} = require("../controllers/certificateController");

router.use(protect, adminOnly);

router.post("/", createCertificate);
router.get("/", getCertificates);
router.get("/:id", getCertificate);
router.put("/:id", updateCertificate);
router.delete("/:id", deleteCertificate);

module.exports = router;
