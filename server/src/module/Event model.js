const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    description: String,
    venue: String,
    eventDate: { type: Date, required: true },
    endDate: Date,
    capacity: Number,
    coverImage: String,
    gallery: [String], // post-event photos

    // RSVP
    rsvps: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["going", "not_going", "maybe"], default: "going" },
        respondedAt: { type: Date, default: Date.now },
      },
    ],

    // Polls
    polls: [
      {
        question: String,
        options: [{ label: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] }],
        closesAt: Date,
      },
    ],

    status: { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled"], default: "upcoming" },

    remindersSent: [{ sentAt: Date, hoursBeforeEvent: Number }],
  },
  { timestamps: true }
);

eventSchema.virtual("rsvpCount").get(function () {
  return this.rsvps.filter((r) => r.status === "going").length;
});

eventSchema.index({ society: 1, eventDate: 1 });

module.exports = mongoose.model("Event", eventSchema);