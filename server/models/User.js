const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          // BUBT institutional email validation
          const bubtEmailRegex =
            /^[0-9]{11}@(cse|bba|eee|txt|mcn|llb|eng)\.bubt\.edu\.bd$/;
          return bubtEmailRegex.test(email);
        },
        message:
          "Please use your BUBT institutional email (format: studentId@department.bubt.edu.bd)",
      },
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "moderator", "admin"],
      default: "student",
    },
    department: { type: String, required: true },
    studentId: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (studentId) {
          // Student ID should be 11 digits
          return /^[0-9]{11}$/.test(studentId);
        },
        message: "Student ID must be exactly 11 digits",
      },
    },
    gender: { type: String, enum: ["male", "female", "other"] },
    section: { type: Number, required: true },
    intake: { type: String },
    profilePicUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
