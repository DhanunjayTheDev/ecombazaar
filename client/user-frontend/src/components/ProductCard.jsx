import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);

  const discount = product.discountPrice && product.discountPrice < product.price
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addToCart(product);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    } finally { setAdding(false); }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    await toggleWishlist(product);
    toast.success(isInWishlist(product._id) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link to={`/product/${product._id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden block">
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-bold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition"
          aria-label="Wishlist"
        >
          <Heart size={16} className={isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-orange-500 font-medium mb-1">{product.category}</p>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 leading-tight">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-gray-700">{product.rating?.toFixed(1) || '4.0'}</span>
          <span className="text-xs text-gray-400">({product.numReviews || 0})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            ₹{(product.discountPrice || product.price).toLocaleString()}
          </span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2 rounded-xl transition flex items-center justify-center gap-2"
        >
          <ShoppingCart size={14} />
          {adding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
