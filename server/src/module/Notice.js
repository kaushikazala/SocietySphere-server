const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    externalId: { type: String, unique: true, sparse: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    message: String,
    type: { type: String, enum: ["General", "Urgent", "Emergency"], default: "General" },
    target: { type: String, default: "All" },
    publishDate: Date,
    expiryDate: Date,
    attachments: [String], // Cloudinary URLs (images / PDFs)

    priority: {
      type: String,
      enum: ["normal", "important", "emergency"],
      default: "normal",
    },

    // Targeting
    audience: {
      type: String,
      enum: ["all", "wing", "flat"],
      default: "all",
    },
    targetWings: [String],   // if audience === "wing"
    targetFlats: [String],   // if audience === "flat"

    // Read receipts
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    expiresAt: Date,
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

noticeSchema.index({ society: 1, createdAt: -1 });
noticeSchema.index({ society: 1, priority: 1 });

module.exports = mongoose.model("Notice", noticeSchema);