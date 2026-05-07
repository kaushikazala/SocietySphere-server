const QRCode = require("qrcode");

/**
 * Generate a QR code as a base64 data-URL for a visitor token.
 * @param {string} token  The visitor's unique qrToken
 * @returns {Promise<string>} data:image/png;base64,…
 */
const generateVisitorQR = async (token) => {
  const payload = JSON.stringify({
    type: "societysphere_visitor",
    token,
    ts: Date.now(),
  });
  return QRCode.toDataURL(payload, { width: 300, margin: 2 });
};

module.exports = { generateVisitorQR };