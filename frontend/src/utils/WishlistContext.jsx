import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import wishlistApi from './wishlistApi';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
};

const normalize = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return payload.data ?? [];
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const isBuyer = user?.user_type === 'buyer';
  const [wishlist, setWishlist] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetState = useCallback(() => {
    setWishlist([]);
    setSavedItems([]);
    setError(null);
  }, []);

  const loadAll = useCallback(async () => {
    if (!isBuyer) {
      resetState();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [wishlistData, savedData] = await Promise.all([
        wishlistApi.getWishlist(),
        wishlistApi.getSavedItems(),
      ]);
      setWishlist(normalize(wishlistData));
      setSavedItems(normalize(savedData));
    } catch (err) {
      console.error('Wishlist load error', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isBuyer, resetState]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const findWishlistItem = useCallback((productId, color = '', size = '') =>
    wishlist.find(
      (item) =>
        item?.product?.id === productId &&
        (item.color || '') === (color || '') &&
        (item.size || '') === (size || '')
    ),
  [wishlist]);

  const addToWishlist = useCallback(async (productId, { color = '', size = '', note = '' } = {}) => {
    if (!isBuyer) throw new Error('Bạn cần đăng nhập bằng tài khoản người mua.');
    const payload = {
      product_id: productId,
      color,
      size,
      note,
    };
    const result = await wishlistApi.addWishlistItem(payload);
    setWishlist((prev) => {
      const items = [...prev];
      const idx = items.findIndex((item) => item.id === result.id);
      if (idx >= 0) {
        items[idx] = result;
        return items;
      }
      return [result, ...items];
    });
    return result;
  }, [isBuyer]);

  const removeFromWishlist = useCallback(async (itemId) => {
    if (!isBuyer) throw new Error('Bạn cần đăng nhập bằng tài khoản người mua.');
    await wishlistApi.removeWishlistItem(itemId);
    setWishlist((prev) => prev.filter((item) => item.id !== itemId));
  }, [isBuyer]);

  const toggleWishlist = useCallback(async (product, options = {}) => {
    const color = options.color || '';
    const size = options.size || '';
    const existing = findWishlistItem(product.id, color, size);
    if (existing) {
      await removeFromWishlist(existing.id);
      return { removed: true };
    }
    await addToWishlist(product.id, { color, size });
    return { added: true };
  }, [addToWishlist, findWishlistItem, removeFromWishlist]);

  const saveForLater = useCallback(async ({ productId, quantity = 1, color = '', size = '' }) => {
    if (!isBuyer) throw new Error('Bạn cần đăng nhập bằng tài khoản người mua.');
    const payload = { product_id: productId, quantity, color, size };
    const saved = await wishlistApi.addSavedItem(payload);
    setSavedItems((prev) => {
      const items = [...prev];
      const idx = items.findIndex((item) => item.id === saved.id);
      if (idx >= 0) {
        items[idx] = saved;
        return items;
      }
      return [saved, ...items];
    });
    return saved;
  }, [isBuyer]);

  const updateSavedQuantity = useCallback(async (itemId, quantity) => {
    if (!isBuyer) throw new Error('Bạn cần đăng nhập bằng tài khoản người mua.');
    const updated = await wishlistApi.updateSavedItem(itemId, { quantity });
    setSavedItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
    return updated;
  }, [isBuyer]);

  const removeSavedItem = useCallback(async (itemId) => {
    if (!isBuyer) throw new Error('Bạn cần đăng nhập bằng tài khoản người mua.');
    await wishlistApi.removeSavedItem(itemId);
    setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
  }, [isBuyer]);

  const value = useMemo(() => ({
    wishlist,
    savedItems,
    loading,
    error,
    isBuyer,
    refresh: loadAll,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    findWishlistItem,
    saveForLater,
    updateSavedQuantity,
    removeSavedItem,
  }), [wishlist, savedItems, loading, error, isBuyer, loadAll, addToWishlist, removeFromWishlist, toggleWishlist, findWishlistItem, saveForLater, updateSavedQuantity, removeSavedItem]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
