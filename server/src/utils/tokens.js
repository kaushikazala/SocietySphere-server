const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const signAccess = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const signRefresh = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });

const hashToken = (token) => bcrypt.hash(token, 8);
const compareToken = (raw, hashed) => bcrypt.compare(raw, hashed);

const sendTokens = async (user, statusCode, res) => {
  const accessToken = signAccess(user._id);
  const refreshToken = signRefresh(user._id);

  // Persist hashed refresh token on user
  user.refreshTokenHash = await hashToken(refreshToken);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: user.toPublic(),
  });
};

module.exports = { signAccess, signRefresh, hashToken, compareToken, sendTokens };