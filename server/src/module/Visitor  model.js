const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const visitorSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // resident

    // Visitor details
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    photo: String, // Cloudinary URL
    purpose: { type: String, enum: ["guest", "delivery", "service", "other"], default: "guest" },
    vehicleNumber: String,

    // Pass
    qrToken: { type: String, unique: true },
    qrImage: String, // base64 QR or Cloudinary URL
    passType: { type: String, enum: ["pre-approved", "walk-in"], default: "pre-approved" },

    // Validity
    expectedDate: Date,
    validFrom: Date,
    validUntil: Date,

    // Approval
    status: {
      type: String,
      enum: ["pending", "approved", "denied", "expired", "blacklisted"],
      default: "pending",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    denialReason: String,

    // Entry / Exit
    entryTime: Date,
    exitTime: Date,
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // guard

    // Guard notes
    notes: String,
  },
  { timestamps: true }
);

visitorSchema.pre("save", function (next) {
  if (!this.qrToken) this.qrToken = uuidv4();
  next();
});

visitorSchema.index({ society: 1, status: 1 });
visitorSchema.index({ qrToken: 1 });
visitorSchema.index({ host: 1, createdAt: -1 });

module.exports = mongoose.model("Visitor", visitorSchema);