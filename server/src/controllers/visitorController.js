const Visitor = require("../models/Visitor");
const { generateVisitorQR } = require("../utils/qr");
const { toUser } = require("../utils/socket");

// ── POST /api/visitors ────────────────────────────────────────────────────────
exports.createVisitor = async (req, res, next) => {
  try {
    const { name, phone, purpose, vehicleNumber, expectedDate, validFrom, validUntil } = req.body;

    const visitor = await Visitor.create({
      society: req.user.society,
      host: req.user._id,
      name, phone, purpose, vehicleNumber, expectedDate, validFrom, validUntil,
      passType: "pre-approved",
      status: "approved",        // self-approved by resident on creation
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    // Generate QR
    visitor.qrImage = await generateVisitorQR(visitor.qrToken);
    await visitor.save();

    // TODO: send WhatsApp / SMS with QR to visitor phone
    res.status(201).json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/visitors ─────────────────────────────────────────────────────────
exports.getVisitors = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, date } = req.query;
    const filter = { society: req.user.society };

    if (["resident"].includes(req.user.role)) filter.host = req.user._id;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      filter.expectedDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const total = await Visitor.countDocuments(filter);
    const visitors = await Visitor.find(filter)
      .populate("host", "name flatNumber wing")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, visitors });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/visitors/scan/:token ─────────────────────────────────────────────
exports.scanQR = async (req, res, next) => {
  try {
    const visitor = await Visitor.findOne({ qrToken: req.params.token })
      .populate("host", "name flatNumber wing phone");
    if (!visitor) return res.status(404).json({ success: false, message: "Invalid QR code" });

    res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/visitors/:id/entry ─────────────────────────────────────────────
exports.logEntry = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: "Not found" });
    if (visitor.status !== "approved")
      return res.status(400).json({ success: false, message: "Visitor not approved" });

    visitor.entryTime = new Date();
    visitor.loggedBy = req.user._id;
    await visitor.save();

    // Notify host
    toUser(visitor.host.toString(), "visitor_entry", {
      visitorName: visitor.name,
      entryTime: visitor.entryTime,
    });

    res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/visitors/:id/exit ──────────────────────────────────────────────
exports.logExit = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: "Not found" });

    visitor.exitTime = new Date();
    visitor.loggedBy = req.user._id;
    await visitor.save();

    res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/visitors/:id/approve ──────────────────────────────────────────
exports.approveWalkIn = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: "Not found" });

    visitor.status = req.body.approved ? "approved" : "denied";
    visitor.approvedBy = req.user._id;
    visitor.approvedAt = new Date();
    if (!req.body.approved) visitor.denialReason = req.body.reason;
    await visitor.save();

    res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/visitors/walk-in ────────────────────────────────────────────────
// Guard logs an unannounced visitor and requests host approval
exports.walkIn = async (req, res, next) => {
  try {
    const { name, phone, purpose, vehicleNumber, hostFlatNumber } = req.body;
    const User = require("../models/User");

    // Find host by flatNumber in same society
    const host = await User.findOne({
      society: req.user.society,
      flatNumber: hostFlatNumber,
      role: "resident",
    });
    if (!host) return res.status(404).json({ success: false, message: "Resident flat not found" });

    const visitor = await Visitor.create({
      society: req.user.society,
      host: host._id,
      name, phone, purpose, vehicleNumber,
      passType: "walk-in",
      status: "pending",
      loggedBy: req.user._id,
    });

    // Notify resident to approve
    toUser(host._id.toString(), "walk_in_approval_request", {
      visitorId: visitor._id,
      visitorName: visitor.name,
    });

    res.status(201).json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/visitors/:id/blacklist ────────────────────────────────────────
exports.blacklist = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status: "blacklisted", notes: req.body.reason },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};