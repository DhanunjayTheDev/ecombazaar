const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const sendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({
    success: true,
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

// @desc Register
// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    sendToken(user, 201, res);
  } catch (err) { next(err); }
};

// @desc Login
// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked' });
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

// @desc Logout
// @route POST /api/auth/logout
exports.logout = (req, res) => {
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.json({ success: true, message: 'Logged out' });
};

// @desc Get profile (includes wishlist, addresses, saved cards)
// @route GET /api/auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist', 'name images price discountPrice rating category')
      .populate('cart.product', 'name images price discountPrice stock _id');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc Update profile
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { name } = req.body;
    if (name) user.name = name;
    if (req.body.password) user.password = req.body.password;
    await user.save();
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

// @desc Get all saved addresses
// @route GET /api/auth/addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

// @desc Add a new address
// @route POST /api/auth/addresses
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { label, fullName, phone, street, city, state, zip, country, isDefault } = req.body;
    if (!street || !city || !state || !zip) return res.status(400).json({ message: 'street, city, state and zip are required' });
    if (isDefault) user.addresses.forEach(a => { a.isDefault = false; });
    user.addresses.push({ label: label || 'Home', fullName, phone, street, city, state, zip, country: country || 'India', isDefault: !!isDefault });
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

// @desc Update an address
// @route PUT /api/auth/addresses/:addressId
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    const fields = ['label','fullName','phone','street','city','state','zip','country','isDefault'];
    if (req.body.isDefault) user.addresses.forEach(a => { a.isDefault = false; });
    fields.forEach(f => { if (req.body[f] !== undefined) addr[f] = req.body[f]; });
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

// @desc Delete an address
// @route DELETE /api/auth/addresses/:addressId
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

// @desc Save a card (tokenised via Razorpay)
// @route POST /api/auth/saved-cards
exports.saveCard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { razorpayTokenId, last4, network, name, expiry } = req.body;
    user.savedCards.push({ razorpayTokenId, last4, network, name, expiry });
    await user.save();
    res.status(201).json({ success: true, savedCards: user.savedCards });
  } catch (err) { next(err); }
};

// @desc Delete a saved card
// @route DELETE /api/auth/saved-cards/:cardId
exports.deleteCard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedCards = user.savedCards.filter(c => c._id.toString() !== req.params.cardId);
    await user.save();
    res.json({ success: true, savedCards: user.savedCards });
  } catch (err) { next(err); }
};

// @desc Toggle wishlist
// @route PUT /api/auth/wishlist/:productId
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const pid = req.params.productId;
    const idx = user.wishlist.findIndex(id => id.toString() === pid);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(pid);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { next(err); }
};
