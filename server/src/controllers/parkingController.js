const { ParkingSlot, ParkingViolation } = require("../models/Parking");

exports.getSlots = async (req, res, next) => {
  try {
    const { status, level } = req.query;
    const filter = { society: req.user.society };
    if (status) filter.status = status;
    if (level) filter.level = level;

    const slots = await ParkingSlot.find(filter)
      .populate("assignedTo", "name flatNumber vehicleNumber");
    res.json({ success: true, slots });
  } catch (err) { next(err); }
};

exports.createSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.create({ ...req.body, society: req.user.society });
    res.status(201).json({ success: true, slot });
  } catch (err) { next(err); }
};

exports.assignSlot = async (req, res, next) => {
  try {
    const { userId, vehicleNumber } = req.body;
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      { assignedTo: userId, vehicleNumber, assignedAt: new Date(), status: "occupied" },
      { new: true }
    );
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
    res.json({ success: true, slot });
  } catch (err) { next(err); }
};

exports.requestVisitorSlot = async (req, res, next) => {
  try {
    const { visitorId, from, until } = req.body;
    const slot = await ParkingSlot.findOne({
      society: req.user.society,
      status: "available",
    });
    if (!slot) return res.status(400).json({ success: false, message: "No available slots" });

    slot.temporaryAssignment = { visitor: visitorId, requestedBy: req.user._id, from, until };
    slot.status = "reserved";
    await slot.save();
    res.json({ success: true, slot });
  } catch (err) { next(err); }
};

exports.reportViolation = async (req, res, next) => {
  try {
    const violation = await ParkingViolation.create({
      ...req.body,
      society: req.user.society,
      reportedBy: req.user._id,
    });
    res.status(201).json({ success: true, violation });
  } catch (err) { next(err); }
};

exports.getViolations = async (req, res, next) => {
  try {
    const violations = await ParkingViolation.find({ society: req.user.society })
      .populate("reportedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, violations });
  } catch (err) { next(err); }
};