const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../module/User");
const Society = require("../module/Society");
const { sendTokens, signAccess, hashToken, compareToken } = require("../utils/tokens");
const { generateOtp, storeOtp, verifyOtp } = require("../utils/otp");
const { sendOtp, sendWelcome } = require("../utils/mailer");

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, societyCode, societyId } = req.body;

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: "Email already registered" });

    // Resolve society
    let society = null;
    if (role === "admin") {
      // Admin joins an existing society via society code
      if (!societyCode)
        return res.status(400).json({ success: false, message: "Society code required" });
      society = await Society.findOne({ code: societyCode.toUpperCase() });
      if (!society)
        return res.status(400).json({ success: false, message: "Invalid society code" });
    } else if (role !== "super_admin") {
      // Other non-super-admin roles join via society code
      if (!societyCode)
        return res.status(400).json({ success: false, message: "Society code required" });
      society = await Society.findOne({ code: societyCode.toUpperCase() });
      if (!society)
        return res.status(400).json({ success: false, message: "Invalid society code" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || "resident",
      society: society?._id,
    });

    if (society) sendWelcome(email, name, society.name).catch(() => {});

    await sendTokens(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const user = await User.findOne({ email }).select("+password +refreshTokenHash");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: "Account deactivated" });

    // Optional: role mismatch guard
    if (role && user.role !== role)
      return res.status(403).json({ success: false, message: "Role mismatch" });

    await sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshTokenHash");
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const valid = await compareToken(refreshToken, user.refreshTokenHash || "");
    if (!valid) return res.status(401).json({ success: false, message: "Invalid refresh token" });

    await sendTokens(user, 200, res);
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    next(err);
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    req.user.refreshTokenHash = undefined;
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
exports.sendOtpRoute = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const otp = generateOtp();
    await storeOtp(email, otp);
    await sendOtp(email, otp);

    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
exports.verifyOtpRoute = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOtp(email, otp);
    if (!result.valid)
      return res.status(400).json({ success: false, message: result.reason });

    // Mark email as verified
    await User.findOneAndUpdate({ email }, { isEmailVerified: true });
    res.json({ success: true, message: "Email verified" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond 200 to avoid user enumeration
    if (!user) return res.json({ success: true, message: "If that email exists, an OTP was sent" });

    const otp = generateOtp();
    await storeOtp(`reset:${email}`, otp);
    await sendOtp(email, otp);

    res.json({ success: true, message: "If that email exists, an OTP was sent" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    const result = await verifyOtp(`reset:${email}`, otp);
    if (!result.valid)
      return res.status(400).json({ success: false, message: result.reason });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = password;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
};

// ── PATCH /api/auth/me ────────────────────────────────────────────────────────
exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "avatar", "flatNumber", "wing", "vehicles", "familyMembers"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/auth/change-password ──────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ success: false, message: "Current password incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    next(err);
  }
};