const express = require("express");
const Course = require("../models/Course");
const Department = require("../models/Department");
const { authMiddleware, moderatorOrAdmin } = require("../middleware/auth");
const router = express.Router();

// GET /api/courses - Get all courses (optionally filter by department)
router.get("/", async (req, res) => {
  try {
    const { departmentId } = req.query;
    let filter = { isActive: true };

    if (departmentId) {
      filter.department = departmentId;
    }

    const courses = await Course.find(filter)
      .populate("department", "name code")
      .sort({ name: 1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/courses - Create new course (admin/moderator only)
router.post("/", authMiddleware, moderatorOrAdmin, async (req, res) => {
  try {
    const { name, code, departmentId } = req.body;

    if (!name || !code || !departmentId) {
      return res
        .status(400)
        .json({ message: "Name, code, and department are required" });
    }

    // Check if course code already exists
    const existing = await Course.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const course = new Course({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      department: departmentId,
    });

    await course.save();
    await course.populate("department", "name code");

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
