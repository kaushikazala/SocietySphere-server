const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const forumPostSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ["general", "suggestion", "rule", "neighborhood", "announcement", "other"],
      default: "general",
    },

    attachments: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [replySchema],

    // Admin controls
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    isAdminOnly: { type: Boolean, default: false }, // announcements channel
  },
  { timestamps: true }
);

forumPostSchema.index({ society: 1, createdAt: -1 });
forumPostSchema.index({ society: 1, isPinned: -1, createdAt: -1 });
forumPostSchema.index({ society: 1, body: "text", title: "text" });

module.exports = mongoose.model("ForumPost", forumPostSchema);