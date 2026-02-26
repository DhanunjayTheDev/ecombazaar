import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home, ArrowRight } from 'lucide-react';
import api from '../utils/api';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch {}
    };
    fetch();
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-green-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-500 mb-2">Thank you for shopping with EcombAzaar</p>
      <p className="text-sm text-gray-400 mb-8">Order ID: <span className="font-mono font-medium text-gray-600">{id}</span></p>

      {/* Progress */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[
          { icon: CheckCircle, label: 'Confirmed', active: true },
          { icon: Package, label: 'Processing', active: false },
          { icon: Truck, label: 'Shipped', active: false },
          { icon: Home, label: 'Delivered', active: false },
        ].map(({ icon: Icon, label, active }, i, arr) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex flex-col items-center ${active ? 'text-green-500' : 'text-gray-300'}`}>
              <Icon size={24} className={active ? 'fill-green-100' : ''} />
              <span className="text-xs mt-1">{label}</span>
            </div>
            {i < arr.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {order && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left mb-8">
          <h3 className="font-bold text-gray-800 mb-3">Order Details</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x{item.quantity}</span>
                <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <hr />
            <div className="flex justify-between font-bold text-gray-800">
              <span>Total Paid</span>
              <span>₹{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/orders" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-full hover:bg-orange-600 transition flex items-center gap-2 justify-center">
          Track Order <Package size={16} />
        </Link>
        <Link to="/shop" className="border-2 border-orange-500 text-orange-500 font-bold px-6 py-3 rounded-full hover:bg-orange-50 transition flex items-center gap-2 justify-center">
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
