import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE } from '../data/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone, faEnvelope, faMapMarkerAlt, faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import '../assets/ShopProfile.css';

const ShopProfile = () => {
  const { sellerId } = useParams();
  
  const [shopData, setShopData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  useEffect(() => {
    fetchShopData();
  }, [sellerId]);

  useEffect(() => {
    if (shopData) {
      fetchShopData();
    }
  }, [searchTerm, sortBy, priceRange]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (sortBy) params.append('sort', sortBy);
      if (priceRange.min) params.append('min_price', priceRange.min);
      if (priceRange.max) params.append('max_price', priceRange.max);
      
      const response = await fetch(
        `${API_BASE}/api/users/shop/${sellerId}/?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Không thể tải thông tin shop');
      }
      
      const data = await response.json();
      setShopData(data.seller);
      setProducts(data.products.results || []);
      
    } catch (err) {
      console.error('Error fetching shop:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchShopData();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <>
        <Header />
        <div className="shop-loading">
          <div className="spinner"></div>
          <p>Đang tải thông tin shop...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="shop-error">
          <h2><FontAwesomeIcon icon={faTimesCircle} /> Lỗi</h2>
          <p>{error}</p>
          <Link to="/shops" className="btn btn-primary">Xem tất cả shop</Link>
        </div>
        <Footer />
      </>
    );
  }

  const avatarUrl = shopData?.profile?.avatar || '/default-avatar.png';
  const bio = shopData?.profile?.bio || 'Chưa có mô tả';
  const address = shopData?.profile?.address || '';
  const city = shopData?.profile?.city || '';

  return (
    <>
      
      <div className="shop-profile-page">
        
        {/* Shop Header */}
        <div className="shop-header">
          <div className="shop-header-container">
            <div className="shop-banner">
              <div className="banner-overlay"></div>
            </div>
            
            <div className="shop-info-card">
              <div className="shop-avatar">
                <img 
                  src={avatarUrl}
                  alt={shopData.full_name || shopData.username}
                  onError={(e) => e.target.src = '/default-avatar.png'}
                />
                <div className="verified-badge">✓</div>
              </div>
              
              <div className="shop-details">
                <h1 className="shop-name">
                  {shopData.full_name || shopData.username}
                </h1>
                <p className="shop-username">@{shopData.username}</p>
                
                <p className="shop-bio">{bio}</p>
                
                <div className="shop-stats">
                  <div className="stat-item">
                    <span className="stat-icon">📦</span>
                    <div className="stat-info">
                      <strong>{shopData.total_products}</strong>
                      <small>Sản phẩm</small>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-icon">⭐</span>
                    <div className="stat-info">
                      <strong>{shopData.rating}</strong>
                      <small>Đánh giá</small>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-icon">🛒</span>
                    <div className="stat-info">
                      <strong>{shopData.total_sales}</strong>
                      <small>Đã bán</small>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-icon">📅</span>
                    <div className="stat-info">
                      <strong>{shopData.joined_date}</strong>
                      <small>Tham gia</small>
                    </div>
                  </div>
                </div>
                
                {(address || city) && (
                  <div className="shop-contact">
                    {shopData.phone && (
                      <div className="contact-item">
                        <span className="contact-icon"><FontAwesomeIcon icon={faPhone} /></span>
                        <span>{shopData.phone}</span>
                      </div>
                    )}
                    
                    {shopData.email && (
                      <div className="contact-item">
                        <span className="contact-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                        <span>{shopData.email}</span>
                      </div>
                    )}
                    
                    {(address || city) && (
                      <div className="contact-item">
                        <span className="contact-icon"><FontAwesomeIcon icon={faMapMarkerAlt} /></span>
                        <span>{address} {city}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="shop-actions">
                  <button className="btn btn-primary">
                    💬 Chat với Shop
                  </button>
                  <button className="btn btn-outline">
                    ➕ Theo dõi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="shop-products-section">
          <div className="shop-container">
            
            {/* Filters Bar */}
            <div className="products-filters">
              <div className="filter-row">
                <div className="filter-group search-group">
                  <span className="filter-label">🔍</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm trong shop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                  />
                </div>
                
                <div className="filter-group price-group">
                  <span className="filter-label">💰</span>
                  <input
                    type="number"
                    placeholder="Từ"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    className="filter-input-small"
                  />
                  <span className="price-separator">-</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    className="filter-input-small"
                  />
                </div>
                
                <div className="filter-group">
                  <span className="filter-label">📊</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-select"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="price_low">Giá thấp → cao</option>
                    <option value="price_high">Giá cao → thấp</option>
                    <option value="name">Tên A → Z</option>
                  </select>
                </div>

                <div className="filter-actions">
                  <button className="btn-filter btn-apply" onClick={handleApplyFilters}>
                    Áp dụng
                  </button>
                  <button className="btn-filter btn-clear" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            {/* Products Count */}
            <div className="products-header">
              <h2>
                Sản phẩm của shop 
                <span className="products-count">({products.length})</span>
              </h2>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <div className="products-grid">
                  {currentProducts.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ← Trước
                    </button>

                    <div className="page-numbers">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
                              onClick={() => paginate(pageNumber)}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} className="page-dots">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      className="page-btn"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-products">
                <div className="empty-icon">📦</div>
                <h3>
                  {searchTerm || priceRange.min || priceRange.max
                    ? 'Không tìm thấy sản phẩm phù hợp'
                    : 'Shop chưa có sản phẩm nào'}
                </h3>
                <p>
                  {searchTerm || priceRange.min || priceRange.max
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Vui lòng quay lại sau hoặc xem các shop khác'}
                </p>
                {(searchTerm || priceRange.min || priceRange.max) && (
                  <button onClick={handleClearFilters} className="btn btn-primary">
                    Xóa bộ lọc
                  </button>
                )}
                <Link to="/shops" className="btn btn-outline" style={{marginTop: '1rem'}}>
                  Xem các shop khác
                </Link>
              </div>
            )}

          </div>
        </div>

      </div>

      <Footer />
    </>
  );
};

export default ShopProfile;