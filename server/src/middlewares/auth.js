const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Verify access token ───────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return res.status(401).json({ success: false, message: "No token provided" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+refreshTokenHash");
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
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorised for this action`,
    });
  next();
};

// ── Same-society gate ─────────────────────────────────────────────────────────
// Ensures req.user belongs to the society referenced in req.params.societyId
exports.sameSociety = (req, res, next) => {
  const societyId = req.params.societyId || req.body.society;
  if (
    req.user.role !== "super_admin" &&
    req.user.society?.toString() !== societyId?.toString()
  ) {
    return res.status(403).json({ success: false, message: "Access restricted to your own society" });
  }
  next();
};