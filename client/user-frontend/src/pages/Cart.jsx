import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal, tax, shipping, total, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRemove = async (productId, name) => {
    try {
      await removeFromCart(productId);
      toast.success(`${name} removed from cart`);
    } catch { toast.error('Failed to remove item'); }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-12 text-center"><div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" /></div>;

  if (items.length === 0) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
      <Link to="/shop" className="bg-orange-500 text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition inline-flex items-center gap-2">
        Start Shopping <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart <span className="text-gray-400 font-normal text-lg">({items.length} items)</span></h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const product = item.product;
            const name = product?.name || 'Product';
            const image = product?.images?.[0] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200';
            const pid = product?._id || item.product;
            return (
              <div key={pid} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4">
                <img src={image} alt={name} className="w-20 h-20 object-cover rounded-xl" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{name}</h3>
                  <p className="text-orange-500 font-bold mt-1">₹{item.price?.toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                      <button onClick={() => updateQuantity(pid, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-50"><Minus size={12} /></button>
                      <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(pid, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-50"><Plus size={12} /></button>
                    </div>
                    <span className="text-sm font-bold text-gray-800">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => handleRemove(pid, name)} className="text-gray-300 hover:text-red-400 transition shrink-0 self-start">
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 h-fit sticky top-20">
          <h2 className="font-bold text-gray-800 text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (10%)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600">₹{shipping}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => user ? navigate('/checkout') : navigate('/login', { state: { from: '/checkout' } })}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full mt-5 transition flex items-center justify-center gap-2"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>
          <Link to="/shop" className="block text-center text-sm text-orange-500 hover:underline mt-3">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
