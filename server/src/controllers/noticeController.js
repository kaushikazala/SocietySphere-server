const Notice = require("../module/Notice");
const User = require("../module/User");
const { toSociety } = require("../utils/socket");
const { sendEmergencyAlert } = require("../utils/mailer");

// ── POST /api/notices ─────────────────────────────────────────────────────────
exports.createNotice = async (req, res, next) => {
  try {
    const notice = await Notice.create({
      ...req.body,
      society: req.user.society,
      createdBy: req.user._id,
    });

    // Emergency broadcast → socket + email all residents
    if (notice.priority === "emergency") {
      toSociety(req.user.society.toString(), "emergency_notice", { notice });

      const residents = await User.find({
        society: req.user.society,
        role: { $in: ["resident", "admin", "guard"] },
      }).select("email");

      sendEmergencyAlert(
        residents.map((r) => r.email),
        { type: "emergency", description: notice.title }
      ).catch(() => {});
    } else {
      toSociety(req.user.society.toString(), "new_notice", { notice });
    }

    res.status(201).json({ success: true, notice });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notices ──────────────────────────────────────────────────────────
exports.getNotices = async (req, res, next) => {
  try {
    const { priority, archived, page = 1, limit = 20 } = req.query;
    const filter = {
      society: req.user.society,
      isArchived: archived === "true",
    };
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
    await Notice.findByIdAndUpdate(req.params.id, { isArchived: true });
    res.json({ success: true, message: "Notice archived" });
  } catch (err) {
    next(err);
  }
};