const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const getJwtSecret = (name) => {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`Environment variable ${name} is required for JWT signing`);
  }
  return secret;
};

const signAccess = (user) =>
  jwt.sign({ 
    id: user._id,
    role: user.role,
    societyId: user.society?._id || user.society || null
  }, getJwtSecret("JWT_SECRET"), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const signRefresh = (user) =>
  jwt.sign({ 
    id: user._id,
    role: user.role,
    societyId: user.society?._id || user.society || null
  }, getJwtSecret("JWT_REFRESH_SECRET"), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });

const hashToken = (token) => bcrypt.hash(token, 8);
const compareToken = (raw, hashed) => bcrypt.compare(raw, hashed);

const sendTokens = async (user, statusCode, res) => {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  // Persist hashed refresh token on user
  user.refreshTokenHash = await hashToken(refreshToken);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    token: accessToken,
    accessToken,
    refreshToken,
    user: user.toPublic(),
  });
};

module.exports = { signAccess, signRefresh, hashToken, compareToken, sendTokens };