const { getRedis } = require("../config/redis");

const OTP_TTL = Number(process.env.OTP_TTL) || 300; // 5 minutes

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const storeOtp = async (key, otp) => {
  const redis = getRedis();
  await redis.set(`otp:${key}`, otp, "EX", OTP_TTL);
};

const verifyOtp = async (key, candidate) => {
  const redis = getRedis();
  const stored = await redis.get(`otp:${key}`);
  if (!stored) return { valid: false, reason: "OTP expired or not found" };
  if (stored !== candidate) return { valid: false, reason: "Incorrect OTP" };
  await redis.del(`otp:${key}`); // one-time use
  return { valid: true };
};

module.exports = { generateOtp, storeOtp, verifyOtp };