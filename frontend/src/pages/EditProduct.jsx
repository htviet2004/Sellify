import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../data/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, faCamera, faFileAlt, faMoneyBill, faCog, faSave, 
  faTimes, faArrowLeft, faTimesCircle, faPlus 
} from '@fortawesome/free-solid-svg-icons';
import '../assets/EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // const { user } = useAuth(); // ❌ Xóa dòng này

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    is_active: true,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products/categories/`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // ✅ Dùng useCallback để tránh warning
  const fetchProductData = useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`http://localhost:8000/api/seller/products/${id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = 'Không thể tải thông tin sản phẩm';
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.error('Could not parse error response');
        }

        if (response.status === 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          localStorage.removeItem('access_token');
          setTimeout(() => navigate('/login'), 2000);
        } else if (response.status === 403) {
          errorMessage = 'Bạn không có quyền truy cập sản phẩm này';
        } else if (response.status === 404) {
          errorMessage = 'Không tìm thấy sản phẩm hoặc bạn không phải chủ sở hữu';
        }

        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      
      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: data.price || '',
        stock: data.stock || '',
        category: data.category?.category_id || data.category || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
      });

      if (data.image) {
        setImagePreview(data.image);
      }

    } catch (error) {
      console.error('❌ Error fetching product:', error);
      setErrors({ fetch: error.message });
      
      alert('Lỗi: ' + error.message);
      setTimeout(() => {
        navigate('/seller/products');
      }, 3000);
      
    } finally {
      setLoading(false);
    }
  }, [id, navigate]); // ✅ Thêm dependencies

  useEffect(() => {
    fetchCategories();
    fetchProductData();
  }, [fetchProductData]); // ✅ Thêm fetchProductData vào dependency

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Vui lòng chọn file ảnh' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Kích thước ảnh không được vượt quá 5MB' }));
        return;
      }

      setImageFile(file);
      setRemoveImage(false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên sản phẩm';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả sản phẩm';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Giá phải lớn hơn 0';
    }

    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = 'Số lượng không được âm';
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn danh mục';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setSuccessMessage('');

      const token = localStorage.getItem('access_token');
      
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      submitData.append('category', formData.category);
      submitData.append('is_active', formData.is_active);

      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (removeImage) {
        submitData.append('remove_image', 'true');
      }

      const response = await fetch(`http://localhost:8000/api/seller/products/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          throw new Error(data.error || 'Cập nhật sản phẩm thất bại');
        }
        return;
      }

      setSuccessMessage('✅ Cập nhật sản phẩm thành công!');
      
      setTimeout(() => {
        navigate('/seller/products');
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-product-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="add-product-page">
        <div className="error-container">
          <div className="error-icon"><FontAwesomeIcon icon={faTimesCircle} size="4x" /></div>
          <h2>Lỗi</h2>
          <p>{errors.fetch}</p>
          <Link to="/seller/products" className="btn btn-primary">
            <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        
        <div className="page-header">
          <div className="header-content">
            <Link to="/seller/products" className="back-link">
              <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
            </Link>
            <h1><FontAwesomeIcon icon={faEdit} /> Chỉnh sửa sản phẩm</h1>
            <p>Cập nhật thông tin sản phẩm của bạn</p>
          </div>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}

        {errors.submit && (
          <div className="alert alert-error">
            <FontAwesomeIcon icon={faTimesCircle} /> {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          
          <div className="form-section">
            <h3><FontAwesomeIcon icon={faCamera} /> Hình ảnh sản phẩm</h3>
            
            <div className="image-upload-area">
              {imagePreview ? (
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="image-preview"
                    onError={(e) => {
                      e.target.src = '/placeholder.png';
                    }}
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                  >
                    ✕ Xóa ảnh
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon"><FontAwesomeIcon icon={faCamera} size="3x" /></span>
                  <p>Chưa có ảnh</p>
                </div>
              )}
              
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="image" className="file-label">
                {imagePreview ? 
                  <><FontAwesomeIcon icon={faEdit} /> Thay đổi ảnh</> : 
                  <><FontAwesomeIcon icon={faPlus} /> Chọn ảnh</>
                }
              </label>
              
              {errors.image && (
                <span className="error-message">{errors.image}</span>
              )}
              <p className="help-text">
                Chấp nhận: JPG, PNG, GIF. Tối đa 5MB
              </p>
            </div>
          </div>

          <div className="form-section">
            <h3><FontAwesomeIcon icon={faFileAlt} /> Thông tin cơ bản</h3>
            
            <div className="form-group">
              <label htmlFor="name">
                Tên sản phẩm <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                placeholder="VD: iPhone 15 Pro Max"
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Mô tả sản phẩm <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={errors.description ? 'error' : ''}
                rows="5"
                placeholder="Mô tả chi tiết về sản phẩm..."
              />
              {errors.description && (
                <span className="error-message">{errors.description}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Danh mục <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="error-message">{errors.category}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3><FontAwesomeIcon icon={faMoneyBill} /> Giá & Kho hàng</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">
                  Giá bán (VNĐ) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={errors.price ? 'error' : ''}
                  placeholder="99000"
                  min="0"
                  step="1000"
                />
                {errors.price && (
                  <span className="error-message">{errors.price}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="stock">
                  Số lượng <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className={errors.stock ? 'error' : ''}
                  placeholder="100"
                  min="0"
                />
                {errors.stock && (
                  <span className="error-message">{errors.stock}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><FontAwesomeIcon icon={faCog} /> Trạng thái</h3>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span className="checkbox-text">
                  <strong>Hiển thị sản phẩm</strong>
                  <small>Sản phẩm sẽ được hiển thị trên shop của bạn</small>
                </span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/seller/products')}
              disabled={submitting}
            >
              <FontAwesomeIcon icon={faTimes} /> Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-small"></span>
                  Đang cập nhật...
                </>
              ) : (
                <><FontAwesomeIcon icon={faSave} /> Cập nhật sản phẩm</>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default EditProduct;