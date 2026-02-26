const Coupon = require('../models/Coupon');

// @desc Get all coupons (Admin)
// @route GET /api/coupons
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
};

// @desc Create coupon (Admin)
// @route POST /api/coupons
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) { next(err); }
};

// @desc Update coupon (Admin)
// @route PUT /api/coupons/:id
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
};

// @desc Delete coupon (Admin)
// @route DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};

// @desc Validate/Apply coupon (User)
// @route POST /api/coupons/apply
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
    if (new Date(coupon.expiryDate) < new Date()) return res.status(400).json({ message: 'Coupon has expired' });
    if (orderAmount < coupon.minOrderAmount) return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });

    const discount = coupon.discountType === 'percentage'
      ? parseFloat((orderAmount * coupon.discountValue / 100).toFixed(2))
      : coupon.discountValue;

    res.json({ success: true, coupon, discount });
  } catch (err) { next(err); }
};
