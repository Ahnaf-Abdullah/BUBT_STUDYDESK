const express = require("express");
const Department = require("../models/Department");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const router = express.Router();

// GET /api/departments - Get all departments
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({
      name: 1,
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/departments - Create new department (admin only)
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    // Check if department already exists
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const department = new Department({
      name: name.trim(),
      code: code || name.trim().toUpperCase().substring(0, 3),
    });

    await department.save();
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
