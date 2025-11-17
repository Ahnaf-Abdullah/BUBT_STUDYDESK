const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const transporter = require("../config/email");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      studentId,
      gender,
      section,
      intake,
      profilePicUrl,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !studentId || !section) {
      return res.status(400).json({
        message: "Name, email, password, student ID, and section are required",
      });
    }

    // BUBT email validation
    const bubtEmailRegex =
      /^[0-9]{11}@(cse|bba|eee|txt|mcn|llb|eng)\.bubt\.edu\.bd$/i;
    if (!bubtEmailRegex.test(email)) {
      return res.status(400).json({
        message:
          "Please use your BUBT institutional email. Format: studentId@department.bubt.edu.bd (Departments: CSE, BBA, EEE, TXT, MCN, LLB, ENG)",
      });
    }

    // Extract student ID from email for validation
    const emailStudentId = email.toLowerCase().split("@")[0];
    if (emailStudentId !== studentId) {
      return res.status(400).json({
        message: "Student ID must match the ID in your email address",
      });
    }

    // Extract department from email
    const emailDepartment = email
      .toLowerCase()
      .split("@")[1]
      .split(".")[0]
      .toUpperCase();
    const departmentMapping = {
      CSE: "Computer Science & Engineering",
      BBA: "Business Administration",
      EEE: "Electrical & Electronic Engineering",
      TXT: "Textile Engineering",
      MCN: "Mechanical Engineering",
      LLB: "Law",
      ENG: "English",
    };

    // Validate department consistency
    if (!departmentMapping[emailDepartment]) {
      return res.status(400).json({
        message: "Invalid department in email address",
      });
    }

    // Auto-set department based on email
    const validatedDepartment = departmentMapping[emailDepartment];

    // Student ID validation (11 digits)
    if (!/^[0-9]{11}$/.test(studentId)) {
      return res.status(400).json({
        message: "Student ID must be exactly 11 digits",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { studentId }],
    });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existingUser.studentId === studentId) {
        return res
          .status(400)
          .json({ message: "Student ID already registered" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with validated data
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      department: validatedDepartment, // Use mapped department name
      studentId,
      gender: gender || "other",
      section,
      intake: intake || "N/A",
      profilePicUrl: profilePicUrl || "img/1.png",
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        gender: user.gender,
        section: user.section,
        intake: user.intake,
        profilePicUrl: user.profilePicUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        gender: user.gender,
        section: user.section,
        intake: user.intake,
        profilePicUrl: user.profilePicUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Send reset email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate BUBT email format
    const bubtEmailRegex =
      /^[0-9]{11}@(cse|bba|eee|txt|mcn|llb|eng)\.bubt\.edu\.bd$/i;
    if (!bubtEmailRegex.test(email)) {
      return res.status(400).json({
        message: "Please use your BUBT institutional email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res
        .status(200)
        .json({ message: "If the email exists, a reset link has been sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetURL = `${
      process.env.FRONTEND_URL || "http://localhost:5000"
    }?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "BUBT Study Desk - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset for your BUBT Study Desk account.</p>
          <p>Click the button below to reset your password (link expires in 1 hour):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #6B7280;">${resetURL}</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px;">BUBT Study Desk - Material Sharing Platform</p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send reset email" });
  }
});

// Verify Reset Token
router.post("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
