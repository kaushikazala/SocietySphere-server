const Society = require("../models/Society");
const User = require("../models/User");

// ── POST /api/societies ───────────────────────────────────────────────────────
exports.createSociety = async (req, res, next) => {
  try {
    const society = await Society.create({ ...req.body, createdBy: req.user._id });
    // Attach admin to society
    await User.findByIdAndUpdate(req.user._id, { society: society._id, role: "admin" });
    res.status(201).json({ success: true, society });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/societies/:id ────────────────────────────────────────────────────
exports.getSociety = async (req, res, next) => {
  try {
    const society = await Society.findById(req.params.id).populate("createdBy", "name email");
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });
    res.json({ success: true, society });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/societies/:id ──────────────────────────────────────────────────
exports.updateSociety = async (req, res, next) => {
  try {
    const society = await Society.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });
    res.json({ success: true, society });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/societies/:id/members ────────────────────────────────────────────
exports.getMembers = async (req, res, next) => {
  try {
    const { role, wing, page = 1, limit = 20 } = req.query;
    const filter = { society: req.params.id };
    if (role) filter.role = role;
    if (wing) filter.wing = wing;

    const total = await User.countDocuments(filter);
    const members = await User.find(filter)
      .select("-password -refreshTokenHash -passwordResetToken")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort("name");

    res.json({ success: true, total, page: Number(page), members });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/societies/:id/members/:userId ──────────────────────────────────
exports.updateMember = async (req, res, next) => {
  try {
    const allowed = ["flatNumber", "wing", "role", "isActive", "vehicles", "familyMembers"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, society: req.params.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "Member not found" });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/societies/code/:code ─────────────────────────────────────────────
exports.getSocietyByCode = async (req, res, next) => {
  try {
    const society = await Society.findOne({
      code: req.params.code.toUpperCase(),
      isActive: true,
    }).select("name address code totalUnits");
    if (!society) return res.status(404).json({ success: false, message: "Invalid society code" });
    res.json({ success: true, society });
  } catch (err) {
    next(err);
  }
};