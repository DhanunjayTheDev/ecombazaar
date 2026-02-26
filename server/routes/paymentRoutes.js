const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, createOrderAfterPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public route to create Razorpay order
router.post('/create-order', createRazorpayOrder);

// Verify payment signature
router.post('/verify', verifyPayment);

// Create order in DB after successful payment (requires auth)
router.post('/create-order-after-payment', protect, createOrderAfterPayment);

module.exports = router;
