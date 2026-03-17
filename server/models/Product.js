const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }], // Images uploaded with review
}, { timestamps: true });

const variantSchema = new mongoose.Schema({
  label:         { type: String, required: true },   // e.g. "128GB", "8GB RAM / 512GB SSD"
  price:         { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0 },
  stock:         { type: Number, required: true, default: 0 },
  sku:           { type: String, default: '' },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  category:      { type: String, required: true },
  productType:   { type: String, default: '' },  // e.g. 'Pendrive', 'Laptop', 'Smartwatch'
  brand:         String,
  price:         { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0 },
  images:        [{ type: String }],
  description:   { type: String, required: true },
  keyFeatures:   [{ type: String }],
  specifications: { type: Map, of: String },  // Dynamic tech specs
  variants:      [variantSchema],              // Size / storage / color variants
  stock:         { type: Number, required: true, default: 0 },
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  numReviews:    { type: Number, default: 0 },
  reviews:       [reviewSchema],
  isActive:      { type: Boolean, default: true },
  tags:          [String],
}, { timestamps: true });

// Full-text search index
productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
