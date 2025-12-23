import api from './api';

const normalizeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return payload.data ?? [];
};

const getWishlist = async () => {
  const res = await api.get('/products/wishlist/');
  return normalizeList(res.data);
};

const addWishlistItem = async (payload) => {
  const res = await api.post('/products/wishlist/', payload);
  return res.data;
};

const removeWishlistItem = async (id) => {
  await api.delete(`/products/wishlist/${id}/`);
};

const getSavedItems = async () => {
  const res = await api.get('/products/saved-items/');
  return normalizeList(res.data);
};

const addSavedItem = async (payload) => {
  const res = await api.post('/products/saved-items/', payload);
  return res.data;
};

const updateSavedItem = async (id, payload) => {
  const res = await api.patch(`/products/saved-items/${id}/`, payload);
  return res.data;
};

const removeSavedItem = async (id) => {
  await api.delete(`/products/saved-items/${id}/`);
};

const wishlistApi = {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  getSavedItems,
  addSavedItem,
  updateSavedItem,
  removeSavedItem,
};

export default wishlistApi;
