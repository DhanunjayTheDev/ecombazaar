const express = require('express');
const router = express.Router();
const {
  register, login, logout, getProfile, updateProfile, toggleWishlist,
  getAddresses, addAddress, updateAddress, deleteAddress,
  saveCard, deleteCard,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/wishlist/:productId', protect, toggleWishlist);

// Address management
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

// Saved cards
router.post('/saved-cards', protect, saveCard);
router.delete('/saved-cards/:cardId', protect, deleteCard);

module.exports = router;
