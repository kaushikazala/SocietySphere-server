const Complaint = require("../models/Complaint");
const { toUser, toSociety } = require("../utils/socket");

// ── POST /api/complaints ──────────────────────────────────────────────────────
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority, attachments } = req.body;
    const complaint = await Complaint.create({
      society: req.user.society,
      raisedBy: req.user._id,
      title, description, category, priority, attachments,
    });

    toSociety(req.user.society.toString(), "new_complaint", { complaint });
    res.status(201).json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/complaints ───────────────────────────────────────────────────────
exports.getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const filter = { society: req.user.society };

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