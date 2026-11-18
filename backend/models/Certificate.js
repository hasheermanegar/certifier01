const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    design: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    organization: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
