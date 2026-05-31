const mongoose = require("mongoose");
const Complaint = require("../module/Complaint");
const User = require("../module/User");
const Society = require("../module/Society");
const { toUser, toSociety } = require("../utils/socket");

const resolveSociety = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) return Society.findById(identifier);
  return Society.findOne({ externalId: identifier });
};

const resolveResident = async (identifier, societyId) => {
  if (!identifier) return null;
  const query = { society: societyId };
  if (mongoose.Types.ObjectId.isValid(identifier)) query._id = identifier;
  else query.externalId = identifier;
  return User.findOne(query);
};

// ── POST /api/complaints ──────────────────────────────────────────────────────
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority, attachments, societyId, residentId } = req.body;
    let society = req.user.society;
    if (req.user.role === "super_admin" && societyId) {
      society = await resolveSociety(societyId);
      if (!society) return res.status(404).json({ success: false, message: "Society not found" });
      society = society._id;
    }

    let resident = null;
    if (residentId) {
      resident = await resolveResident(residentId, society);
      if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });
    }

    const complaint = await Complaint.create({
      society,
      raisedBy: req.user._id,
      resident: resident?._id,
      title,
      description,
      category: category ? category.toLowerCase() : "other",
      priority: priority ? priority.toLowerCase() : "medium",
      attachments,
    });

    toSociety(society.toString(), "new_complaint", { complaint });
    res.status(201).json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/complaints ───────────────────────────────────────────────────────
exports.getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.user.role !== "super_admin") {
      filter.society = req.user.society;
    } else if (req.query.societyId) {
      filter.society = req.query.societyId;
    }

    if (req.user.role === "resident") filter.raisedBy = req.user._id;
    if (req.user.role === "maintenance") filter.assignedTo = req.user._id;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate("raisedBy", "name flatNumber wing")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, complaints });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/complaints/:id ───────────────────────────────────────────────────
exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("raisedBy", "name flatNumber wing email")
      .populate("assignedTo", "name email phone")
      .populate("thread.sender", "name role");
    if (!complaint) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/complaints/:id ────────────────────────────────────────────────
exports.updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    const isSameSociety = complaint.society?.toString() === req.user.society?.toString();
    const isOwner = complaint.raisedBy?.toString() === req.user._id.toString();
    const isAssigned = complaint.assignedTo?.toString() === req.user._id.toString();

    if (req.user.role === "super_admin") {
      // allow
    } else if (req.user.role === "admin" && isSameSociety) {
      // allow
    } else if (req.user.role === "resident" && isOwner) {
      // allow
    } else if (req.user.role === "maintenance" && isAssigned) {
      // allow
    } else {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    const allowed = ["title", "description", "category", "priority", "status"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.category) updates.category = updates.category.toLowerCase();
    if (updates.priority) updates.priority = updates.priority.toLowerCase();
    if (updates.status === "resolved") updates.resolvedAt = new Date();

    const updated = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, complaint: updated });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/complaints/:id/assign ─────────────────────────────────────────
exports.assignComplaint = async (req, res, next) => {
  try {
    const { assignedTo, notes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Not found" });

    complaint.assignedTo = assignedTo;
    complaint.assignedAt = new Date();
    complaint.status = "assigned";
    if (notes) complaint.thread.push({ sender: req.user._id, message: notes });
    await complaint.save();

    toUser(assignedTo, "complaint_assigned", { complaintId: complaint._id });
    toUser(complaint.raisedBy.toString(), "complaint_update", {
      complaintId: complaint._id, status: "assigned",
    });

    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/complaints/:id/status ─────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, message } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Not found" });

    complaint.status = status;
    if (status === "resolved") complaint.resolvedAt = new Date();
    if (message) complaint.thread.push({ sender: req.user._id, message });
    await complaint.save();

    toUser(complaint.raisedBy.toString(), "complaint_update", {
      complaintId: complaint._id, status,
    });

    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/complaints/:id/thread ──────────────────────────────────────────
exports.addThreadMessage = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Not found" });

    complaint.thread.push({
      sender: req.user._id,
      message: req.body.message,
      attachments: req.body.attachments || [],
    });
    await complaint.save();

    // Notify the other party
    const notifyId =
      complaint.raisedBy.toString() === req.user._id.toString()
        ? complaint.assignedTo
        : complaint.raisedBy;
    if (notifyId) toUser(notifyId.toString(), "complaint_message", { complaintId: complaint._id });

    res.json({ success: true, thread: complaint.thread });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/complaints/:id/rate ────────────────────────────────────────────
exports.rateComplaint = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, raisedBy: req.user._id, status: "resolved" },
      { rating, ratingComment: comment },
      { new: true }
    );
    if (!complaint)
      return res.status(400).json({ success: false, message: "Only resolved complaints can be rated" });
    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/complaints/:id ─────────────────────────────────────────────
exports.deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    const isSameSociety = complaint.society?.toString() === req.user.society?.toString();
    const isOwner = complaint.raisedBy?.toString() === req.user._id.toString();
    const isAssigned = complaint.assignedTo?.toString() === req.user._id.toString();

    if (req.user.role === "super_admin") {
      // allow
    } else if (req.user.role === "admin" && isSameSociety) {
      // allow
    } else if (req.user.role === "resident" && isOwner) {
      // allow
    } else if (req.user.role === "maintenance" && isAssigned) {
      // allow
    } else {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    await Complaint.findByIdAndDelete(complaint._id);
    res.json({ success: true, message: "Complaint deleted" });
  } catch (err) {
    next(err);
  }
};