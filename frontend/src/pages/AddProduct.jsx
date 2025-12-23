import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../data/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faDollarSign, faCamera, faCheckCircle, faWandMagicSparkles, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import '../assets/AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageFile: null,
    category: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catError, setCatError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCats(true);
      setCatError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/categories/`, { timeout: 10000 });
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.results ?? []);
        if (!cancelled) setCategories(list);
      } catch (err) {
        console.error('loadCategories error', err);
        if (!cancelled) setCatError(err.response?.data ?? err.message ?? 'Lỗi');
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    }

    loadCategories();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    setMessage({ type: '', text: '' });
    const { name, value, files } = e.target;

    if (name === 'imageFile') {
      const file = files[0];
      setForm((prev) => ({ ...prev, imageFile: file }));

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, imageFile: null }));
    setImagePreview(null);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Tên sản phẩm không được để trống';
    if (form.name.length < 3) return 'Tên sản phẩm phải có ít nhất 3 ký tự';
    if (!form.price || Number(form.price) <= 0) return 'Giá phải lớn hơn 0';
    if (form.stock === '' || Number(form.stock) < 0) return 'Số lượng phải >= 0';
    if (!form.category) return 'Vui lòng chọn danh mục';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const err = validate();
    if (err) {
      setMessage({ type: 'error', text: err });
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('description', form.description.trim());
    formData.append('price', Number(form.price));
    formData.append('stock', Number(form.stock));
    formData.append('category', form.category);
    if (form.imageFile) formData.append('image', form.imageFile);

    try {
      await axios.post(`${API_BASE}/api/products/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({ type: 'success', text: '✅ Tạo sản phẩm thành công!' });
      setTimeout(() => navigate('/seller/products'), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-wrapper">
      <div className="add-product-page">
        <div className="add-product-container">

          {/* Header */}
          <div className="add-product-header">
            <FontAwesomeIcon icon={faBox} size="3x" style={{ marginBottom: '15px' }} />
            <h1>Thêm Sản Phẩm Mới</h1>
            <p>Điền thông tin sản phẩm của bạn</p>
          </div>

          {/* Form */}
          <div className="add-product-form">
            <Link to="/seller/products" className="back-link">
              <FontAwesomeIcon icon={faArrowLeft} /> Quay lại Danh sách sản phẩm
            </Link>

            <div className="required-fields-note">
              Các trường đánh dấu <span className="required">*</span> là bắt buộc
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Product Name */}
              <div className="form-group">
                <label className="form-label">
                  Tên sản phẩm <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Nhập tên sản phẩm..."
                  value={form.name}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={200}
                  autoFocus
                />
                <span className={`char-counter ${form.name.length > 180 ? 'warning' : ''} ${form.name.length >= 200 ? 'error' : ''}`}>
                  {form.name.length}/200 ký tự
                </span>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">
                  Danh mục <span className="required">*</span>
                </label>
                <select
                  name="category"
                  className="form-select"
                  value={form.category}
                  onChange={handleChange}
                  disabled={loading || loadingCats}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {loadingCats && (
                  <div className="loading-text">
                    <span className="loading-spinner"></span>
                    Đang tải danh mục...
                  </div>
                )}
                {catError && (
                  <div className="category-error">
                    ⚠️ Lỗi tải danh mục: {String(catError)}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">
                  Mô tả sản phẩm
                  <span className="form-label-optional">(Không bắt buộc)</span>
                </label>
                <textarea
                  name="description"
                  className="form-input"
                  placeholder="Nhập mô tả chi tiết về sản phẩm: tính năng, chất liệu, hướng dẫn sử dụng..."
                  rows={5}
                  value={form.description}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={1000}
                />
                <span className={`char-counter ${form.description.length > 900 ? 'warning' : ''} ${form.description.length >= 1000 ? 'error' : ''}`}>
                  {form.description.length}/1000 ký tự
                </span>
              </div>

              {/* Price & Stock */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Giá <span className="required">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-icon"><FontAwesomeIcon icon={faDollarSign} /></span>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      name="price"
                      className="form-input"
                      placeholder="0"
                      value={form.price}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <span className="helper-text">Đơn vị: VNĐ</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Số lượng <span className="required">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-icon"><FontAwesomeIcon icon={faBox} /></span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="stock"
                      className="form-input"
                      placeholder="0"
                      value={form.stock}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <span className="helper-text">Số lượng còn trong kho</span>
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">
                  Hình ảnh sản phẩm
                  <span className="form-label-optional">(Khuyến nghị)</span>
                </label>
                
                {!imagePreview ? (
                  <label className="file-input-label">
                    <FontAwesomeIcon icon={faCamera} size="2x" />
                    <div>
                      <strong>Nhấp để chọn hoặc kéo thả ảnh vào đây</strong>
                      <br />
                      <small>PNG, JPG, JPEG (Tối đa 5MB)</small>
                    </div>
                    <input
                      type="file"
                      name="imageFile"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </label>
                ) : (
                  <div className="file-preview">
                    <img src={imagePreview} alt="Preview" />
                    <div className="file-name">
                      <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#28a745' }} />
                      <span>{form.imageFile?.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={removeImage}
                        title="Xóa ảnh"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
                <span className="helper-text">
                  Ảnh chất lượng cao giúp sản phẩm hấp dẫn hơn với khách hàng
                </span>
              </div>

              {/* Submit Button */}
              <div className="form-footer">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Đang tạo sản phẩm...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faWandMagicSparkles} style={{ marginRight: '8px' }} />
                      Tạo sản phẩm
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/seller/products')}
                  disabled={loading}
                >
                  Hủy bỏ
                </button>

                <p className="form-footer-text">
                  Cần trợ giúp? <a href="/help">Xem hướng dẫn</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
