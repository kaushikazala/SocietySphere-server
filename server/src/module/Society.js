const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const societySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, uppercase: true }, // e.g. SSP-AHMD-204
    address: {
      line1: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: String,
    },
    totalUnits: { type: Number, required: true },
    wings: [{ label: String, floors: Number, unitsPerFloor: Number }],
    registrationNumber: String,
    logo: String,

    // Billing config
    billing: {
      cycleDay: { type: Number, default: 1 },      // day-of-month invoices generate
      dueDays: { type: Number, default: 15 },       // days after cycle day before late fee
      lateFeePercent: { type: Number, default: 2 }, // % per month
      maintenanceAmounts: [
        {
          unitType: String, // "1BHK", "2BHK", etc.
          amount: Number,
        },
      ],
    },

    // Contact
    contactEmail: String,
    contactPhone: String,

    // Plan
    plan: {
      tier: { type: String, enum: ["starter", "growth", "enterprise"], default: "starter" },
      expiresAt: Date,
    },

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ── Auto-generate society code before save ────────────────────────────────────
societySchema.pre("save", function () {
  if (!this.code) {
    const slug = (this.address?.city || "XXXX").slice(0, 4).toUpperCase();
    const uid = uuidv4().split("-")[0].toUpperCase();
    this.code = `SSP-${slug}-${uid}`;
  }
});

module.exports = mongoose.model("Society", societySchema);