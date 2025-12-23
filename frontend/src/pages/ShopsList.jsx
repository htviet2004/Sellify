import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../data/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../assets/ShopsList.css';

const ShopsList = () => {
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchShops();
  }, [sortBy]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = shops.filter(shop =>
        shop.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.profile?.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredShops(filtered);
    } else {
      setFilteredShops(shops);
    }
  }, [searchTerm, shops]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (sortBy) params.append('sort', sortBy);
      
      const response = await fetch(
        `${API_BASE}/api/users/shops/?${params.toString()}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch shops');
      
      const data = await response.json();
      console.log('Shops data:', data);
      
      setShops(data.results || []);
      setFilteredShops(data.results || []);
      
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="shops-loading">
          <div className="spinner"></div>
          <p>Đang tải danh sách shop...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>    
      <div className="shops-list-page">
        <div className="shops-container">
          
          <div className="page-header">
            <div className="header-content">
              <h1>🏪 Khám phá Shop</h1>
              <p>Tìm kiếm và mua sắm từ các shop uy tín</p>
            </div>
          </div>

          <div className="search-section">
            <div className="search-wrapper">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm shop theo tên, mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="clear-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Lâu đời nhất</option>
                <option value="popular">Phổ biến nhất</option>
              </select>
            </div>
            
            <div className="shops-count">
              Tìm thấy <strong>{filteredShops.length}</strong> shop
            </div>
          </div>

          {filteredShops.length > 0 ? (
            <div className="shops-grid">
              {filteredShops.map((shop) => (
                <Link
                  key={shop.user_id}
                  to={`/shop/${shop.user_id}`}
                  className="shop-card"
                >
                  <div className="shop-card-banner">
                    <div className="banner-gradient"></div>
                    <div className="shop-badge">
                      <span className="badge-icon">✓</span>
                    </div>
                  </div>
                  
                  <div className="shop-card-avatar">
                    <img
                      src={shop.profile?.avatar || '/default-avatar.png'}
                      alt={shop.full_name || shop.username}
                      onError={(e) => e.target.src = '/default-avatar.png'}
                    />
                  </div>
                  
                  <div className="shop-card-body">
                    <h3 className="shop-title">
                      {shop.full_name || shop.username}
                    </h3>
                    <p className="shop-subtitle">@{shop.username}</p>
                    
                    {shop.profile?.bio && (
                      <p className="shop-description">
                        {shop.profile.bio.substring(0, 80)}
                        {shop.profile.bio.length > 80 && '...'}
                      </p>
                    )}
                    
                    <div className="shop-card-stats">
                      <div className="stat">
                        <span className="stat-icon">📦</span>
                        <div className="stat-content">
                          <span className="stat-value">{shop.total_products}</span>
                          <span className="stat-label">Sản phẩm</span>
                        </div>
                      </div>
                      
                      <div className="stat">
                        <span className="stat-icon">⭐</span>
                        <div className="stat-content">
                          <span className="stat-value">{shop.rating}</span>
                          <span className="stat-label">Đánh giá</span>
                        </div>
                      </div>
                      
                      <div className="stat">
                        <span className="stat-icon">🛒</span>
                        <div className="stat-content">
                          <span className="stat-value">{shop.total_sales}</span>
                          <span className="stat-label">Đã bán</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shop-card-footer">
                    <button className="btn-visit-shop">
                      Xem Shop →
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-shops">
              <div className="empty-icon">🏪</div>
              <h3>Không tìm thấy shop nào</h3>
              <p>
                {searchTerm 
                  ? 'Thử thay đổi từ khóa tìm kiếm'
                  : 'Chưa có shop nào trên hệ thống'}
              </p>
              {searchTerm && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setSearchTerm('')}
                >
                  Xóa tìm kiếm
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
};

export default ShopsList;