const mongoose = require("mongoose");

const threadMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    attachments: [String],
  },
  { timestamps: true }
);

const complaintSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    externalId: { type: String, unique: true, sparse: true },
    category: {
      type: String,
      enum: ["plumbing", "electrical", "security", "cleanliness", "noise", "parking", "lift", "infrastructure", "safety", "services", "other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attachments: [String], // Cloudinary URLs

    // Workflow
    status: {
      type: String,
      enum: ["submitted", "acknowledged", "assigned", "in_progress", "resolved", "closed", "escalated", "Open", "In Progress", "Resolved"],
      default: "submitted",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // maintenance staff
    assignedAt: Date,

    // SLA
    slaDeadline: Date,
    resolvedAt: Date,

    // Communication thread
    thread: [threadMessageSchema],

    // Rating after resolution (1-5)
    rating: { type: Number, min: 1, max: 5 },
    ratingComment: String,

    // Escalation
    escalatedAt: Date,
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// SLA deadlines by priority (hours)
const SLA_HOURS = { low: 72, medium: 48, high: 24, critical: 4 };

complaintSchema.pre("save", async function () {
  if (this.isNew) {
    const hours = SLA_HOURS[this.priority] || 48;
    this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
});

complaintSchema.index({ society: 1, status: 1 });
complaintSchema.index({ society: 1, category: 1 });
complaintSchema.index({ raisedBy: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);