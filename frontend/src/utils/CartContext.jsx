import React, { createContext, useContext, useState, useEffect } from 'react';
import { extractVariantOptions } from './variantUtils';
import * as cartApi from './cartApi';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Load from localStorage by default; we'll replace with server copy if authenticated
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // On mount — if user has token, load server cart and sync
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    cartApi.setAuthToken(token);
    // fetch cart from backend and map to local shape
    cartApi.getCart()
      .then((data) => {
        if (!Array.isArray(data)) return;
        const mapped = data.map((ci) => ({
          // keep product id as id for compatibility with components
          id: ci.product_id || (ci.product && ci.product.id),
          cartItemId: ci.id,
          name: ci.product?.name || ci.product_name || '',
          price: Number(ci.product?.price ?? ci.price ?? 0),
          image: (ci.product && (ci.product.image || ci.product.image_url)) || '',
          quantity: ci.quantity || 1,
          color: ci.color || '',
          size: ci.size || '',
          stock: ci.product?.stock ?? null,
          colorOptions: ci.product?.color_options ?? [],
          sizeOptions: ci.product?.size_options ?? [],
        }));
        setCartItems(mapped);
      })
      .catch(() => {
        // ignore — keep local cart
      });
  }, []);

  const addToCart = async (product, quantity = 1, options = {}) => {
    const token = localStorage.getItem('access_token');
    const color = options.color || '';
    const size = options.size || '';

    if (token) {
      cartApi.setAuthToken(token);
      try {
        const resp = await cartApi.addToCart({ product_id: product.id, quantity, color, size });
        // resp should be the created/updated cart item
        const ci = resp;
        const mapped = {
          id: ci.product_id || (ci.product && ci.product.id),
          cartItemId: ci.id,
          name: ci.product?.name || product.name,
          price: Number(ci.product?.price ?? product.price ?? 0),
          image: (ci.product && (ci.product.image || ci.product.image_url)) || product.image || '',
          quantity: ci.quantity || quantity,
          color: ci.color || color,
          size: ci.size || size,
          stock: ci.product?.stock ?? product.stock,
          colorOptions: ci.product?.color_options ?? extractVariantOptions(product).colors,
          sizeOptions: ci.product?.size_options ?? extractVariantOptions(product).sizes,
        };

        setCartItems((prev) => {
          const existing = prev.find(it => it.cartItemId && it.cartItemId === mapped.cartItemId) || prev.find(it => it.id === mapped.id && it.color === mapped.color && it.size === mapped.size);
          if (existing) {
            return prev.map(it => (it.cartItemId === mapped.cartItemId || (it.id === mapped.id && it.color === mapped.color && it.size === mapped.size)) ? { ...it, quantity: mapped.quantity, cartItemId: mapped.cartItemId } : it);
          }
          return [...prev, mapped];
        });
        return mapped;
      } catch (err) {
        // fallback to local-only behavior
      }
    }

    // fallback: local cart
    setCartItems(prevItems => {
      const { colors = [], sizes = [] } = extractVariantOptions(product || {});
      const existingItem = prevItems.find(
        item => item.id === product.id && 
                item.color === color && 
                item.size === size
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id && 
          item.color === color && 
          item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        color,
        size,
        stock: product.stock,
        colorOptions: colors,
        sizeOptions: sizes,
      }];
    });
  };

  const removeFromCart = async (productId, options = {}) => {
    const token = localStorage.getItem('access_token');
    const color = options.color || '';
    const size = options.size || '';
    if (token) {
      cartApi.setAuthToken(token);
      // try find cartItemId
      const found = cartItems.find(it => it.id === productId && it.color === color && it.size === size);
      const cartItemId = found?.cartItemId;
      if (cartItemId) {
        try {
          await cartApi.removeCartItem(cartItemId);
        } catch (err) {
          // ignore and continue to update UI
        }
      }
    }
    setCartItems(prevItems => prevItems.filter(item => !(item.id === productId && item.color === color && item.size === size)));
  };

  const updateQuantity = async (productId, quantity, options = {}) => {
    const color = options.color || '';
    const size = options.size || '';
    if (quantity <= 0) {
      await removeFromCart(productId, options);
      return;
    }

    const token = localStorage.getItem('access_token');
    const found = cartItems.find(it => it.id === productId && it.color === color && it.size === size);
    const cartItemId = found?.cartItemId;
    if (token && cartItemId) {
      cartApi.setAuthToken(token);
      try {
        const res = await cartApi.updateCartItem(cartItemId, { quantity });
        // update local copy
        setCartItems(prev => prev.map(it => (it.cartItemId === cartItemId ? { ...it, quantity: res.quantity } : it)));
        return;
      } catch (err) {
        // fallback to local update
      }
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId && 
        item.color === color && 
        item.size === size
          ? { ...item, quantity: Math.min(quantity, item.stock || 999) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};