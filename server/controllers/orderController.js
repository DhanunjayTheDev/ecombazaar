const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc Place order
// @route POST /api/orders
exports.placeOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'COD', couponCode } = req.body;
    const userDoc = await User.findById(req.user._id).populate('cart.product');
    if (!userDoc || userDoc.cart.length === 0) return res.status(400).json({ message: 'Cart is empty' });
    const cartItems = userDoc.cart;

    let subtotal = 0;
    const orderItems = cartItems.map(item => {
      const price = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
      subtotal += price * item.quantity;
      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.images[0] || '',
        price,
        quantity: item.quantity,
      };
    });

    const tax = parseFloat((subtotal * 0.1).toFixed(2));
    const shippingCharge = 50;
    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date(coupon.expiryDate) > new Date() && subtotal >= coupon.minOrderAmount) {
        discount = coupon.discountType === 'percentage'
          ? parseFloat((subtotal * coupon.discountValue / 100).toFixed(2))
          : coupon.discountValue;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const totalAmount = parseFloat((subtotal + tax + shippingCharge - discount).toFixed(2));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      tax,
      shippingCharge,
      discount,
      totalAmount,
      couponCode,
      statusHistory: [{ status: 'Pending' }],
    });

    // Update product stock
    for (const item of cartItems) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Clear embedded cart
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc Get my orders
// @route GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

// @desc Get order by ID
// @route GET /api/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc Get all orders (Admin)
// @route GET /api/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone addresses')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc Update order status (Admin)
// @route PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    await order.save();
    const populated = await Order.findById(req.params.id).populate('user', 'name email phone addresses');
    res.json({ success: true, order: populated });
  } catch (err) { next(err); }
};

// @desc Admin dashboard stats
// @route GET /api/orders/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const monthlySales = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, totalOrders, pendingOrders, totalRevenue, ordersByStatus, monthlySales });
  } catch (err) { next(err); }
};
