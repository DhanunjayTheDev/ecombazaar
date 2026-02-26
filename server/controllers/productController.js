const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc Get all products (with filter/sort/pagination)
// @route GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 12, inStock } = req.query;
    const query = { isActive: true };

    if (keyword) query.$text = { $search: keyword };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') query.stock = { $gt: 0 };

    const sortMap = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'rating': { rating: -1 },
      'newest': { createdAt: -1 },
      'popular': { numReviews: -1 },
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(Number(limit));

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc Get product by ID
// @route GET /api/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

// @desc Create product (Admin)
// @route POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    // Images arrive as URL strings uploaded to Cloudinary by the frontend
    const images = Array.isArray(req.body.images)
      ? req.body.images
      : req.body.images
        ? [req.body.images]
        : [];
    const { keyFeatures } = req.body;
    const parsedKeyFeatures = typeof keyFeatures === 'string' ? JSON.parse(keyFeatures) : keyFeatures || [];
    const product = await Product.create({ ...req.body, images, keyFeatures: parsedKeyFeatures });
    console.log(`✅ [PRODUCT] Created: ${product.name} (ID: ${product._id})`);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

// @desc Update product (Admin)
// @route PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

// @desc Delete product (Admin)
// @route DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

// @desc Get all products for admin (including inactive)
// @route GET /api/products/admin/all
exports.getAllProductsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments();
    const products = await Product.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc Add review with images
// @route POST /api/products/:id/review
exports.addReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existingReview = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (existingReview) return res.status(400).json({ message: 'Already reviewed this product' });

    // Handle review images from upload
    const reviewImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const review = { 
      user: req.user._id, 
      name: req.user.name, 
      rating: Number(req.body.rating), 
      comment: req.body.comment,
      images: reviewImages
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1);
    await product.save();

    console.log(`✅ [REVIEW] Added for product: ${product.name} by ${req.user.name}`);
    res.status(201).json({ success: true, message: 'Review added successfully' });
  } catch (err) { next(err); }
};

// @desc Get all categories from Category collection
// @route GET /api/products/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    // returns names (strings) so dropdown stays compatible
    res.json({ success: true, categories: categories.map(c => c.name) });
  } catch (err) { next(err); }
};
