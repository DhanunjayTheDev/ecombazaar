const express = require('express');
const router = express.Router();
const { getAllUsers, toggleBlockUser, deleteUser, getUserOrders } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);
router.get('/', getAllUsers);
router.put('/:id/block', toggleBlockUser);
router.delete('/:id', deleteUser);
router.get('/:id/orders', getUserOrders);

module.exports = router;
