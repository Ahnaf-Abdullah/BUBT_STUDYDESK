const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Department = require("./models/Department");
const Course = require("./models/Course");
const Material = require("./models/Material");
require("dotenv").config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Material.deleteMany({});

    // Create departments
    console.log("📚 Creating departments...");
    const csDept = await Department.create({
      name: "Computer Science",
      code: "CSE",
    });
    const eeeDept = await Department.create({
      name: "Electrical Engineering",
      code: "EEE",
    });
    const baDept = await Department.create({
      name: "Business Administration",
      code: "BBA",
    });

    console.log("📖 Creating courses...");
    // Create courses
    const courses = await Course.create([
      { name: "Data Structures", code: "CSE321", department: csDept._id },
      { name: "Database Management", code: "CSE322", department: csDept._id },
      { name: "Web Programming", code: "CSE323", department: csDept._id },
      { name: "Circuit Analysis", code: "EEE101", department: eeeDept._id },
      { name: "Digital Electronics", code: "EEE201", department: eeeDept._id },
      { name: "Marketing", code: "BBA101", department: baDept._id },
    ]);

    // Create users with hashed passwords
    console.log("👥 Creating users...");
    const users = [
      {
        name: "System Administrator",
        email: "admin@bubt.edu",
        password: await bcrypt.hash("Admin@123", 12),
        role: "admin",
        department: "Computer Science",
        studentId: "ADMIN001",
        gender: "other",
        section: 1,
        intake: "N/A",
        profilePicUrl: "",
      },
      {
        name: "Ahnaf Abdullah",
        email: "ahnaf@bubt.edu",
        password: await bcrypt.hash("Ahnaf123", 12),
        role: "moderator",
        department: "Computer Science",
        studentId: "22235103204",
        gender: "male",
        section: 1,
        intake: "Spring 2022",
        profilePicUrl: "",
      },
      {
        name: "Nishi Rahman",
        email: "nishi@bubt.edu",
        password: await bcrypt.hash("Nishi123", 12),
        role: "student",
        department: "Computer Science",
        studentId: "22235103550",
        gender: "female",
        section: 1,
        intake: "Spring 2022",
        profilePicUrl: "",
      },
      {
        name: "Amra2jon Ahmed",
        email: "amra2jon@bubt.edu",
        password: await bcrypt.hash("Amra2jon123", 12),
        role: "admin",
        department: "Computer Science",
        studentId: "22235103206",
        gender: "female",
        section: 3,
        intake: "Spring 2022",
        profilePicUrl: "",
      },
    ];

    const createdUsers = await User.create(users);

    // Create some sample materials
    console.log("📄 Creating sample materials...");
    await Material.create([
      {
        title: "Data Structures Lecture Notes",
        course: courses[0]._id, // CSE321
        uploader: createdUsers[2]._id, // Nishi (student)
        status: "approved",
        fileUrl: "/uploads/sample-ds-notes.pdf",
        originalName: "data-structures-notes.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
      },
      {
        title: "Database Design Tutorial",
        course: courses[1]._id, // CSE322
        uploader: createdUsers[1]._id, // Ahnaf (moderator)
        status: "approved",
        fileUrl: "/uploads/sample-db-tutorial.pdf",
        originalName: "database-tutorial.pdf",
        fileSize: 2048000,
        mimeType: "application/pdf",
      },
      {
        title: "HTML CSS Guide",
        course: courses[2]._id, // CSE323
        uploader: createdUsers[2]._id, // Nishi (student)
        status: "pending",
        fileUrl: "/uploads/sample-web-guide.pdf",
        originalName: "html-css-guide.pdf",
        fileSize: 1536000,
        mimeType: "application/pdf",
      },
    ]);

    console.log("🎉 Database seeded successfully!");
    console.log("=================================");
    console.log("👤 ADMIN CREDENTIALS:");
    console.log("📧 Email: admin@bubt.edu");
    console.log("🔑 Password: Admin@123");
    console.log("");
    console.log("👤 MODERATOR CREDENTIALS:");
    console.log("📧 Email: ahnaf@bubt.edu");
    console.log("🔑 Password: Ahnaf123");
    console.log("");
    console.log("👤 STUDENT CREDENTIALS:");
    console.log("📧 Email: nishi@bubt.edu");
    console.log("🔑 Password: Nishi123");
    console.log("");
    console.log("👤 ADMIN #2 CREDENTIALS:");
    console.log("📧 Email: amra2jon@bubt.edu");
    console.log("🔑 Password: Amra2jon123");
    console.log("=================================");
    console.log(`✅ Created ${createdUsers.length} users`);
    console.log(`✅ Created ${courses.length} courses`);
    console.log(`✅ Created 3 departments`);
    console.log(`✅ Created 3 sample materials`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

// Run the script
seedDatabase();
