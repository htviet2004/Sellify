import React, { useState } from 'react';
import productService from '../utils/productService';
import usePageTitle from '../hooks/usePageTitle';

const AddCategory = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  usePageTitle('Thêm danh mục');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }
    setLoading(true);
    try {
      await productService.createCategory({ name: name.trim() });
      setMessage({ type: 'success', text: 'Category created' });
      setName('');
    } catch (e) {
      const text =
        e.response?.data?.error ||
        e.response?.data?.detail ||
        'Failed to create category';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container" style={{ maxWidth: 600 }}>
        <h1 className="form-title">Add Category</h1>
        <p className="form-subtitle">Create a new category (admin)</p>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCategory;