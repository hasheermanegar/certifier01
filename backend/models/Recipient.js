const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    organization: {
      type: String,
      default: "",
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

recipientSchema.index(
  { createdBy: 1, email: 1 },
  { unique: true }
);

module.exports = mongoose.model("Recipient", recipientSchema);
