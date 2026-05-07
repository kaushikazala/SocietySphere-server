const EmergencyAlert = require("../models/EmergencyAlert");
const User = require("../models/User");
const { toSociety, toUser } = require("../utils/socket");
const { sendEmergencyAlert } = require("../utils/mailer");

// ── POST /api/emergency/sos ───────────────────────────────────────────────────
exports.triggerSOS = async (req, res, next) => {
  try {
    const { type = "sos", description, location } = req.body;

    const alert = await EmergencyAlert.create({
      society: req.user.society,
      triggeredBy: req.user._id,
      type, description, location,
    });

    // Broadcast via socket to the entire society room
    toSociety(req.user.society.toString(), "emergency_sos", {
      alertId: alert._id,
      type,
      description,
      location,
      triggeredBy: { name: req.user.name, flatNumber: req.user.flatNumber },
    });

    // Email all residents + admin + guards
    const recipients = await User.find({
      society: req.user.society,
      role: { $in: ["resident", "admin", "guard"] },
    }).select("email _id");

    alert.notifiedUsers = recipients.map((r) => r._id);
    await alert.save();

    sendEmergencyAlert(
      recipients.map((r) => r.email),
      alert
    ).catch(() => {});

    res.status(201).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/emergency ────────────────────────────────────────────────────────
exports.getAlerts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { society: req.user.society };
    if (status) filter.status = status;

    const alerts = await EmergencyAlert.find(filter)
      .populate("triggeredBy", "name flatNumber wing role")
      .populate("responses.responder", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/emergency/:id/respond ──────────────────────────────────────────
exports.addResponse = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });

    alert.responses.push({ responder: req.user._id, message: req.body.message });
    if (alert.status === "active") alert.status = "responding";
    await alert.save();

    toSociety(req.user.society.toString(), "emergency_response", {
      alertId: alert._id,
      responder: req.user.name,
      message: req.body.message,
    });

    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/emergency/:id/resolve ─────────────────────────────────────────
exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: "resolved", resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });

    toSociety(req.user.society.toString(), "emergency_resolved", { alertId: alert._id });
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};