import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Ecomb<span className="text-orange-500">azaar</span>
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Your one-stop destination for premium products at unbeatable prices. Quality meets convenience.
          </p>
          <div className="flex gap-3">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-orange-500 transition">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {[['Home', '/'], ['Shop', '/shop'], ['Cart', '/cart'], ['Wishlist', '/wishlist'], ['My Orders', '/orders']].map(([label, path]) => (
              <li key={path}><Link to={path} className="hover:text-orange-500 transition">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-white font-semibold mb-4">Categories</h3>
          <ul className="space-y-2 text-sm">
            {['Electronics', 'Fashion', 'Sports', 'Kitchen', 'Beauty', 'Books'].map(cat => (
              <li key={cat}><Link to={`/shop?category=${cat}`} className="hover:text-orange-500 transition">{cat}</Link></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-orange-500" /> 123 Market Street, Mumbai, India</li>
            <li className="flex items-center gap-2"><Phone size={16} className="text-orange-500" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail size={16} className="text-orange-500" /> support@ecombazaar.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} EcombAzaar. All rights reserved.
      </div>
    </footer>
  );
}
