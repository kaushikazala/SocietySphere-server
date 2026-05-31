const mongoose = require("mongoose");
const Notice = require("../module/Notice");
const User = require("../module/User");
const Society = require("../module/Society");
const { toSociety } = require("../utils/socket");
const { sendEmergencyAlert } = require("../utils/mailer");

// ── POST /api/notices ─────────────────────────────────────────────────────────
exports.createNotice = async (req, res, next) => {
  try {
    const { societyId, target } = req.body;
    let society = req.user.society;

    if (req.user.role === "super_admin") {
      if (target === "All" && !societyId) {
        return res.status(400).json({
          success: false,
          message: "Super admin must select a society when creating a notice for all residents.",
        });
      }

      if (societyId || (target && target !== "All")) {
        const lookupId = societyId || target;
        society = mongoose.Types.ObjectId.isValid(lookupId)
          ? await Society.findById(lookupId)
          : await Society.findOne({ externalId: lookupId });
        if (!society) return res.status(404).json({ success: false, message: "Society not found" });
        society = society._id;
      }
    }

    if (!society) {
      return res.status(400).json({ success: false, message: "Society context is required" });
    }

    const notice = await Notice.create({
      ...req.body,
      society,
      createdBy: req.user._id,
    });

    const broadcastSociety = society;
    const isEmergency = notice.priority === "emergency";

    if (isEmergency) {
      toSociety(broadcastSociety.toString(), "emergency_notice", { notice });

      const residents = await User.find({
        society: broadcastSociety,
        role: { $in: ["resident", "admin", "guard"] },
      }).select("email");

      sendEmergencyAlert(
        residents.map((r) => r.email),
        { type: "emergency", description: notice.title }
      ).catch(() => {});
    } else {
      toSociety(broadcastSociety.toString(), "new_notice", { notice });
    }

    res.status(201).json({ success: true, notice });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notices ──────────────────────────────────────────────────────────
exports.getNotices = async (req, res, next) => {
  try {
    const { priority, archived, page = 1, limit = 20, societyId } = req.query;
    const filter = {
      isArchived: archived === "true",
    };
    if (req.user.role !== "super_admin") {
      filter.society = req.user.society;
    } else if (societyId) {
      filter.society = societyId;
    }
    if (priority) filter.priority = priority;

    const total = await Notice.countDocuments(filter);
    const notices = await Notice.find(filter)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, notices });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notices/:id ────────────────────────────────────────────────────
exports.updateNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    const isSameSociety = notice.society?.toString() === req.user.society?.toString();
    if (req.user.role === "super_admin") {
      // allow
    } else if (req.user.role === "admin" && isSameSociety) {
      // allow
    } else {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    const allowed = ["title", "message", "target", "type", "priority", "publishDate", "expiryDate"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await Notice.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, notice: updated });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notices/:id/read ───────────────────────────────────────────────
exports.markRead = async (req, res, next) => {
  try {
    await Notice.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notices/:id ───────────────────────────────────────────────────
exports.deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    const isSameSociety = notice.society?.toString() === req.user.society?.toString();
    if (req.user.role === "super_admin") {
      // allow
    } else if (req.user.role === "admin" && isSameSociety) {
      // allow
    } else {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    await Notice.findByIdAndDelete(notice._id);
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) {
    next(err);
  }
};