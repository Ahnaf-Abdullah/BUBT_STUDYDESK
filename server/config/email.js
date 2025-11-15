const nodemailer = require("nodemailer");

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: "gmail", // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.log("⚠️ Email configuration error:", error.message);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

module.exports = transporter;
