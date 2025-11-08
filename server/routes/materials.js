const express = require("express");
const Material = require("../models/Material");
const Course = require("../models/Course");
const { authMiddleware, moderatorOrAdmin } = require("../middleware/auth");
const { createGridFSUpload, getGridFSBucket } = require("../config/gridfs");
const { ObjectId } = require("mongodb");
const router = express.Router();

// Configure GridFS upload
const upload = createGridFSUpload();

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
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, courseId } = req.body;
      const file = req.file;

      if (!title || !courseId) {
        return res
          .status(400)
          .json({ message: "Title and course are required" });
      }

      if (!file) {
        return res.status(400).json({ message: "PDF file is required" });
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
        fileId: file.id, // GridFS file ID
        originalName: file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: "pending",
      });

      await material.save();
      await material.populate(["course", "uploader"]);

      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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

// GET /api/materials/file/:fileId - Download file from GridFS
router.get("/file/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const bucket = getGridFSBucket();

    // Find file info
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = files[0];

    // Set appropriate headers
    res.set("Content-Type", file.contentType || "application/pdf");
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);

    // Stream file from GridFS
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

    downloadStream.on("error", (error) => {
      res.status(404).json({ message: "File not found" });
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/materials/:id/download - Download material file by material ID
router.get("/:id/download", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Update download count
    material.downloadCount += 1;
    await material.save();

    // Redirect to file download
    res.redirect(`/api/materials/file/${material.fileId}`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/materials/:id - Delete a material (uploader or admin/moderator only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    console.log("Delete request for material ID:", req.params.id);
    console.log("User requesting delete:", req.user.id, req.user.email);

    const material = await Material.findById(req.params.id).populate(
      "uploader"
    );

    if (!material) {
      console.log("Material not found:", req.params.id);
      return res.status(404).json({ message: "Material not found" });
    }

    console.log(
      "Material found:",
      material.title,
      "Uploader:",
      material.uploader._id
    );

    // Check if user can delete (owner, admin, or moderator)
    const canDelete =
      material.uploader._id.toString() === req.user.id.toString() ||
      req.user.role === "admin" ||
      req.user.role === "moderator";

    console.log("Permission check:");
    console.log("- Material uploader ID:", material.uploader._id.toString());
    console.log("- Current user ID:", req.user.id.toString());
    console.log("- User role:", req.user.role);
    console.log("- Can delete:", canDelete);

    if (!canDelete) {
      return res.status(403).json({
        message: "Access denied. You can only delete your own materials.",
      });
    }

    // Delete file from GridFS if it exists
    if (material.fileId) {
      try {
        const bucket = getGridFSBucket();
        await bucket.delete(new ObjectId(material.fileId));
      } catch (error) {
        console.error("Error deleting file from GridFS:", error);
        // Continue with material deletion even if file deletion fails
      }
    }

    // Delete material from database
    console.log("Deleting material from database:", req.params.id);
    const beforeCount = await Material.countDocuments();
    console.log("Materials count before delete:", beforeCount);

    const deletedMaterial = await Material.findByIdAndDelete(req.params.id);
    console.log("Material deleted:", deletedMaterial ? "Yes" : "No");

    const afterCount = await Material.countDocuments();
    console.log("Materials count after delete:", afterCount);

    res.json({ message: "Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
