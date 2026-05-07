const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: `"SocietySphere" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (err) {
    console.error("Mail error:", err.message);
    // Non-fatal — log and continue
  }
};

// ── Templated helpers ─────────────────────────────────────────────────────────

exports.sendOtp = (email, otp) =>
  sendMail({
    to: email,
    subject: "Your SocietySphere OTP",
    html: `<p>Your one-time password is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });

exports.sendWelcome = (email, name, societyName) =>
  sendMail({
    to: email,
    subject: `Welcome to ${societyName} on SocietySphere!`,
    html: `<p>Hi ${name},</p><p>Your account is ready. Log in at <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a>.</p>`,
  });

exports.sendMaintenanceInvoice = (email, name, bill) =>
  sendMail({
    to: email,
    subject: `Maintenance Invoice — ${bill.billingMonth}`,
    html: `
      <p>Hi ${name},</p>
      <p>Your maintenance invoice for <strong>${bill.billingMonth}</strong> is ready.</p>
      <p>Amount Due: ₹${bill.totalDue}<br>Due Date: ${bill.dueDate.toDateString()}</p>
      <p>Invoice #: ${bill.invoiceNumber}</p>
      <p>Please pay via your SocietySphere dashboard.</p>`,
  });

exports.sendMaintenanceReminder = (email, name, bill) =>
  sendMail({
    to: email,
    subject: `Reminder: Maintenance due — ${bill.billingMonth}`,
    html: `<p>Hi ${name}, your maintenance of ₹${bill.totalDue} for ${bill.billingMonth} is still pending. Please pay before ${bill.dueDate.toDateString()} to avoid late fees.</p>`,
  });

exports.sendEmergencyAlert = (emails, alert) =>
  sendMail({
    to: emails.join(","),
    subject: `🚨 EMERGENCY ALERT — ${alert.type.toUpperCase()}`,
    html: `<p><strong>Emergency at your society!</strong></p>
           <p>Type: ${alert.type}</p>
           <p>${alert.description || ""}</p>
           <p>Please check the SocietySphere app immediately.</p>`,
  });

exports.sendMail = sendMail;