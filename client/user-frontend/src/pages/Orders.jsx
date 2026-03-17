import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, Truck, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  Pending:    { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  Processing: { color: 'bg-blue-100 text-blue-700',    icon: RotateCcw },
  Shipped:    { color: 'bg-purple-100 text-purple-700', icon: Truck },
  Delivered:  { color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  Cancelled:  { color: 'bg-red-100 text-red-600',      icon: XCircle },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  if (orders.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Package size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">No orders yet</h2>
      <p className="text-gray-500 mb-6">Your placed orders will appear here.</p>
      <Link to="/shop" className="bg-orange-500 text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition inline-block">
        Start Shopping
      </Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders <span className="text-gray-400 text-base font-normal">({orders.length})</span></h1>
      <div className="space-y-4">
        {orders.map(order => {
          const { color, icon: StatusIcon } = STATUS_STYLE[order.status] || STATUS_STYLE.Pending;
          return (
            <div key={order._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
                  <p className="font-mono text-sm font-semibold text-gray-700 truncate max-w-48">{order._id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${color}`}>
                    <StatusIcon size={12} />
                    {order.status}
                  </span>
                  <Link to={`/order/${order._id}`} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                    View Details
                  </Link>
                </div>
              </div>

              {/* Items */}
              <div className="px-5 py-4">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {order.items?.slice(0, 4).map((item, i) => (
                    <div key={i} className="shrink-0 flex items-center gap-2">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=80'}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-700 max-w-28 line-clamp-2">{item.name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity} · ₹{item.price?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <div className="shrink-0 flex items-center">
                      <span className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">+{order.items.length - 4} more</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50/60 text-sm">
                <div className="text-gray-400 text-xs">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span className="ml-2 capitalize">{order.paymentMethod}</span>
                </div>
                <p className="font-bold text-gray-800">₹{order.totalAmount?.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
