const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecombazaar';

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Category = require('../models/Category');

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Order.deleteMany({});
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing collections');

    // Seed initial categories
    await Category.insertMany([
      { name: 'Electronics', slug: 'electronics', icon: '📱', description: 'Phones, laptops, gadgets and more', isActive: true },
      { name: 'Fashion',     slug: 'fashion',     icon: '👗', description: 'Clothing, accessories and footwear', isActive: true },
      { name: 'Sports',      slug: 'sports',      icon: '⚽', description: 'Sports equipment and activewear', isActive: true },
      { name: 'Kitchen',     slug: 'kitchen',     icon: '🍳', description: 'Cookware, appliances and kitchenware', isActive: true },
      { name: 'Books',       slug: 'books',       icon: '📚', description: 'Books, e-books and stationery', isActive: true },
      { name: 'Beauty',      slug: 'beauty',      icon: '💄', description: 'Skincare, makeup and grooming', isActive: true },
      { name: 'Home',        slug: 'home',        icon: '🏠', description: 'Furniture, decor and home essentials', isActive: true },
    ]);
    console.log('✅ Categories seeded');

    // Create users — passwords are plain text here; the User model's
    // pre-save hook will hash them automatically via bcrypt.
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@store.com',
        password: 'admin123',
        role: 'admin',
        address: '123 Market Street, Mumbai, India',
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'user123',
        role: 'user',
        address: '456 Park Avenue, Delhi',
        wishlist: [],
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'user123',
        role: 'user',
        address: '789 Ocean Drive, Bangalore',
        wishlist: [],
      },
      {
        name: 'Mike Smith',
        email: 'mike@example.com',
        password: 'user123',
        role: 'user',
        address: '321 River Road, Hyderabad',
        wishlist: [],
      },
    ]);
    console.log('✅ Created 4 users');

    // Create products
    const products = await Product.create([
      {
        name: 'Wireless Headphones',
        category: 'Electronics',
        price: 3999,
        discountPrice: 2999,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
        description: 'Premium wireless headphones with active noise cancellation',
        specifications: { battery: '30hrs', connectivity: 'Bluetooth 5.0' },
        stock: 50,
        rating: 4.5,
        reviews: [],
      },
      {
        name: 'Running Shoes',
        category: 'Sports',
        price: 4999,
        discountPrice: 3499,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
        description: 'Lightweight running shoes for athletes',
        specifications: { size: '6-13', material: 'Mesh & Rubber' },
        stock: 40,
        rating: 4.3,
        reviews: [],
      },
      {
        name: 'Yoga Mat',
        category: 'Sports',
        price: 999,
        discountPrice: 699,
        images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
        description: 'Non-slip yoga mat for all exercises',
        specifications: { thickness: '6mm', material: 'TPE' },
        stock: 60,
        rating: 4.7,
        reviews: [],
      },
      {
        name: 'Coffee Maker',
        category: 'Kitchen',
        price: 5999,
        discountPrice: 4499,
        images: ['https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500'],
        description: 'Automatic coffee maker with programmable timer',
        specifications: { capacity: '1.5L', power: '800W' },
        stock: 25,
        rating: 4.6,
        reviews: [],
      },
      {
        name: 'Wireless Mouse',
        category: 'Electronics',
        price: 1999,
        discountPrice: 1299,
        images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'],
        description: 'Ergonomic wireless mouse with precision tracking',
        specifications: { dpi: '3200', battery: '18 months' },
        stock: 80,
        rating: 4.4,
        reviews: [],
      },
      {
        name: 'Water Bottle',
        category: 'Sports',
        price: 599,
        discountPrice: 399,
        images: ['https://images.unsplash.com/photo-1602088113235-229c19758e9f?w=500'],
        description: 'Insulated stainless steel water bottle',
        specifications: { capacity: '1L', material: 'Stainless Steel' },
        stock: 100,
        rating: 4.8,
        reviews: [],
      },
      {
        name: 'Smart Watch',
        category: 'Electronics',
        price: 12999,
        discountPrice: 9999,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
        description: 'Fitness tracking smartwatch with heart rate monitor',
        specifications: { display: 'AMOLED', battery: '7 days' },
        stock: 30,
        rating: 4.5,
        reviews: [],
      },
      {
        name: 'Desk Lamp',
        category: 'Home',
        price: 1499,
        discountPrice: 999,
        images: ['https://images.unsplash.com/photo-1565636192335-14f6b7ce4e41?w=500'],
        description: 'LED desk lamp with adjustable brightness',
        specifications: { power: '12W', brightness: '300-1000 lux' },
        stock: 45,
        rating: 4.3,
        reviews: [],
      },
    ]);
    console.log('✅ Created 8 products');

    // Create coupons
    const coupons = await Coupon.create([
      {
        code: 'SAVE20',
        discountType: 'percentage',
        discountValue: 20,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        minOrderAmount: 1000,
        usedCount: 5,
        isActive: true,
      },
      {
        code: 'FLAT500',
        discountType: 'fixed',
        discountValue: 500,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        minOrderAmount: 2000,
        usedCount: 3,
        isActive: true,
      },
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        minOrderAmount: 500,
        usedCount: 12,
        isActive: true,
      },
      {
        code: 'EXPIRED25',
        discountType: 'percentage',
        discountValue: 25,
        expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        minOrderAmount: 1500,
        usedCount: 20,
        isActive: false,
      },
    ]);
    console.log('✅ Created 4 coupons');

    // Create orders
    const orders = await Order.create([
      {
        user: users[1]._id,
        items: [
          { product: products[0]._id, quantity: 1, price: products[0].discountPrice, name: products[0].name, image: products[0].images[0] },
        ],
        shippingAddress: {
          fullName: users[1].name,
          address: '456 Park Avenue',
          city: 'Delhi',
          state: 'Delhi',
          zip: '110001',
          country: 'India',
          phone: '9876543210',
        },
        paymentMethod: 'COD',
        paymentStatus: 'pending',
        status: 'Delivered',
        statusHistory: [
          { status: 'Pending', updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { status: 'Shipped', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { status: 'Delivered', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        ],
        subtotal: products[0].discountPrice,
        tax: 500,
        shippingCharge: 50,
        discount: 0,
        totalAmount: products[0].discountPrice + 500 + 50,
      },
      {
        user: users[2]._id,
        items: [
          { product: products[1]._id, quantity: 1, price: products[1].discountPrice, name: products[1].name, image: products[1].images[0] },
        ],
        shippingAddress: {
          fullName: users[2].name,
          address: '789 Ocean Drive',
          city: 'Bangalore',
          state: 'Karnataka',
          zip: '560001',
          country: 'India',
          phone: '9876543211',
        },
        paymentMethod: 'UPI',
        paymentStatus: 'paid',
        status: 'Shipped',
        statusHistory: [
          { status: 'Pending', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { status: 'Shipped', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ],
        subtotal: products[1].discountPrice,
        tax: 600,
        shippingCharge: 50,
        discount: 0,
        totalAmount: products[1].discountPrice + 600 + 50,
      },
      {
        user: users[3]._id,
        items: [
          { product: products[3]._id, quantity: 1, price: products[3].discountPrice, name: products[3].name, image: products[3].images[0] },
          { product: products[5]._id, quantity: 3, price: products[5].discountPrice, name: products[5].name, image: products[5].images[0] },
        ],
        shippingAddress: {
          fullName: users[3].name,
          address: '321 River Road',
          city: 'Hyderabad',
          state: 'Telangana',
          zip: '500001',
          country: 'India',
          phone: '9876543212',
        },
        paymentMethod: 'Card',
        paymentStatus: 'pending',
        status: 'Pending',
        statusHistory: [
          { status: 'Pending', updatedAt: new Date() },
        ],
        couponCode: 'SAVE20',
        subtotal: products[3].discountPrice + products[5].discountPrice * 3,
        tax: 800,
        shippingCharge: 50,
        discount: 500,
        totalAmount: products[3].discountPrice + products[5].discountPrice * 3 + 800 + 50 - 500,
      },
    ]);
    console.log('✅ Created 3 sample orders');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Coupons: ${coupons.length}`);
    console.log(`   • Orders: ${orders.length}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Admin  → admin@store.com / admin123');
    console.log('   User   → john@example.com / user123');
    console.log('     or   → sarah@example.com / user123');
    console.log('     or   → mike@example.com / user123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    process.exit(1);
  }
}

seed();
