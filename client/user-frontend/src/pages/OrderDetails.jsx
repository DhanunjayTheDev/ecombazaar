import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  Pending:    { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  Processing: { color: 'bg-blue-100 text-blue-700',    icon: RotateCcw },
  Shipped:    { color: 'bg-purple-100 text-purple-700', icon: Truck },
  Delivered:  { color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  Cancelled:  { color: 'bg-red-100 text-red-600',      icon: XCircle },
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(() => {
        toast.error('Failed to load order details');
        navigate('/orders');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center">
      <Package size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Order not found</h2>
      <button
        onClick={() => navigate('/orders')}
        className="text-orange-500 hover:text-orange-600 font-medium mt-4"
      >
        Back to Orders
      </button>
    </div>
  );

  const { color, icon: StatusIcon } = STATUS_STYLE[order.status] || STATUS_STYLE.Pending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 font-medium"
      >
        <ArrowLeft size={18} /> Back to Orders
      </button>

      {/* Order Info Card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        {/* Top Section */}
        <div className="px-6 py-5 border-b border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Order ID</p>
              <p className="font-mono text-lg font-bold text-gray-700">{order._id}</p>
            </div>
            <span className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full ${color}`}>
              <StatusIcon size={14} />
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Details */}
        <div className="px-6 py-4 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-400 text-xs font-medium mb-1">Order Date</p>
            <p className="font-medium text-gray-700">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium mb-1">Payment Method</p>
            <p className="font-medium text-gray-700 capitalize">{order.paymentMethod}</p>
          </div>
          {order.deliveredAt && (
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">Delivered On</p>
              <p className="font-medium text-gray-700">
                {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
          {order.shippedAt && (
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1">Shipped On</p>
              <p className="font-medium text-gray-700">
                {new Date(order.shippedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-800">Order Items</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item, idx) => (
            <div key={idx} className="px-6 py-4 flex gap-4">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=120'}
                alt={item.name}
                className="w-20 h-20 rounded-lg object-cover border border-gray-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800">{item.name}</h4>
                <p className="text-sm text-gray-500 mb-2">Quantity: {item.quantity}</p>
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-700 font-medium">₹{item.price?.toLocaleString()}</span>
                  {item.discountPrice && item.discountPrice < item.price && (
                    <span className="text-gray-400 line-through">₹{item.discountPrice?.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Subtotal</p>
                <p className="font-bold text-gray-800">₹{(item.price * item.quantity)?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-800">Shipping Address</h3>
          </div>
          <div className="px-6 py-4 text-sm text-gray-700">
            <p className="font-medium mb-1">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="mt-3 text-gray-500">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4">
          <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-800 font-medium">₹{order.subtotal?.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600 font-medium">-₹{order.discount?.toLocaleString()}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-800 font-medium">₹{order.tax?.toLocaleString()}</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-800 font-medium">₹{order.shippingCost?.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-800">Total Amount</span>
            <span className="font-bold text-lg text-orange-600">₹{order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
