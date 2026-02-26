export const MOCK_STATS = {
  totalRevenue: 248650,
  totalOrders: 312,
  totalUsers: 1284,
  totalProducts: 96,
  pendingOrders: 28,
  lowStockProducts: 7,
};

export const MOCK_REVENUE_CHART = [
  { month: 'Sep', revenue: 12000 },
  { month: 'Oct', revenue: 19500 },
  { month: 'Nov', revenue: 28000 },
  { month: 'Dec', revenue: 45000 },
  { month: 'Jan', revenue: 32000 },
  { month: 'Feb', revenue: 38000 },
];

export const MOCK_ORDERS_STATUS = [
  { name: 'Delivered', value: 185, color: '#22c55e' },
  { name: 'Pending', value: 28, color: '#f59e0b' },
  { name: 'Processing', value: 52, color: '#3b82f6' },
  { name: 'Shipped', value: 31, color: '#8b5cf6' },
  { name: 'Cancelled', value: 16, color: '#ef4444' },
];

export const MOCK_MONTHLY_SALES = [
  { month: 'Sep', sales: 48 }, { month: 'Oct', sales: 72 }, { month: 'Nov', sales: 95 },
  { month: 'Dec', sales: 134 }, { month: 'Jan', sales: 88 }, { month: 'Feb', sales: 103 },
];

export const MOCK_ORDERS = [
  { _id: 'ORD001', user: { name: 'Priya Sharma', email: 'priya@example.com' }, items: [{ name: 'Headphones', quantity: 1 }], totalAmount: 3499, status: 'Delivered', createdAt: '2026-02-20T10:00:00Z' },
  { _id: 'ORD002', user: { name: 'Rahul Verma', email: 'rahul@example.com' }, items: [{ name: 'Smart Watch', quantity: 2 }], totalAmount: 19998, status: 'Shipped', createdAt: '2026-02-22T12:30:00Z' },
  { _id: 'ORD003', user: { name: 'Anita Singh', email: 'anita@example.com' }, items: [{ name: 'Running Shoes', quantity: 1 }], totalAmount: 2999, status: 'Pending', createdAt: '2026-02-25T09:15:00Z' },
  { _id: 'ORD004', user: { name: 'Amit Kumar', email: 'amit@example.com' }, items: [{ name: 'Yoga Mat', quantity: 3 }], totalAmount: 3897, status: 'Processing', createdAt: '2026-02-25T14:00:00Z' },
  { _id: 'ORD005', user: { name: 'Sneha Patel', email: 'sneha@example.com' }, items: [{ name: 'Backpack', quantity: 1 }], totalAmount: 2199, status: 'Cancelled', createdAt: '2026-02-24T08:00:00Z' },
];

export const MOCK_USERS = [
  { _id: 'U1', name: 'Priya Sharma', email: 'priya@example.com', isBlocked: false, createdAt: '2026-01-15T10:00:00Z' },
  { _id: 'U2', name: 'Rahul Verma', email: 'rahul@example.com', isBlocked: false, createdAt: '2026-01-20T10:00:00Z' },
  { _id: 'U3', name: 'Anita Singh', email: 'anita@example.com', isBlocked: true, createdAt: '2026-02-01T10:00:00Z' },
];

export const MOCK_PRODUCTS = [
  { _id: 'P1', name: 'Wireless Headphones', category: 'Electronics', price: 4999, discountPrice: 3499, stock: 45, images: ['https://via.placeholder.com/300?text=Headphones'], description: 'Premium wireless headphones with noise cancellation', isActive: true },
  { _id: 'P2', name: 'Smart Watch', category: 'Electronics', price: 12999, discountPrice: 9999, stock: 28, images: ['https://via.placeholder.com/300?text=Smart+Watch'], description: 'Fitness tracking smartwatch with heart rate monitor', isActive: true },
  { _id: 'P3', name: 'Running Shoes', category: 'Fashion', price: 3999, discountPrice: 2999, stock: 62, images: ['https://via.placeholder.com/300?text=Running+Shoes'], description: 'Comfortable running shoes for all terrains', isActive: true },
  { _id: 'P4', name: 'Yoga Mat', category: 'Sports', price: 1599, discountPrice: 1299, stock: 0, images: ['https://via.placeholder.com/300?text=Yoga+Mat'], description: 'Non-slip yoga mat for workouts', isActive: true },
  { _id: 'P5', name: 'Coffee Maker', category: 'Kitchen', price: 5499, discountPrice: 4299, stock: 15, images: ['https://via.placeholder.com/300?text=Coffee+Maker'], description: 'Automatic coffee maker with timer', isActive: true },
  { _id: 'P6', name: 'Backpack', category: 'Fashion', price: 2999, discountPrice: 2199, stock: 38, images: ['https://via.placeholder.com/300?text=Backpack'], description: 'Durable travel backpack with compartments', isActive: true },
  { _id: 'P7', name: 'Phone Stand', category: 'Electronics', price: 799, discountPrice: 599, stock: 120, images: ['https://via.placeholder.com/300?text=Phone+Stand'], description: 'Adjustable phone stand for desk', isActive: false },
  { _id: 'P8', name: 'Notebook Set', category: 'Books', price: 399, discountPrice: 299, stock: 200, images: ['https://via.placeholder.com/300?text=Notebook'], description: 'Premium quality notebook bundle', isActive: true },
];

export const fakeDelay = (ms = 400) => new Promise(r => setTimeout(r, ms));
