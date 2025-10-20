const express = require("express");
const Material = require("../models/Material");
const Course = require("../models/Course");
const { authMiddleware, moderatorOrAdmin } = require("../middleware/auth");
const router = express.Router();

// GET /api/materials - Get materials (filter by course, status, uploader)
router.get("/", async (req, res) => {
  try {
    const { courseId, status, uploaderId } = req.query;
    let filter = {};

    if (courseId) filter.course = courseId;
    if (status) filter.status = status;
    if (uploaderId) filter.uploader = uploaderId;

    const materials = await Material.find(filter)
      .populate("course", "name code")
      .populate("uploader", "name email")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/materials/upload - Upload new material (authenticated users)
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { title, courseId, pdfDataUrl } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ message: "Title and course are required" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const material = new Material({
      title: title.trim(),
      course: courseId,
      uploader: req.user.id,
      fileUrl: pdfDataUrl || "", // Store data URL temporarily
      originalName: `${title.trim()}.pdf`,
      fileSize: pdfDataUrl ? pdfDataUrl.length : 0,
      status: "pending",
    });

    await material.save();
    await material.populate(["course", "uploader"]);

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/materials/:id/status - Update material status (moderator/admin only)
router.patch(
  "/:id/status",
  authMiddleware,
  moderatorOrAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["pending", "approved", "denied"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const material = await Material.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate(["course", "uploader"]);

      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.json(material);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
