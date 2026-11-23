const mongoose = require("mongoose");

const issuedCertificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipient",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    verificationUrl: {
      type: String,
      required: true
    },
    qrCode: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["valid", "revoked"],
      default: "valid"
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "IssuedCertificate",
  issuedCertificateSchema
);
