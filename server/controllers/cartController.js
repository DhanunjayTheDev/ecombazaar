const User = require('../models/User');
const Product = require('../models/Product');

// Helper — return populated cart items for the user
const getPopulatedCart = async (userId) => {
  const user = await User.findById(userId)
    .populate('cart.product', 'name images price discountPrice stock _id');
  return user ? user.cart : [];
};

// @desc Get cart
// @route GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    const items = await getPopulatedCart(req.user._id);
    console.log(`✅ [CART] Fetched for user: ${req.user._id} (${items.length} items)`);
    res.json({ success: true, cart: { items } });
  } catch (err) { next(err); }
};

// @desc Add to cart
// @route POST /api/cart/add
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    const user = await User.findById(req.user._id);
    const idx = user.cart.findIndex(i => i.product.toString() === productId);

    if (idx > -1) {
      user.cart[idx].quantity += Number(quantity);
      console.log(`✅ [CART] Updated qty: ${productId} → ${user.cart[idx].quantity}`);
    } else {
      user.cart.push({ product: productId, quantity: Number(quantity), price });
      console.log(`✅ [CART] Added: ${productId} (qty: ${quantity})`);
    }
    await user.save();
    const items = await getPopulatedCart(req.user._id);
    res.json({ success: true, cart: { items } });
  } catch (err) { next(err); }
};

// @desc Update cart item quantity
// @route PUT /api/cart/update
exports.updateCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user._id);
    const idx = user.cart.findIndex(i => i.product.toString() === productId);
    if (idx === -1) return res.status(404).json({ message: 'Item not in cart' });

    if (Number(quantity) <= 0) {
      user.cart.splice(idx, 1);
      console.log(`✅ [CART] Removed: ${productId}`);
    } else {
      user.cart[idx].quantity = Number(quantity);
      console.log(`✅ [CART] Updated qty: ${productId} → ${quantity}`);
    }
    await user.save();
    const items = await getPopulatedCart(req.user._id);
    res.json({ success: true, cart: { items } });
  } catch (err) { next(err); }
};

// @desc Remove item from cart
// @route DELETE /api/cart/remove
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(i => i.product.toString() !== productId);
    await user.save();
    const items = await getPopulatedCart(req.user._id);
    console.log(`✅ [CART] Removed: ${productId}`);
    res.json({ success: true, cart: { items } });
  } catch (err) { next(err); }
};

// @desc Clear entire cart
// @route DELETE /api/cart/clear
exports.clearCart = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    console.log(`✅ [CART] Cleared for user: ${req.user._id}`);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};
