const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Lazily initialised so dotenv has already run by the time this is called
const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc Create Razorpay order
// @route POST /api/payment/create-order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: parseInt(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await getRazorpay().orders.create(options);
    console.log(`✅ [PAYMENT] Razorpay order created: ${order.id} (Amount: ₹${amount})`);
    
    res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    next(err);
  }
};

// @desc Verify Razorpay payment signature
// @route POST /api/payment/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Create the expected signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpaySignature;

    if (!isSignatureValid) {
      console.error(`❌ [PAYMENT] Invalid signature for payment: ${razorpayPaymentId}`);
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    console.log(`✅ [PAYMENT] Payment verified: ${razorpayPaymentId}`);
    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    console.error('Payment verification error:', err);
    next(err);
  }
};

// @desc Create order after successful payment
// @route POST /api/payment/create-order-after-payment
exports.createOrderAfterPayment = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'Razorpay', couponCode, razorpayPaymentId } = req.body;
    
    // Get user's cart (embedded in User)
    const userDoc = await User.findById(req.user._id).populate('cart.product');
    if (!userDoc || userDoc.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    const cartItems = userDoc.cart;

    // Calculate order totals
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

    // Apply coupon if provided
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

    // Create order
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
      paymentId: razorpayPaymentId, // Store Razorpay payment ID
      status: 'Processing',
      statusHistory: [{ status: 'Processing', note: 'Payment received via Razorpay' }],
    });

    // Update product stock
    for (const item of cartItems) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Clear embedded cart
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    console.log(`✅ [ORDER] Created after payment: ${order._id} (Amount: ₹${totalAmount})`);
    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    next(err);
  }
};
