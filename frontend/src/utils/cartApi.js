
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
}

export const getCart = () => API.get('/cart/').then(r => r.data);
export const addToCart = (payload) => API.post('/cart/', payload).then(r => r.data);
export const updateCartItem = (id, payload) => API.put(`/cart/${id}/`, payload).then(r => r.data);
export const removeCartItem = (id) => API.delete(`/cart/${id}/`).then(r => r.data);
export const checkout = (orderData) => API.post('/cart/checkout/', orderData).then(r => r.data);

export default API;
