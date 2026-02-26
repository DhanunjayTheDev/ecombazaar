const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Cart Item (embedded — no separate collection) ─────────────────────────
const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price:    { type: Number, required: true },
}, { _id: false });

// ── Address ───────────────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema({
  label:     { type: String, default: 'Home' }, // Home | Work | Other
  fullName:  { type: String },
  phone:     { type: String },
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  zip:       { type: String, required: true },
  country:   { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// ── Saved Card (tokenised — display info only, NO raw card numbers) ────────
const savedCardSchema = new mongoose.Schema({
  razorpayTokenId: { type: String },
  last4:   { type: String },
  network: { type: String }, // Visa / Mastercard / RuPay
  name:    { type: String },
  expiry:  { type: String }, // MM/YY
}, { timestamps: true });

// ── User ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },

  // Wishlist — array of product refs
  wishlist:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Cart embedded into User (no separate Cart collection needed)
  cart: [cartItemSchema],

  // Multiple saved addresses
  addresses: [addressSchema],

  // Saved cards (tokenised)
  savedCards: [savedCardSchema],
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
