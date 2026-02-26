const express = require('express');
const router = express.Router();
const {
  placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getStats,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', placeOrder);
router.get('/my', getMyOrders);
router.get('/admin/stats', adminOnly, getStats);
router.get('/:id', getOrderById);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.get('/', adminOnly, getAllOrders);

module.exports = router;
