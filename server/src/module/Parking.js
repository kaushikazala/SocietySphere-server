const mongoose = require("mongoose");

const parkingSlotSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    slotNumber: { type: String, required: true, trim: true },
    level: String, // "B1", "Ground", etc.
    type: { type: String, enum: ["covered", "open"], default: "open" },
    vehicleType: { type: String, enum: ["2-wheeler", "4-wheeler", "any"], default: "any" },

    // Permanent assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicleNumber: String,
    assignedAt: Date,

    // Visitor / temporary
    temporaryAssignment: {
      visitor: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor" },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      from: Date,
      until: Date,
    },

    status: { type: String, enum: ["available", "occupied", "reserved", "blocked"], default: "available" },
  },
  { timestamps: true }
);

const parkingViolationSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingSlot" },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // guard
    vehicleNumber: String,
    photo: String,
    description: String,
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

parkingSlotSchema.index({ society: 1, slotNumber: 1 }, { unique: true });
parkingSlotSchema.index({ society: 1, status: 1 });

const ParkingSlot = mongoose.model("ParkingSlot", parkingSlotSchema);
const ParkingViolation = mongoose.model("ParkingViolation", parkingViolationSchema);

module.exports = { ParkingSlot, ParkingViolation };