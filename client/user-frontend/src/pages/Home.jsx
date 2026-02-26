import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones, Star, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_TESTIMONIALS, fakeDelay } from '../utils/mockData';
import api from '../utils/api';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 30, s: 0 });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?limit=8');
        setFeatured(data.products);
      } catch {
        await fakeDelay(600);
        setFeatured(MOCK_PRODUCTS);
      } finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 5; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <span className="bg-white/20 text-sm px-3 py-1 rounded-full">🔥 New Arrivals 2026</span>
            <h1 className="text-4xl md:text-6xl font-extrabold mt-4 mb-4 leading-tight">
              Shop the Best<br /><span className="text-yellow-300">Deals Today</span>
            </h1>
            <p className="text-lg text-orange-100 mb-8 max-w-lg">
              Discover thousands of products at unbeatable prices. Quality guaranteed, delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="bg-white text-orange-500 font-bold px-8 py-3 rounded-full hover:shadow-lg transition flex items-center gap-2 justify-center">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link to="/shop?category=Electronics" className="border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition text-center">
                View Electronics
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500" alt="Shopping" className="rounded-3xl shadow-2xl w-full max-w-md object-cover" />
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-orange-50 border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders ₹999+' },
            { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
            { icon: RefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
            { icon: Headphones, title: '24/7 Support', desc: 'Always here for you' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
          <Link to="/shop" className="text-orange-500 text-sm font-medium flex items-center gap-1 hover:underline">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {MOCK_CATEGORIES.map((cat, i) => {
            const emojis = ['📱', '👗', '⚽', '🍳', '📚', '💄', '🏠'];
            return (
              <Link
                key={cat}
                to={`/shop?category=${cat}`}
                className="bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition p-4 text-center flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl">{emojis[i] || '🛍'}</span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-orange-500 transition">{cat}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Flash Sale */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider">⚡ Flash Sale</p>
            <h3 className="text-2xl font-bold mt-1">Deals ending soon!</h3>
          </div>
          <div className="flex gap-3">
            {[['Hours', timeLeft.h], ['Minutes', timeLeft.m], ['Seconds', timeLeft.s]].map(([label, val]) => (
              <div key={label} className="bg-orange-500 rounded-xl px-4 py-3 text-center min-w-[64px]">
                <div className="text-2xl font-bold font-mono">{pad(val)}</div>
                <div className="text-xs opacity-80 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <Link to="/shop?sort=price-asc" className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-full transition flex items-center gap-2">
            Shop Sale <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
            <p className="text-sm text-gray-500 mt-1">Handpicked just for you</p>
          </div>
          <Link to="/shop" className="text-orange-500 text-sm font-medium flex items-center gap-1 hover:underline">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* Best Sellers Banner */}
      <section className="bg-orange-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-3">Best Sellers This Week</h2>
            <p className="text-orange-100 mb-6">Top rated products loved by thousands of customers</p>
            <Link to="/shop?sort=popular" className="bg-white text-orange-500 font-bold px-8 py-3 rounded-full hover:shadow-lg transition inline-flex items-center gap-2">
              Explore Best Sellers <Star size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_TESTIMONIALS.map(t => (
            <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex text-yellow-400 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={16} className="fill-yellow-400" />)}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">{t.avatar}</div>
                <span className="font-medium text-gray-800 text-sm">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h2>
          <p className="text-gray-400 mb-6">Get the latest deals and offers straight to your inbox</p>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-full text-gray-800 outline-none" />
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full transition">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
