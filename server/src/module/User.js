const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },

    role: {
      type: String,
      enum: ["super_admin", "admin", "resident", "guard", "maintenance"],
      default: "resident",
    },

    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society" },

    // Resident-specific
    flatNumber: { type: String, trim: true },
    externalId: { type: String, unique: true, sparse: true },
    wing: { type: String, trim: true },
    vehicles: [
      {
        type: { type: String, enum: ["2-wheeler", "4-wheeler", "other"] },
        number: String,
        model: String,
      },
    ],
    familyMembers: [{ name: String, relation: String, phone: String }],
    moveInDate: Date,
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

    // Profile
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    // 2FA
    twoFactorEnabled: { type: Boolean, default: false },

    // Password reset
    passwordResetToken: String,
    passwordResetExpiry: Date,

    // Refresh token hash (for rotation)
    refreshTokenHash: { type: String, select: false },

    lastLogin: Date,
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ society: 1, role: 1 });
userSchema.index({ society: 1, flatNumber: 1, wing: 1 });

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Instance: compare password ────────────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Instance: safe public object ──────────────────────────────────────────────
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  return obj;
};

module.exports = mongoose.model("User", userSchema);