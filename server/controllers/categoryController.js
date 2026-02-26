const Category = require('../models/Category');

// @desc Get all active categories (public)
// @route GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const { all } = req.query; // admin passes ?all=true to get inactive too
    const filter = all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort('name');
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

// @desc Get single category
// @route GET /api/categories/:id
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

// @desc Create category (Admin)
// @route POST /api/categories
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, image, isActive } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Category name is required' });
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Category with this name already exists' });
    const category = await Category.create({ name: name.trim(), description, icon, image, isActive });
    console.log(`✅ [CATEGORY] Created: ${category.name}`);
    res.status(201).json({ success: true, category });
  } catch (err) { next(err); }
};

// @desc Update category (Admin)
// @route PUT /api/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, image, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;
    await category.save();
    console.log(`✅ [CATEGORY] Updated: ${category.name}`);
    res.json({ success: true, category });
  } catch (err) { next(err); }
};

// @desc Delete category (Admin)
// @route DELETE /api/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    console.log(`✅ [CATEGORY] Deleted: ${category.name}`);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};
