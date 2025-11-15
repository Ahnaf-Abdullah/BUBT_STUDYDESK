const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function updateAdminProfile() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Update admin user profile picture
    const result = await User.updateOne(
      { email: "admin@bubt.edu" },
      { $set: { profilePicUrl: "img/1.png" } }
    );

    console.log("📸 Admin profile picture updated:", result);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating admin profile:", error.message);
    process.exit(1);
  }
}

updateAdminProfile();
