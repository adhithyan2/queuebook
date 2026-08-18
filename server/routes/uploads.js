const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { saveUpload, deleteUpload } = require('../services/storageService');

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a JPG, PNG, WEBP or GIF image.'));
    }
  },
});

// POST /api/uploads  (multipart field name: "image")
router.post('/', protect, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Maximum size is 5 MB.'
        : err.message || 'Image upload failed. Please try again.';
      return res.status(400).json({ message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image was selected.' });
      }
      const result = await saveUpload(req.file);
      res.status(201).json({ url: result.url, message: 'Image uploaded successfully' });
    } catch (error) {
      next(error);
    }
  });
});

// POST /api/uploads/delete  { url } — remove an uploaded asset
router.post('/delete', protect, async (req, res, next) => {
  try {
    await deleteUpload(req.body?.url);
    res.json({ message: 'Image removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
