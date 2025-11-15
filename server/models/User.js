const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "moderator", "admin"],
      default: "student",
    },
    department: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
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
