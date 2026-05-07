const mongoose = require("mongoose");

const emergencyAlertSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["sos", "fire", "medical", "theft", "natural_disaster", "other"],
      required: true,
    },
    description: String,

    // Location context (within society)
    location: {
      wing: String,
      floor: String,
      flatNumber: String,
      area: String, // "Gate A", "Parking", etc.
    },

    // Response thread
    responses: [
      {
        responder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        respondedAt: { type: Date, default: Date.now },
      },
    ],

    status: { type: String, enum: ["active", "responding", "resolved"], default: "active" },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Delivery confirmation
    notifiedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ society: 1, status: 1 });
emergencyAlertSchema.index({ society: 1, createdAt: -1 });

module.exports = mongoose.model("EmergencyAlert", emergencyAlertSchema);