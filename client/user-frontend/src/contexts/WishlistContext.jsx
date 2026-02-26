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
        // wishlist is array of populated product objects
        const ids = (data.user?.wishlist || []).map(p => p._id || p);
        setWishlist(ids);
      })
      .catch(() => setWishlist([]));
  }, [user]);

  const toggleWishlist = useCallback(async (product) => {
    if (!user) return false;
    try {
      const { data } = await api.put(`/auth/wishlist/${product._id}`);
      // backend returns array of ObjectId strings
      const ids = data.wishlist.map(id => id.toString ? id.toString() : id);
      setWishlist(ids);
      return ids.includes(product._id.toString());
    } catch { return false; }
  }, [user]);

  const isInWishlist = (productId) => {
    const pid = productId?.toString ? productId.toString() : productId;
    return wishlist.some(id => {
      const wid = id?._id ? id._id.toString() : id?.toString ? id.toString() : id;
      return wid === pid;
    });
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, setWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
