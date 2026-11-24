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

    // Immutable copies of the information at issuance time.
    designSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    },
    recipientSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    },
    templateSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
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
      enum: ["valid", "revoked", "expired"],
      default: "valid"
    },
    expiresAt: { type: Date, default: null },
    emailStatus: { type: String, enum: ["pending", "sending", "sent", "failed", "not_configured"], default: "not_configured" },
    emailAttemptStartedAt: { type: Date, default: null },
    emailSentAt: { type: Date, default: null },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

issuedCertificateSchema.index({ emailStatus: 1, issuedAt: 1 });

module.exports = mongoose.model(
  "IssuedCertificate",
  issuedCertificateSchema
);
