import api from './api';

// Tạo sản phẩm (có category)
const createProduct = async (data) => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  formData.append('price', String(data.price));
  formData.append('stock', String(data.stock));
  if (data.category) formData.append('category', String(data.category));
  if (data.imageFile) {
    formData.append('image', data.imageFile);
  }

  const res = await api.post('/products/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// Lấy danh sách category (public)
const getCategories = async () => {
  const res = await api.get('/products/categories/');
  return res.data;
};

// Tạo category (admin)
const createCategory = async (payload) => {
  const res = await api.post('/products/categories/', payload);
  return res.data;
};

export default {
  createProduct,
  getCategories,
  createCategory,
};