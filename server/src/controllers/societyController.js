const mongoose = require("mongoose");
const Society = require("../module/Society");
const User = require("../module/User");

// ── POST /api/societies ───────────────────────────────────────────────────────
exports.createSociety = async (req, res, next) => {
  try {
    const { name, address, totalUnits } = req.body;
    if (!name || !address || typeof address !== "object") {
      return res.status(400).json({ success: false, message: "Society name and address are required" });
    }
    if (!address.city || !address.state) {
      return res.status(400).json({
        success: false,
        message: "Society address must include city and state",
      });
    }
    if (!totalUnits || Number(totalUnits) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total units must be a positive number",
      });
    }

    const society = await Society.create({
      name,
      address: {
        line1: address.line1 || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode || "",
      },
      totalUnits: Number(totalUnits),
      createdBy: req.user._id,
    });

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
    const societyId = req.params.id;
    if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) {
      return res.status(400).json({ success: false, message: "Invalid society id" });
    }

    const { role, wing, page = 1, limit = 20 } = req.query;
    const filter = { society: societyId };
    if (role) filter.role = role;
    if (wing) filter.wing = wing;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 20;

    const total = await User.countDocuments(filter);
    const members = await User.find(filter)
      .select("-password -refreshTokenHash -passwordResetToken")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort("name");

    res.json({ success: true, total, page: pageNumber, members });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/societies/:id/members/:userId ──────────────────────────────────
exports.updateMember = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) {
      return res.status(400).json({ success: false, message: "Invalid society id" });
    }

    const allowed = ["flatNumber", "wing", "role", "isActive", "vehicles", "familyMembers"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, society: societyId },
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