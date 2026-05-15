const MaintenanceBill = require("../module/MaintenanceBill");
const User = require("../module/User");
const Society = require("../module/Society");
const { toSociety, toUser } = require("../utils/socket");
const { sendMaintenanceInvoice } = require("../utils/mailer");

// ── GET /api/maintenance/bills ────────────────────────────────────────────────
exports.getBills = async (req, res, next) => {
  try {
    const { month, status, page = 1, limit = 20 } = req.query;
    const filter = { society: req.user.society };

    // Residents see only their own bills
    if (req.user.role === "resident") filter.resident = req.user._id;
    if (month) filter.billingMonth = month;
    if (status) filter.status = status;

    const total = await MaintenanceBill.countDocuments(filter);
    const bills = await MaintenanceBill.find(filter)
      .populate("resident", "name flatNumber wing")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), bills });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/maintenance/bills/:id ────────────────────────────────────────────
exports.getBill = async (req, res, next) => {
  try {
    const bill = await MaintenanceBill.findById(req.params.id)
      .populate("resident", "name email flatNumber wing");
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    // Residents can only see their own
    if (req.user.role === "resident" && bill.resident._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorised" });

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/maintenance/bills/generate ─────────────────────────────────────
// Admin: manually trigger invoice generation for a billing month
exports.generateBills = async (req, res, next) => {
  try {
    const { billingMonth, dueDate } = req.body; // "2025-07", Date
    const society = await Society.findById(req.user.society);
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });

    const residents = await User.find({ society: society._id, role: "resident", isActive: true });

    const bills = [];
    for (const resident of residents) {
      // Determine amount by unit type (defaulting to first configured amount or 0)
      const unitTypeMatch = society.billing.maintenanceAmounts.find(
        (m) => m.unitType === resident.unitType
      );
      const amount = unitTypeMatch?.amount ?? (society.billing.maintenanceAmounts[0]?.amount || 0);

      const existing = await MaintenanceBill.findOne({
        society: society._id,
        resident: resident._id,
        billingMonth,
      });
      if (existing) continue; // skip already generated

      const bill = await MaintenanceBill.create({
        society: society._id,
        resident: resident._id,
        billingMonth,
        amount,
        totalDue: amount,
        dueDate: new Date(dueDate),
      });

      bills.push(bill);
      sendMaintenanceInvoice(resident.email, resident.name, bill).catch(() => {});
      toUser(resident._id.toString(), "new_invoice", { bill });
    }

    res.status(201).json({ success: true, generated: bills.length, bills });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/maintenance/bills/:id/pay ───────────────────────────────────────
exports.recordPayment = async (req, res, next) => {
  try {
    const { method, transactionId, gateway } = req.body;
    const bill = await MaintenanceBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    if (bill.status === "paid")
      return res.status(400).json({ success: false, message: "Already paid" });

    bill.status = "paid";
    bill.payment = { method, transactionId, gateway, paidAt: new Date() };
    await bill.save();

    toSociety(bill.society.toString(), "payment_received", {
      billId: bill._id,
      residentId: bill.resident,
      amount: bill.totalDue,
    });

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/maintenance/bills/:id/waive ────────────────────────────────────
exports.waiveBill = async (req, res, next) => {
  try {
    const bill = await MaintenanceBill.findByIdAndUpdate(
      req.params.id,
      { status: "waived", notes: req.body.reason },
      { new: true }
    );
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/maintenance/summary ──────────────────────────────────────────────
exports.getSummary = async (req, res, next) => {
  try {
    const { month } = req.query;
    const match = { society: req.user.society };
    if (month) match.billingMonth = month;

    const agg = await MaintenanceBill.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$totalDue" },
        },
      },
    ]);

    res.json({ success: true, summary: agg });
  } catch (err) {
    next(err);
  }
};