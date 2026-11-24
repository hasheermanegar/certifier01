const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  addRecipient,
  bulkAddRecipients,
  getRecipients,
  updateRecipient,
  deleteRecipient
} = require("../controllers/recipientController");

router.use(protect, adminOnly);

router.post("/bulk", bulkAddRecipients);
router.post("/", addRecipient);
router.get("/", getRecipients);
router.put("/:id", updateRecipient);
router.delete("/:id", deleteRecipient);

module.exports = router;
