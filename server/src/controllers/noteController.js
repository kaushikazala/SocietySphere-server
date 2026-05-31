const Note = require("../module/Note");
const mongoose = require("mongoose");

// ── GET /api/notes ────────────────────────────────────────────────────────────
exports.getNotes = async (req, res, next) => {
  try {
    const { societyId } = req.query;
    const filter = {};

    if (req.user.role === "super_admin") {
      if (societyId) {
        filter.society = societyId;
      }
    } else if (req.user.role === "admin") {
      filter.society = req.user.society;
    } else {
      // Residents, guards, maintenance only see their own personal notes
      filter.createdBy = req.user._id;
    }

    const notes = await Note.find(filter)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: notes.length, notes });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notes ───────────────────────────────────────────────────────────
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, societyId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required" });
    }

    let society = req.user.society;
    if (req.user.role === "super_admin") {
      if (!societyId) {
        return res.status(400).json({ success: false, message: "societyId is required for super_admin" });
      }
      society = societyId;
    }

    if (!society) {
      return res.status(400).json({ success: false, message: "Society context is required" });
    }

    const note = await Note.create({
      title,
      content,
      createdBy: req.user._id,
      role: req.user.role,
      society,
    });

    res.status(201).json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/notes/:id ─────────────────────────────────────────────────────────
exports.updateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Authorization: only the creator can edit their note
    if (note.createdBy.toString() !== req.user._id.toString() && req.user.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update this note" });
    }

    if (title) note.title = title;
    if (content) note.content = content;
    await note.save();

    res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notes/:id ──────────────────────────────────────────────────────
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    // Authorization: creator, society admin (if same society), or super admin can delete
    const isCreator = note.createdBy.toString() === req.user._id.toString();
    const isAdminOfSameSociety = req.user.role === "admin" && note.society.toString() === req.user.society?.toString();
    const isSuperAdmin = req.user.role === "super_admin";

    if (!isCreator && !isAdminOfSameSociety && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this note" });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    next(err);
  }
};
