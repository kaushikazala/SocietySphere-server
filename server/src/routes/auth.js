const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middlewares/auth");
const ctrl = require("../controllers/authController");

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });

router.post("/register", authLimiter, ctrl.register);
router.post("/login", authLimiter, ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", protect, ctrl.logout);

router.post("/send-otp", otpLimiter, ctrl.sendOtpRoute);
router.post("/verify-otp", ctrl.verifyOtpRoute);
router.post("/forgot-password", otpLimiter, ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);

router.get("/me", protect, ctrl.getMe);
router.patch("/me", protect, ctrl.updateMe);
router.patch("/change-password", protect, ctrl.changePassword);

module.exports = router;