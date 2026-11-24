const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  loginUser,
  getMe
} = require("../controllers/authController");

router.post("/login", loginUser);
router.get("/me", protect, getMe);

module.exports = router;
