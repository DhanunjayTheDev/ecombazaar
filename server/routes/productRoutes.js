const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, getAllProductsAdmin, addReview, getCategories,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'reviewImages' ? 'review' : 'product';
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random()*1e6)}${path.extname(file.originalname)}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  cb(allowed.test(path.extname(file.originalname).toLowerCase()) ? null : new Error('Only image files allowed'), 
     allowed.test(path.extname(file.originalname).toLowerCase()));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/categories', getCategories);
router.get('/admin/all', protect, adminOnly, getAllProductsAdmin);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/review', protect, upload.array('reviewImages', 4), addReview);

module.exports = router;
