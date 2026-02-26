import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  if (!user) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <Heart size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Please login to view wishlist</h2>
      <Link to="/login" className="bg-orange-500 text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition inline-block mt-4">Login</Link>
    </div>
  );

  const products = wishlist.filter(item => item?._id);

  if (products.length === 0) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <Heart size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
      <p className="text-gray-500 mb-6">Save items you love for later.</p>
      <Link to="/shop" className="bg-orange-500 text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition inline-block">Browse Products</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wishlist ({products.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group">
            <div className="relative">
              <Link to={`/product/${product._id}`}>
                <img src={product.images?.[0]} alt={product.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
              </Link>
              <button onClick={() => { toggleWishlist(product); toast.success('Removed from wishlist'); }} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition">
                <Heart size={14} className="fill-red-500 text-red-500" />
              </button>
            </div>
            <div className="p-3">
              <Link to={`/product/${product._id}`} className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-orange-500">{product.name}</Link>
              <p className="text-orange-500 font-bold mt-1 text-sm">₹{(product.discountPrice || product.price)?.toLocaleString()}</p>
              <button
                onClick={async () => { await addToCart(product); toast.success('Added to cart!'); }}
                className="w-full mt-2 bg-orange-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-1"
              >
                <ShoppingCart size={12} /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
