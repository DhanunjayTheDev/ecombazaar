import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist from profile whenever user changes
  useEffect(() => {
    if (!user) { setWishlist([]); return; }
    api.get('/auth/profile')
      .then(({ data }) => {
        // Store full populated product objects
        setWishlist(data.user?.wishlist || []);
      })
      .catch(() => setWishlist([]));
  }, [user]);

  const toggleWishlist = useCallback(async (product) => {
    if (!user) return false;
    try {
      const { data } = await api.put(`/auth/wishlist/${product._id}`);
      // backend returns array of ObjectId strings — use them to sync local state
      const ids = data.wishlist.map(id => id.toString ? id.toString() : id);
      const isNowIn = ids.includes(product._id.toString());
      setWishlist(prev => {
        if (isNowIn) {
          const exists = prev.some(p => (p._id || p).toString() === product._id.toString());
          return exists ? prev : [...prev, product];
        }
        return prev.filter(p => (p._id || p).toString() !== product._id.toString());
      });
      return isNowIn;
    } catch { return false; }
  }, [user]);

  const isInWishlist = (productId) => {
    const pid = productId?.toString ? productId.toString() : productId;
    return wishlist.some(item => {
      const id = item?._id ? item._id.toString() : item?.toString ? item.toString() : item;
      return id === pid;
    });
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, setWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
