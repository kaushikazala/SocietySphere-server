const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    description: String,
    category: {
      type: String,
      enum: ["bylaw", "budget", "minutes", "noc", "invoice", "policy", "other"],
      default: "other",
    },

    fileUrl: { type: String, required: true },
    fileType: String, // "application/pdf", etc.
    fileSize: Number, // bytes
    cloudinaryId: String,

    // Access control
    accessLevel: {
      type: String,
      enum: ["all_residents", "admin_only"],
      default: "all_residents",
    },

    // Versioning
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        fileUrl: String,
        version: Number,
        uploadedAt: Date,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    tags: [String],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ society: 1, category: 1 });
documentSchema.index({ society: 1, name: "text", description: "text" });

module.exports = mongoose.model("Document", documentSchema);