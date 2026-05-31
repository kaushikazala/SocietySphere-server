const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    externalId: { type: String, unique: true, sparse: true },

    // Invoice details
    invoiceNumber: { type: String, unique: true },
    type: { type: String, enum: ["Maintenance", "Water", "Electricity", "Other"], default: "Maintenance" },
    billingMonth: { type: String, required: true }, // "2025-07"
    amount: { type: Number, required: true },
    lateFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalDue: { type: Number, required: true },

    // Status
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "waived"],
      default: "pending",
    },
    dueDate: { type: Date, required: true },

    // Payment
    payment: {
      method: { type: String, enum: ["upi", "card", "netbanking", "wallet", "cash", "other"] },
      transactionId: String,
      gateway: String,
      paidAt: Date,
      receipt: String, // Cloudinary URL
    },

    // Reminders sent
    remindersSent: [{ sentAt: Date, channel: String }],

    notes: String,
  },
  { timestamps: true }
);

// ── Auto-generate invoice number ──────────────────────────────────────────────
billSchema.pre("save", async function () {
  if (!this.invoiceNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    this.invoiceNumber = `INV-${ts}`;
  }
  // ensure numeric values to avoid NaN
  const amount = Number(this.amount) || 0;
  const lateFee = Number(this.lateFee) || 0;
  const discount = Number(this.discount) || 0;
  this.totalDue = amount + lateFee - discount;
});

billSchema.index({ society: 1, billingMonth: 1 });
billSchema.index({ resident: 1, status: 1 });

module.exports = mongoose.model("MaintenanceBill", billSchema);