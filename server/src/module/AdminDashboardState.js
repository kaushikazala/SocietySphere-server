const mongoose = require("mongoose");

const adminDashboardStateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    state: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminDashboardState", adminDashboardStateSchema);
