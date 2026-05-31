const mongoose = require("mongoose");
const MaintenanceBill = require("../module/MaintenanceBill");
const User = require("../module/User");
const Society = require("../module/Society");
const { toSociety, toUser } = require("../utils/socket");
const { sendMaintenanceInvoice } = require("../utils/mailer");

// ── GET /api/maintenance/bills ────────────────────────────────────────────────
exports.getBills = async (req, res, next) => {
  try {
    const { month, status, page = 1, limit = 20, societyId } = req.query;
    const filter = {};
    if (req.user.role !== "super_admin") {
      filter.society = req.user.society;
    } else if (societyId) {
      filter.society = societyId;
    }

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

// ── POST /api/maintenance/bills ───────────────────────────────────────────────
exports.createBill = async (req, res, next) => {
  try {
    const { type, amount, dueDate, societyId, residentId, status, notes, billingMonth } = req.body;
    let society = null;
    if (req.user.role === "super_admin" && societyId) {
      society = mongoose.Types.ObjectId.isValid(societyId)
        ? await Society.findById(societyId)
        : await Society.findOne({ externalId: societyId });
    } else {
      society = await Society.findById(req.user.society);
    }

    if (!society) return res.status(404).json({ success: false, message: "Society not found" });

    const residentFilter = { society: society._id };
    if (mongoose.Types.ObjectId.isValid(residentId)) {
      residentFilter._id = residentId;
    } else {
      residentFilter.externalId = residentId;
    }
    const resident = await User.findOne(residentFilter);
    if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });

    const statusMap = {
      unpaid: "pending",
      pending: "pending",
      paid: "paid",
      overdue: "overdue",
      waived: "waived",
    };
    const normalizedStatus = statusMap[(status || "pending").toString().toLowerCase()] || "pending";

    const bill = await MaintenanceBill.create({
      society: society._id,
      resident: resident._id,
      type: type || "Maintenance",
      amount: Number(amount) || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: normalizedStatus,
      billingMonth: billingMonth || (dueDate ? new Date(dueDate).toISOString().slice(0, 7) : undefined),
      totalDue: Number(amount) || 0,
      notes: notes || "",
    });

    toSociety(society._id.toString(), "new_bill", { bill });
    res.status(201).json({ success: true, bill });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/maintenance/bills/generate ─────────────────────────────────────
// Admin: manually trigger invoice generation for a billing month
exports.generateBills = async (req, res, next) => {
  try {
    const { billingMonth, dueDate, societyId } = req.body; // "2025-07", Date
    let society = null;
    if (req.user.role === "super_admin" && societyId) {
      society = mongoose.Types.ObjectId.isValid(societyId)
        ? await Society.findById(societyId)
        : await Society.findOne({ externalId: societyId });
    } else {
      society = await Society.findById(req.user.society);
    }
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

// ── PATCH /api/maintenance/bills/:id ──────────────────────────────────────────
exports.updateBill = async (req, res, next) => {
  try {
    const bill = await MaintenanceBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    if (req.user.role !== "super_admin") {
      if (String(bill.society) !== String(req.user.society))
        return res.status(403).json({ success: false, message: "Not authorised" });
      if (req.user.role !== "admin")
        return res.status(403).json({ success: false, message: "Not authorised" });
    }

    const allowed = ["type", "amount", "dueDate", "status", "notes"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.amount) updates.amount = Number(updates.amount);
    if (updates.amount) updates.totalDue = updates.amount;
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const statusMap = {
      unpaid: "pending", pending: "pending", paid: "paid",
      overdue: "overdue", waived: "waived",
    };
    if (updates.status) updates.status = statusMap[updates.status.toLowerCase()] || updates.status;

    const updated = await MaintenanceBill.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, bill: updated });
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
    const { month, societyId } = req.query;
    const match = {};
    if (req.user.role !== "super_admin") {
      match.society = req.user.society;
    } else if (societyId) {
      match.society = new mongoose.Types.ObjectId(societyId);
    }
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

// ── DELETE /api/maintenance/bills/:id ────────────────────────────────────────
exports.deleteBill = async (req, res, next) => {
  try {
    const id = req.params.id;
    let bill = null;
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(id)) bill = await MaintenanceBill.findById(id);
    if (!bill) bill = await MaintenanceBill.findOne({ externalId: id });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    // Admins can delete within their society, super_admin can delete any
    if (req.user.role !== "super_admin") {
      if (String(bill.society) !== String(req.user.society)) return res.status(403).json({ success: false, message: "Not authorised" });
      if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Not authorised" });
    }

    await MaintenanceBill.findByIdAndDelete(bill._id);
    res.json({ success: true, message: "Bill deleted" });
  } catch (err) {
    next(err);
  }
};