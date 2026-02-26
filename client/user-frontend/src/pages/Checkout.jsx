import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Truck, CreditCard, Smartphone, Banknote, Tag, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID';

const PAYMENT_METHODS = [
  { id: 'Razorpay', icon: CreditCard, label: 'Pay Online', desc: 'Cards, UPI, Net Banking, Wallets via Razorpay', badge: 'Recommended' },
  { id: 'COD', icon: Banknote, label: 'Cash on Delivery', desc: 'Pay when your order arrives', badge: null },
];

export default function Checkout() {
  const { items, subtotal, tax, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [placing, setPlacing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [showCoupon, setShowCoupon] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || '', address: '', city: '', state: '',
    zip: '', country: 'India', phone: '',
  });

  const finalTotal = parseFloat((total - discount).toFixed(2));

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.post('/coupons/apply', { code: coupon, orderAmount: subtotal });
      setDiscount(data.discount);
      setCouponApplied(true);
      toast.success(`🎉 Coupon applied! ₹${data.discount} off`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  const removeCoupon = () => { setCoupon(''); setDiscount(0); setCouponApplied(false); };

  // ── COD order ─────────────────────────────────────────────────────────
  const placeCODOrder = async () => {
    const { data } = await api.post('/orders', {
      shippingAddress: form,
      paymentMethod: 'COD',
      couponCode: coupon,
    });
    await clearCart();
    navigate(`/order-success/${data.order._id}`);
  };

  // ── Razorpay order ────────────────────────────────────────────────────
  const placeRazorpayOrder = useCallback(async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) { toast.error('Failed to load payment gateway. Please try again.'); return; }

    // Step 1: Create Razorpay order on backend
    const { data: rzpData } = await api.post('/payment/create-order', { amount: finalTotal });

    return new Promise((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'EcomBazaar',
        description: `Order of ${items.length} item(s)`,
        image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=80&h=80&fit=crop',
        order_id: rzpData.orderId,
        prefill: {
          name: form.fullName || user?.name,
          email: user?.email,
          contact: form.phone,
        },
        theme: { color: '#f97316' },
        handler: async (response) => {
          try {
            // Step 2: Verify payment signature
            const { data: verifyData } = await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (!verifyData.success) { reject(new Error('Payment verification failed')); return; }

            // Step 3: Create order in DB after successful payment
            const { data: orderData } = await api.post('/payment/create-order-after-payment', {
              shippingAddress: form,
              paymentMethod: 'Razorpay',
              couponCode: coupon,
              razorpayPaymentId: response.razorpay_payment_id,
            });

            resolve(orderData.order);
          } catch (err) { reject(err); }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user')),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error.description || 'Payment failed'));
      });
      rzp.open();
    });
  }, [finalTotal, form, coupon, items, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Your cart is empty');
    setPlacing(true);
    try {
      if (paymentMethod === 'COD') {
        await placeCODOrder();
      } else {
        const order = await placeRazorpayOrder();
        await clearCart();
        navigate(`/order-success/${order._id}`);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg === 'Payment cancelled by user') {
        toast.error('Payment cancelled');
      } else {
        toast.error(msg || 'Failed to place order');
      }
    } finally { setPlacing(false); }
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Doe', span: 2 },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', span: 2 },
    { key: 'address', label: 'Street Address', type: 'text', placeholder: '123 Main Street, Apt 4B', span: 2 },
    { key: 'city', label: 'City', type: 'text', placeholder: 'Mumbai', span: 1 },
    { key: 'state', label: 'State', type: 'text', placeholder: 'Maharashtra', span: 1 },
    { key: 'zip', label: 'PIN Code', type: 'text', placeholder: '400001', span: 1 },
    { key: 'country', label: 'Country', type: 'text', placeholder: 'India', span: 1 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Checkout</h1>
      <p className="text-sm text-gray-500 mb-6">Complete your order securely</p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
        {/* ── LEFT: Address + Payment ─────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Shipping */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <Truck size={14} className="text-orange-500" />
              </div>
              <h2 className="font-bold text-gray-800">Shipping Address</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(({ key, label, type, placeholder, span }) => (
                <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                  <input
                    required type={type} placeholder={placeholder}
                    value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="text-orange-500" />
              </div>
              <h2 className="font-bold text-gray-800">Payment Method</h2>
            </div>
            <div className="space-y-3">
              {PAYMENT_METHODS.map(({ id, icon: Icon, label, desc, badge }) => (
                <label
                  key={id}
                  className={`flex items-center gap-4 border-2 rounded-2xl p-4 cursor-pointer transition ${paymentMethod === id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="sr-only" />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === id ? 'bg-orange-500' : 'bg-gray-100'}`}>
                    <Icon size={18} className={paymentMethod === id ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-800">{label}</p>
                      {badge && <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">{badge}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === id ? 'border-orange-500' : 'border-gray-300'}`}>
                    {paymentMethod === id && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Order Summary ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-20">
            <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 mb-4">
              {items.map(item => (
                <div key={item.product?._id} className="flex items-center gap-3">
                  <img src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=60'} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.product?.name || 'Product'}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <hr className="border-gray-100 mb-4" />

            {/* Price Breakdown */}
            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal ({items.length} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax (10%)</span><span>₹{tax}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600">₹{shipping}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon ({coupon})</span><span>−₹{discount}</span>
                </div>
              )}
              <hr className="border-gray-100" />
              <div className="flex justify-between font-black text-gray-900 text-base">
                <span>Total</span><span className="text-orange-600">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="mb-4">
              <button type="button" onClick={() => setShowCoupon(v => !v)} className="flex items-center gap-2 text-sm text-orange-600 font-medium hover:text-orange-700 transition">
                <Tag size={14} />
                {couponApplied ? `Coupon applied: ${coupon}` : 'Have a coupon code?'}
                <ChevronDown size={14} className={`transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
              </button>
              {showCoupon && !couponApplied && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text" placeholder="Enter code" value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 uppercase tracking-wider"
                  />
                  <button type="button" onClick={applyCoupon} className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-3 py-2 rounded-xl text-sm transition">Apply</button>
                </div>
              )}
              {couponApplied && (
                <button type="button" onClick={removeCoupon} className="text-xs text-red-400 hover:text-red-500 mt-1">Remove coupon</button>
              )}
            </div>

            <button
              type="submit" disabled={placing || items.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2"
            >
              {placing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {paymentMethod === 'Razorpay' ? 'Redirecting to payment…' : 'Placing Order…'}
                </>
              ) : paymentMethod === 'Razorpay' ? (
                <>
                  <ShieldCheck size={16} /> Pay ₹{finalTotal.toLocaleString()} Securely
                </>
              ) : (
                `Place Order • ₹${finalTotal.toLocaleString()}`
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
              <ShieldCheck size={12} /> Secured & encrypted payment
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

