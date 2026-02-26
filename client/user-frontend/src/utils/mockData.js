export const MOCK_PRODUCTS = [
  { _id: '1', name: 'Premium Wireless Headphones', category: 'Electronics', price: 4999, discountPrice: 3499, stock: 15, rating: 4.5, numReviews: 128, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'], description: 'High quality wireless headphones with noise cancellation.', isActive: true },
  { _id: '2', name: 'Smart Watch Pro', category: 'Electronics', price: 12999, discountPrice: 9999, stock: 8, rating: 4.3, numReviews: 89, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'], description: 'Feature-rich smartwatch with health monitoring.', isActive: true },
  { _id: '3', name: 'Running Shoes X500', category: 'Sports', price: 3999, discountPrice: 2999, stock: 30, rating: 4.7, numReviews: 245, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'], description: 'Lightweight and durable running shoes.', isActive: true },
  { _id: '4', name: 'Casual Denim Jacket', category: 'Fashion', price: 2499, discountPrice: 1799, stock: 20, rating: 4.2, numReviews: 67, images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400'], description: 'Trendy denim jacket for all seasons.', isActive: true },
  { _id: '5', name: 'Coffee Maker Deluxe', category: 'Kitchen', price: 6999, discountPrice: 5499, stock: 12, rating: 4.6, numReviews: 156, images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'], description: 'Professional coffee maker for home use.', isActive: true },
  { _id: '6', name: 'Yoga Mat Premium', category: 'Sports', price: 1999, discountPrice: 1299, stock: 50, rating: 4.4, numReviews: 312, images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'], description: 'Non-slip premium yoga mat.', isActive: true },
  { _id: '7', name: 'Backpack Urban', category: 'Fashion', price: 2999, discountPrice: 2199, stock: 25, rating: 4.3, numReviews: 98, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], description: 'Stylish and spacious urban backpack.', isActive: true },
  { _id: '8', name: 'Bluetooth Speaker', category: 'Electronics', price: 3499, discountPrice: 2799, stock: 18, rating: 4.5, numReviews: 178, images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'], description: 'Portable bluetooth speaker with rich bass.', isActive: true },
];

export const MOCK_CATEGORIES = ['Electronics', 'Fashion', 'Sports', 'Kitchen', 'Books', 'Beauty', 'Home'];

export const MOCK_TESTIMONIALS = [
  { id: 1, name: 'Priya Sharma', rating: 5, comment: 'Amazing products and super fast delivery! Will definitely shop again.', avatar: 'PS' },
  { id: 2, name: 'Rahul Verma', rating: 5, comment: 'Best e-commerce platform. Quality products at great prices.', avatar: 'RV' },
  { id: 3, name: 'Anita Singh', rating: 4, comment: 'Great experience! Customer support was very helpful.', avatar: 'AS' },
];

export const fakeDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));
