const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
