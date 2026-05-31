const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../module/User");
const Society = require("../module/Society");

const resolveSocietyId = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) return identifier;
  const society = await Society.findOne({ externalId: identifier }).select("_id");
  return society?._id?.toString() || null;
};

// ── Verify access token ───────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return res.status(401).json({ success: false, message: "No token provided" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).populate("society").select("+refreshTokenHash");
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: "Account not found or deactivated" });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ success: false, message: "Token expired", code: "TOKEN_EXPIRED" });
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ── Role gate ────────────────────────────────────────────────────────────────
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorised for this action`,
    });
  next();
};

// ── Same-society gate ─────────────────────────────────────────────────────────
// Ensures req.user belongs to the society referenced in req.params.id or req.body.society
exports.sameSociety = async (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  if (req.user.role === "super_admin") {
    return next();
  }

  const societyIdentifier = req.params.societyId || req.params.id || req.body.society;
  const resolvedSocietyId = await resolveSocietyId(societyIdentifier);

  if (!resolvedSocietyId || req.user.society?.toString() !== resolvedSocietyId) {
    return res.status(403).json({ success: false, message: "Access restricted to your own society" });
  }
  next();
};