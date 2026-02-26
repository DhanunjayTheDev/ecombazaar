import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// Guest cart stored in localStorage
const getLocalCart = () => {
  try { return JSON.parse(localStorage.getItem('localCart')) || []; } catch { return []; }
};
const saveLocalCart = (items) => localStorage.setItem('localCart', JSON.stringify(items));

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false); // Prevent duplicate requests

  // Fetch cart from backend OR load from localStorage
  const fetchCart = useCallback(async () => {
    // If already fetching, skip
    if (isFetchingRef.current) return;

    if (!user) { 
      setItems(getLocalCart()); 
      return; 
    }

    isFetchingRef.current = true;
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      if (data.success && data.cart?.items) {
        setItems(data.cart.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setItems([]);
    } finally { 
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  // Fetch cart when user logs in/out
  useEffect(() => {
    fetchCart();
  }, [user, fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    // For guests - store in localStorage
    if (!user) {
      const local = getLocalCart();
      const idx = local.findIndex(i => i.product._id === product._id);
      if (idx > -1) {
        local[idx].quantity += quantity;
      } else {
        local.push({ 
          product, 
          quantity, 
          price: product.discountPrice > 0 ? product.discountPrice : product.price 
        });
      }
      saveLocalCart(local);
      setItems([...local]);
      return;
    }

    // For logged-in users - call backend API
    try {
      const { data } = await api.post('/cart/add', { productId: product._id, quantity });
      if (data.success && data.cart?.items) {
        setItems(data.cart.items);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!user) {
      const local = getLocalCart();
      const idx = local.findIndex(i => i.product._id === productId);
      if (idx > -1) {
        if (quantity <= 0) {
          local.splice(idx, 1);
        } else {
          local[idx].quantity = quantity;
        }
      }
      saveLocalCart(local);
      setItems([...local]);
      return;
    }

    try {
      const { data } = await api.put('/cart/update', { productId, quantity });
      if (data.success && data.cart?.items) {
        setItems(data.cart.items);
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      throw err;
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) {
      const local = getLocalCart().filter(i => i.product._id !== productId);
      saveLocalCart(local);
      setItems(local);
      return;
    }

    try {
      const { data } = await api.delete('/cart/remove', { data: { productId } });
      if (data.success && data.cart?.items) {
        setItems(data.cart.items);
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      throw err;
    }
  };

  const clearCart = async () => {
    setItems([]);
    if (!user) {
      saveLocalCart([]);
      return;
    }

    try {
      await api.delete('/cart/clear');
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const subtotal = items.reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);
  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const shipping = 50;
  const total = parseFloat((subtotal + tax + shipping).toFixed(2));
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      loading, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart, 
      refreshCart: fetchCart, 
      subtotal, 
      tax, 
      shipping, 
      total, 
      itemCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
