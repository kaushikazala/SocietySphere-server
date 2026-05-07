const Event = require("../models/Event");
const { toSociety } = require("../utils/socket");

exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({
      ...req.body,
      society: req.user.society,
      createdBy: req.user._id,
    });
    toSociety(req.user.society.toString(), "new_event", { event });
    res.status(201).json({ success: true, event });
  } catch (err) { next(err); }
};

exports.getEvents = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { society: req.user.society };
    if (status) filter.status = status;

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate("createdBy", "name role")
      .sort({ eventDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, events });
  } catch (err) { next(err); }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("rsvps.user", "name flatNumber");
    if (!event) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

exports.rsvp = async (req, res, next) => {
  try {
    const { status } = req.body; // "going" | "not_going" | "maybe"
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Not found" });

    const existing = event.rsvps.find((r) => r.user.toString() === req.user._id.toString());
    if (existing) {
      existing.status = status;
      existing.respondedAt = new Date();
    } else {
      if (event.capacity && event.rsvps.filter(r => r.status === "going").length >= event.capacity)
        return res.status(400).json({ success: false, message: "Event is at full capacity" });
      event.rsvps.push({ user: req.user._id, status });
    }

    await event.save();
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!event) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

exports.votePoll = async (req, res, next) => {
  try {
    const { pollIndex, optionIndex } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Not found" });

    const poll = event.polls[pollIndex];
    if (!poll) return res.status(400).json({ success: false, message: "Poll not found" });
    if (poll.closesAt && new Date() > poll.closesAt)
      return res.status(400).json({ success: false, message: "Poll closed" });

    // Remove any existing votes by this user across all options in the poll
    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== req.user._id.toString());
    });
    poll.options[optionIndex].votes.push(req.user._id);

    await event.save();
    res.json({ success: true, poll });
  } catch (err) { next(err); }
};