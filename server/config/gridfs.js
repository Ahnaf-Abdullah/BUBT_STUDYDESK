const mongoose = require("mongoose");
const multer = require("multer");
const GridFSBucket = require("mongodb").GridFSBucket;

let bucket;

// Initialize GridFS bucket
const initGridFS = (db) => {
  bucket = new GridFSBucket(db, { bucketName: "uploads" });
  return bucket;
};

// Get GridFS bucket
const getGridFSBucket = () => {
  if (!bucket) {
    throw new Error("GridFS not initialized");
  }
  return bucket;
};

// Custom GridFS storage for multer
const gridfsStorage = {
  _handleFile: (req, file, cb) => {
    if (!bucket) {
      return cb(new Error("GridFS not initialized"));
    }

    const filename = `${Date.now()}_${file.originalname}`;
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        originalName: file.originalname,
        mimetype: file.mimetype,
      },
    });

    file.stream.pipe(uploadStream);

    uploadStream.on("error", (error) => {
      cb(error);
    });

    uploadStream.on("finish", () => {
      cb(null, {
        id: uploadStream.id,
        filename: filename,
        originalname: file.originalname,
        size: uploadStream.bytesWritten || 0,
        mimetype: file.mimetype,
      });
    });
  },

  _removeFile: (req, file, cb) => {
    if (!bucket) {
      return cb(new Error("GridFS not initialized"));
    }
    bucket.delete(file.id, cb);
  },
};

// Configure multer for GridFS
const createGridFSUpload = () => {
  return multer({
    storage: gridfsStorage,
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== "application/pdf") {
        return cb(new Error("Only PDF files are allowed"), false);
      }
      cb(null, true);
    },
  });
};

module.exports = {
  initGridFS,
  getGridFSBucket,
  createGridFSUpload,
};
