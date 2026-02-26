import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-orange-500 shrink-0">
          Ecomb<span className="text-gray-800">azaar</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-4">
          <div className="flex w-full border border-gray-200 rounded-full overflow-hidden">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 outline-none text-sm"
            />
            <button type="submit" className="bg-orange-500 px-4 text-white hover:bg-orange-600 transition">
              <Search size={18} />
            </button>
          </div>
        </form>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/shop" className="text-gray-700 hover:text-orange-500 font-medium transition">Shop</Link>
          <Link to="/wishlist" className="text-gray-700 hover:text-orange-500 transition">
            <Heart size={22} />
          </Link>
          <Link to="/cart" className="relative text-gray-700 hover:text-orange-500 transition">
            <ShoppingCart size={22} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative">
              <button onClick={() => setDropdownOpen(d => !d)} className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-500">
                <User size={20} />
                <span className="text-sm">{user?.name?.split(' ')[0] || 'User'}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-2 w-44 z-50 border">
                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                    <User size={14} /> Profile
                  </Link>
                  <Link to="/orders" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                    <Package size={14} /> My Orders
                  </Link>
                  <hr className="my-1" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setMenuOpen(m => !m)} className="md:hidden text-gray-700">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 border-t">
          <form onSubmit={handleSearch} className="flex mt-3">
            <input
              type="text" placeholder="Search products..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-200 rounded-l-full px-4 py-2 text-sm outline-none"
            />
            <button type="submit" className="bg-orange-500 px-3 rounded-r-full text-white"><Search size={16} /></button>
          </form>
          <Link to="/shop" className="text-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link to="/cart" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>Cart ({itemCount})</Link>
          <Link to="/wishlist" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>Wishlist</Link>
          {user ? (
            <>
              <Link to="/profile" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={handleLogout} className="text-left text-red-500 py-1">Logout</button>
            </>
          ) : (
            <Link to="/login" className="text-orange-500 font-medium py-1" onClick={() => setMenuOpen(false)}>Login / Register</Link>
          )}
        </div>
      )}
    </nav>
  );
}
