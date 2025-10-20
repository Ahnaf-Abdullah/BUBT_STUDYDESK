const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Department = require("./models/Department");
const Course = require("./models/Course");
require("dotenv").config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: "admin@bubt.edu" },
        { role: "admin" },
        { studentId: "ADMIN001" },
      ],
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Student ID: ${existingAdmin.studentId}`);
      console.log(`   Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Create admin user
    const adminPassword = "Admin@123"; // Strong password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = new User({
      name: "System Administrator",
      email: "admin@bubt.edu",
      password: hashedPassword,
      role: "admin",
      department: "Administration",
      studentId: "ADMIN001",
      gender: "other",
      section: 1,
      intake: "N/A",
      profilePicUrl: "",
      isActive: true,
    });

    await adminUser.save();

    console.log("🎉 Admin user created successfully!");
    console.log("=================================");
    console.log("📧 Email: admin@bubt.edu");
    console.log("🔑 Password: Admin@123");
    console.log("👤 Name: System Administrator");
    console.log("🆔 Student ID: ADMIN001");
    console.log("🔐 Role: admin");
    console.log("=================================");
    console.log("You can now login with these credentials!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
}

// Run the script
createAdmin();
