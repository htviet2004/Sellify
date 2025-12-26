import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../data/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, faChartBar, faCheckCircle, faTimesCircle, faExclamationTriangle,
  faSearch, faPlus, faArrowLeft, faEye, faEdit, faBan, faTrash, faThLarge, faList
} from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/formatPrice';
import '../assets/SellerProducts.css';

const SellerProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-high, price-low, name
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    outOfStock: 0
  });

  useEffect(() => {
    if (user && user.user_type !== 'seller') {
      navigate('/dashboard');
    } else if (user) {
      fetchProducts();
    }
  }, [user, navigate]);

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(p => p.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(p => !p.is_active);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE}/api/seller/products/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data);
      
      // Calculate stats
      const newStats = {
        total: data.length,
        active: data.filter(p => p.is_active).length,
        inactive: data.filter(p => !p.is_active).length,
        outOfStock: data.filter(p => p.stock === 0).length
      };
      setStats(newStats);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'ẩn' : 'hiện'} sản phẩm này?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/products/${productId}/toggle/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update product');

      const updatedProduct = await response.json();
      
      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? updatedProduct : p
      ));
      
      alert(`Đã ${!currentStatus ? 'hiện' : 'ẩn'} sản phẩm thành công!`);
    } catch (err) {
      alert('Lỗi khi cập nhật sản phẩm: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Bạn có chắc muốn XÓA sản phẩm "${productName}"?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/products/${productId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete product');

      // Remove from local state
      setProducts(products.filter(p => p.id !== productId));
      alert('Đã xóa sản phẩm thành công!');
    } catch (err) {
      alert('Lỗi khi xóa sản phẩm: ' + err.message);
    }
  };

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <>
        <div className="sp-loading">
          <div className="sp-spinner"></div>
          <p>Đang tải sản phẩm...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      
      <div className="sp-page">
        <div className="sp-container">
          
          {/* Page Header */}
          <div className="sp-header">
            <div className="sp-header-left">
              <Link to="/seller/dashboard" className="sp-back-btn">
                <FontAwesomeIcon icon={faArrowLeft} /> Dashboard
              </Link>
              <div>
                <h1><FontAwesomeIcon icon={faBox} /> Quản lý sản phẩm</h1>
                <p>Quản lý tất cả sản phẩm của bạn</p>
              </div>
            </div>
            <Link to="/seller/products/add" className="sp-btn sp-btn-primary" style={{ width: "230px" }}>
              <FontAwesomeIcon icon={faPlus} /> Thêm sản phẩm mới
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="sp-stats-row">
            <div className="sp-stat-card">
              <div className="sp-stat-icon"><FontAwesomeIcon icon={faChartBar} /></div>
              <div className="sp-stat-info">
                <h3>{stats.total}</h3>
                <p>Tổng sản phẩm</p>
              </div>
            </div>
            <div className="sp-stat-card sp-active">
              <div className="sp-stat-icon"><FontAwesomeIcon icon={faCheckCircle} /></div>
              <div className="sp-stat-info">
                <h3>{stats.active}</h3>
                <p>Đang hoạt động</p>
              </div>
            </div>
            <div className="sp-stat-card sp-inactive">
              <div className="sp-stat-icon"><FontAwesomeIcon icon={faTimesCircle} /></div>
              <div className="sp-stat-info">
                <h3>{stats.inactive}</h3>
                <p>Đã ẩn</p>
              </div>
            </div>
            <div className="sp-stat-card sp-warning">
              <div className="sp-stat-icon"><FontAwesomeIcon icon={faExclamationTriangle} /></div>
              <div className="sp-stat-info">
                <h3>{stats.outOfStock}</h3>
                <p>Hết hàng</p>
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="sp-filters">
            <div className="sp-filters-row">
              {/* Search */}
              <div className="sp-search">
                <span className="sp-search-icon"><FontAwesomeIcon icon={faSearch} /></span>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="sp-search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select 
                className="sp-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã ẩn</option>
              </select>

              {/* Sort */}
              <select 
                className="sp-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="price-high">Giá cao → thấp</option>
                <option value="price-low">Giá thấp → cao</option>
                <option value="name">Tên A → Z</option>
              </select>

              {/* View Mode */}
              <div className="sp-view-toggle">
                <button 
                  className={`sp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Xem dạng lưới"
                >
                  <FontAwesomeIcon icon={faThLarge} />
                </button>
                <button 
                  className={`sp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Xem dạng danh sách"
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </div>
            </div>

            {/* Results Info */}
            <div className="sp-results">
              <p>
                Hiển thị <strong>{indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)}</strong> 
                {' '}trong <strong>{filteredProducts.length}</strong> sản phẩm
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="sp-error">
              <FontAwesomeIcon icon={faTimesCircle} /> Lỗi: {error}
              <button onClick={fetchProducts}>Thử lại</button>
            </div>
          )}

          {/* Products Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><FontAwesomeIcon icon={faBox} size="4x" /></div>
              <h2>Không tìm thấy sản phẩm</h2>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Thử thay đổi bộ lọc hoặc tìm kiếm' 
                  : 'Bạn chưa có sản phẩm nào'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link to="/seller/products/add" className="sp-btn sp-btn-primary">
                  <FontAwesomeIcon icon={faPlus} /> Thêm sản phẩm đầu tiên
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className={`sp-products ${viewMode}`}>
                {currentProducts.map((product) => (
                  <div key={product.id} className="sp-card">
                    
                    {/* Product Image */}
                    <div className="sp-card-image">
                      <img 
                        src={product.image || '/placeholder.png'} 
                        alt={product.name}
                        className="sp-card-img"
                      />
                      <div className="sp-badges">
                        {product.stock === 0 && (
                          <span className="sp-badge sp-badge-danger">Hết hàng</span>
                        )}
                        {!product.is_active && (
                          <span className="sp-badge sp-badge-secondary">Đã ẩn</span>
                        )}
                        {product.is_active && product.stock > 0 && (
                          <span className="sp-badge sp-badge-success">Đang bán</span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="sp-card-info">
                      <h3 className="sp-card-title">{product.name}</h3>
                      
                      <p className="sp-card-desc">
                        {product.description?.substring(0, 100)}
                        {product.description?.length > 100 ? '...' : ''}
                      </p>

                      <div className="sp-card-meta">
                        <div className="sp-meta-item">
                          <span className="sp-meta-label">Giá:</span>
                          <span className="sp-meta-value sp-price">{formatPrice(product.price || 0)}</span>
                        </div>
                        <div className="sp-meta-item">
                          <span className="sp-meta-label">Kho:</span>
                          <span className={`sp-meta-value sp-stock ${product.stock === 0 ? 'sp-out' : ''}`}>
                            {product.stock}
                          </span>
                        </div>
                        <div className="sp-meta-item">
                          <span className="sp-meta-label">Danh mục:</span>
                          <span className="sp-meta-value">{product.category_name || 'N/A'}</span>
                        </div>
                        <div className="sp-meta-item">
                          <span className="sp-meta-label">Tạo lúc:</span>
                          <span className="sp-meta-value">{new Date(product.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Actions */}
                    <div className="sp-actions">
                      <Link 
                        to={`/products/${product.id}`}
                        className="sp-action-btn sp-view"
                        title="Xem chi tiết"
                      >
                        <FontAwesomeIcon icon={faEye} /> Xem
                      </Link>
                      <Link 
                        to={`/seller/products/edit/${product.id}`}
                        className="sp-action-btn sp-edit"
                        title="Chỉnh sửa"
                      >
                        <FontAwesomeIcon icon={faEdit} /> Sửa
                      </Link>
                      <button 
                        className={`sp-action-btn sp-toggle ${product.is_active ? 'hide' : 'show'}`}
                        onClick={() => handleToggleStatus(product.id, product.is_active)}
                        title={product.is_active ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                      >
                        {product.is_active ? <><FontAwesomeIcon icon={faBan} /> Ẩn</> : <><FontAwesomeIcon icon={faCheckCircle} /> Hiện</>}
                      </button>
                      <button 
                        className="sp-action-btn sp-delete"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        title="Xóa sản phẩm"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Xóa
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="sp-pagination">
                  <button 
                    className="sp-page-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Trước
                  </button>
                  
                  <div className="sp-page-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            className={`sp-page-number ${currentPage === pageNumber ? 'active' : ''}`}
                            onClick={() => paginate(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="sp-page-dots">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    className="sp-page-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
};

export default SellerProducts;