const mongoose = require("mongoose");
const crypto = require("crypto");
const Society = require("../module/Society");
const User = require("../module/User");
const MaintenanceBill = require("../module/MaintenanceBill");
const Complaint = require("../module/Complaint");
const Notice = require("../module/Notice");
const Visitor = require("../module/Visitor");

const findSocietyByIdOrExternal = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) return Society.findById(identifier);
  return Society.findOne({ externalId: identifier });
};

const resolveSocietyId = async (identifier) => {
  const society = await findSocietyByIdOrExternal(identifier);
  return society?._id || null;
};

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
      adminName: req.body.adminName || "",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, society });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/societies/:id ────────────────────────────────────────────────────
exports.getSociety = async (req, res, next) => {
  try {
    const society = await findSocietyByIdOrExternal(req.params.id);
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });
    await society.populate("createdBy", "name email");
    res.json({ success: true, society });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/societies/:id ──────────────────────────────────────────────────
exports.updateSociety = async (req, res, next) => {
  try {
    const society = await findSocietyByIdOrExternal(req.params.id);
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });

    Object.assign(society, req.body);
    await society.save();
    res.json({ success: true, society });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/societies ───────────────────────────────────────────────────────
exports.listSocieties = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "admin") {
      const societyId = req.user.society?._id || req.user.society;
      if (!societyId) {
        return res.status(400).json({ success: false, message: "Admin is not assigned to a society" });
      }
      filter._id = societyId;
    }

    const societies = await Society.find(filter)
      .select("name code totalUnits isActive address createdBy")
      .populate("createdBy", "name email");

    res.json({ success: true, societies });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/societies/:id/members ────────────────────────────────────────────
exports.getMembers = async (req, res, next) => {
  try {
    const societyId = await resolveSocietyId(req.params.id);
    if (!societyId) {
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

// ── POST /api/societies/:id/members ───────────────────────────────────────────
exports.createMember = async (req, res, next) => {
  try {
    const societyId = await resolveSocietyId(req.params.id);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Invalid society id" });
    }

    const { name, email, phone, flatNumber, wing, role, status, password } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Name, email, and phone are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "Email already registered" });

    const randomPassword = password || crypto.randomBytes(6).toString("hex");
    const user = await User.create({
      name,
      email,
      phone,
      password: randomPassword,
      role: role || "resident",
      society: societyId,
      flatNumber: flatNumber || "",
      wing: wing || "",
      status: status || "Active",
    });

    res.status(201).json({ success: true, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/societies/:id/members/:userId ──────────────────────────────────
exports.updateMember = async (req, res, next) => {
  try {
    const societyId = await resolveSocietyId(req.params.id);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "Invalid society id" });
    }

    const allowed = ["flatNumber", "wing", "role", "isActive", "vehicles", "familyMembers", "status"];
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

// ── DELETE /api/societies/:id ─────────────────────────────────────────────────
exports.deleteSociety = async (req, res, next) => {
  try {
    const id = req.params.id;
    let society = null;
    if (mongoose.Types.ObjectId.isValid(id)) society = await Society.findById(id);
    if (!society) society = await Society.findOne({ externalId: id });
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });

    // Only super_admin can delete entire society
    if (req.user.role !== "super_admin") return res.status(403).json({ success: false, message: "Not authorised" });

    const societyId = society._id;

    // Remove dependent data
    await Promise.all([
      User.deleteMany({ society: societyId }),
      MaintenanceBill.deleteMany({ society: societyId }),
      Complaint.deleteMany({ society: societyId }),
      Notice.deleteMany({ society: societyId }),
      Visitor.deleteMany({ society: societyId }),
    ]);

    await Society.findByIdAndDelete(societyId);
    res.json({ success: true, message: "Society and related data removed" });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/societies/:id/members/:userId ─────────────────────────────────
exports.deleteMember = async (req, res, next) => {
  try {
    const societyIdParam = req.params.id;
    const userIdParam = req.params.userId;

    let society = null;
    if (mongoose.Types.ObjectId.isValid(societyIdParam)) society = await Society.findById(societyIdParam);
    if (!society) society = await Society.findOne({ externalId: societyIdParam });
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });

    // Only super_admin or admin of that society can delete a member
    if (req.user.role !== "super_admin") {
      if (req.user.role !== "admin" || (String(req.user.society) !== String(society._id))) {
        return res.status(403).json({ success: false, message: "Not authorised" });
      }
    }

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userIdParam)) user = await User.findOne({ _id: userIdParam, society: society._id });
    if (!user) user = await User.findOne({ externalId: userIdParam, society: society._id });
    if (!user) return res.status(404).json({ success: false, message: "Member not found" });

    // Prevent deleting super_admin accounts accidentally
    if (user.role === "super_admin") return res.status(403).json({ success: false, message: "Cannot delete super admin" });

    await Promise.all([
      MaintenanceBill.deleteMany({ resident: user._id }),
      Complaint.deleteMany({ raisedBy: user._id }),
      Visitor.deleteMany({ host: user._id }),
      User.findByIdAndDelete(user._id),
    ]);

    res.json({ success: true, message: "Member and related data removed" });
  } catch (err) {
    next(err);
  }
};