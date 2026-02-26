const mongoose = require('mongoose');

const toSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  slug:        { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  icon:        { type: String, default: '📦' },
  image:       { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// Auto-generate slug from name before saving
categorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = toSlug(this.name);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
module.exports.toSlug = toSlug;
