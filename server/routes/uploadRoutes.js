const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { protect } = require('../middleware/authMiddleware');

// Use memory storage so we can stream directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(file.mimetype) || allowed.test(file.originalname.toLowerCase());
    cb(ok ? null : new Error('Only JPG, PNG and WebP images are allowed'), ok);
  },
});

// POST /api/upload  — upload a single image, returns Cloudinary URL
router.post('/', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'ecombazaar', resource_type: 'image' },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
