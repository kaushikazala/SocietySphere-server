const Document = require("../models/Document");
const { makeUploader } = require("../config/cloudinary");

const uploader = makeUploader("documents", ["pdf", "doc", "docx", "jpg", "png", "xlsx"]);

exports.uploadMiddleware = uploader.single("file");

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const { name, description, category, accessLevel, tags } = req.body;

    const doc = await Document.create({
      society: req.user.society,
      uploadedBy: req.user._id,
      name: name || req.file.originalname,
      description,
      category,
      accessLevel,
      tags: tags ? JSON.parse(tags) : [],
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      cloudinaryId: req.file.filename,
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = { society: req.user.society, isArchived: false };

    // Non-admins only see resident-accessible documents
    if (!["admin", "super_admin"].includes(req.user.role)) {
      filter.accessLevel = "all_residents";
    }
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const total = await Document.countDocuments(filter);
    const documents = await Document.find(filter)
      .populate("uploadedBy", "name role")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, documents });
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    await Document.findByIdAndUpdate(req.params.id, { isArchived: true });
    res.json({ success: true, message: "Document archived" });
  } catch (err) {
    next(err);
  }
};