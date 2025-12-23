import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../data/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faShoppingCart,
  faDollarSign,
  faStar,
  faArrowUp,
  faSearch,
  faPlus,
  faEye,
  faUser,
  faCalendar,
  faClock,
  faTruck,
  faCheckCircle,
  faTimesCircle,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import { formatPrice } from '../utils/formatPrice';
import Footer from '../components/Footer';
import '../assets/SellerDashboard.css';

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    completedOrders: 0,
    averageRating: 0,
    totalViews: 0,
    conversionRate: 0,
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  useEffect(() => {
    if (user && user.user_type !== 'seller') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const fetchSellerData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        console.warn('Chưa đăng nhập - vui lòng đăng nhập để xem dữ liệu');
        setLoading(false);
        return;
      }

      let statsData = null;
      let productsData = [];
      let ordersData = [];

      try {
        const statsRes = await fetch(`${API_BASE}/api/seller/stats/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          statsData = await statsRes.json();
        }
      } catch (err) {
        console.log('Lỗi lấy thống kê:', err);
      }

      try {
        const productsRes = await fetch(`${API_BASE}/api/seller/products/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (productsRes.ok) {
          const rawProducts = await productsRes.json();
          productsData = Array.isArray(rawProducts) ? rawProducts : rawProducts?.results || [];
        }
      } catch (err) {
        console.log('Lỗi lấy sản phẩm:', err);
      }

      try {
        const ordersRes = await fetch(`${API_BASE}/api/orders/seller/orders/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ordersRes.ok) {
          const rawOrders = await ordersRes.json();
          ordersData = Array.isArray(rawOrders) ? rawOrders : rawOrders?.results || [];
        }
      } catch (err) {
        console.log('Lỗi lấy đơn hàng:', err);
      }

      const computedStats = {
        totalProducts: statsData?.total_products ?? productsData.length ?? 0,
        activeProducts: statsData?.active_products ?? productsData.filter((p) => p.is_active).length ?? 0,
        totalOrders: statsData?.total_orders ?? ordersData.length ?? 0,
        pendingOrders: statsData?.pending_orders ?? ordersData.filter((o) => o.status === 'pending').length ?? 0,
        totalRevenue:
          statsData?.total_revenue ?? ordersData.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) ?? 0,
        monthRevenue: statsData?.month_revenue ?? 0,
        completedOrders: statsData?.completed_orders ?? ordersData.filter((o) => o.status === 'delivered').length ?? 0,
        averageRating: statsData?.average_rating ?? 0,
        totalViews: statsData?.total_views ?? 0,
        conversionRate: statsData?.conversion_rate ?? 0,
      };

      setStats(computedStats);
      setAllProducts(productsData);
      setProducts(productsData);
      setAllOrders(ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        monthRevenue: 0,
        completedOrders: 0,
        averageRating: 0,
        totalViews: 0,
        conversionRate: 0,
      });
      setAllProducts([]);
      setProducts([]);
      setAllOrders([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.user_type === 'seller') {
      fetchSellerData();
    }
  }, [user, fetchSellerData]);

  const getFilteredProducts = useCallback(() => {
    const term = searchTerm.toLowerCase();
    return allProducts.filter((product) => {
      const matchesTerm = term ? (product.name || '').toLowerCase().includes(term) : true;
      const matchesFilter =
        productFilter === 'all'
          ? true
          : productFilter === 'active'
          ? product.is_active
          : productFilter === 'inactive'
          ? !product.is_active
          : productFilter === 'low-stock'
          ? (product.stock ?? 0) < 10
          : true;
      return matchesTerm && matchesFilter;
    });
  }, [allProducts, productFilter, searchTerm]);

  const getFilteredOrders = useCallback(() => {
    const term = searchTerm.toLowerCase();
    return allOrders.filter((order) => {
      const matchesFilter = orderFilter === 'all' ? true : orderFilter === order.status;
      const matchesTerm = term
        ? `${order.order_id}`.includes(term) || (order.buyer_name || '').toLowerCase().includes(term)
        : true;
      return matchesFilter && matchesTerm;
    });
  }, [allOrders, orderFilter, searchTerm]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/api/products/${productId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchSellerData();
      }
    } catch (error) {
      console.error('Lỗi xóa sản phẩm:', error);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/api/orders/seller/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchSellerData();
      }
    } catch (error) {
      console.error('Lỗi cập nhật đơn hàng:', error);
    }
  };

  const filteredProducts = getFilteredProducts();
  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <>

        <div className="seller-dashboard-loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="seller-dashboard">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="header-content">
              <div className="header-title">
                <FontAwesomeIcon icon={faShoppingCart} className="header-icon" />
                <div>
                  <h1>Bảng điều khiển người bán</h1>
                  <p className="welcome-text">
                    Chào mừng trở lại, <strong>{user?.full_name || user?.username}</strong>!
                  </p>
                </div>
              </div>
            </div>
            <div className="header-date">
              <FontAwesomeIcon icon={faCalendar} />
              <span>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary">
                <FontAwesomeIcon icon={faBell} />
                <span className="notification-badge">3</span>
              </button>
              <Link to="/seller/products" className="btn btn-secondary">
                <FontAwesomeIcon icon={faBox} /> Toàn bộ sản phẩm
              </Link>
              <Link to="/seller/orders" className="btn btn-secondary">
                <FontAwesomeIcon icon={faShoppingCart} /> Tất cả đơn hàng
              </Link>
              <Link to="/seller/products/new" className="btn btn-primary">
                <FontAwesomeIcon icon={faPlus} /> Thêm sản phẩm mới
              </Link>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-products">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faBox} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalProducts}</div>
                <div className="stat-label">Tổng sản phẩm</div>
                <div className="stat-detail">
                  <span className="success">{stats.activeProducts} đang bán</span>
                  <span className="stat-change positive">
                    <FontAwesomeIcon icon={faArrowUp} />
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card stat-orders">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faShoppingCart} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalOrders}</div>
                <div className="stat-label">Tổng đơn hàng</div>
                <div className="stat-detail">
                  <span className="warning">{stats.pendingOrders} chờ xử lý</span>
                  <span className="stat-change positive">
                    <FontAwesomeIcon icon={faArrowUp} />
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card stat-revenue">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faDollarSign} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatPrice(stats.totalRevenue)}</div>
                <div className="stat-label">Tổng doanh thu</div>
                <div className="stat-detail">
                  <span className="success">+{formatPrice(stats.monthRevenue)} tháng này</span>
                  <span className="stat-change positive">
                    <FontAwesomeIcon icon={faArrowUp} />
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card stat-rating">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faStar} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.averageRating.toFixed(1)}</div>
                <div className="stat-label">Đánh giá trung bình</div>
                <div className="stat-detail">
                  <span>Đơn hoàn thành: {stats.completedOrders}</span>
                  <span className="stat-change positive">
                    <FontAwesomeIcon icon={faArrowUp} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <FontAwesomeIcon icon={faBox} />
              <span>Sản phẩm</span>
              <span className="tab-badge">{stats.totalProducts}</span>
            </button>
            <button
              className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              <span>Đơn hàng</span>
              {stats.pendingOrders > 0 && <span className="tab-badge badge-warning">{stats.pendingOrders}</span>}
            </button>
          </div>

          <div className="dashboard-content">
            {activeTab === 'products' && (
              <div className="products-tab">
                <div className="tab-header">
                  <h2><FontAwesomeIcon icon={faBox} /> Quản lý sản phẩm</h2>
                  <div className="tab-actions">
                    <div className="search-box">
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="filter-select"
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                    >
                      <option value="all">Tất cả sản phẩm</option>
                      <option value="active">Đang bán</option>
                      <option value="inactive">Đã ẩn</option>
                      <option value="low-stock">Sắp hết hàng</option>
                    </select>
                    <Link to="/seller/products/new" className="btn btn-primary">
                      <FontAwesomeIcon icon={faPlus} /> Thêm sản phẩm
                    </Link>
                  </div>
                </div>

                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <div key={product.product_id} className="product-card modern">
                      <div className="product-image-container">
                        <img
                          src={product.image || '/placeholder.png'}
                          alt={product.name}
                          className="product-image"
                        />
                      </div>
                      <div className="product-body">
                        <h3 className="product-title">{product.name}</h3>
                        <div className="product-price-row">
                          <span className="price-badge">{formatPrice(product.price || 0)}</span>
                          <span className={`stock-pill ${product.stock < 10 ? 'low' : 'ok'}`}>
                            Kho: {product.stock ?? 0}
                          </span>
                        </div>
                      </div>
                    
                    </div>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="empty-state-large">
                    <div className="empty-icon">
                      <FontAwesomeIcon icon={faBox} size="4x" />
                    </div>
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>
                      {searchTerm
                        ? 'Thử tìm kiếm với từ khóa khác'
                        : 'Bắt đầu bán hàng bằng cách thêm sản phẩm đầu tiên của bạn'}
                    </p>
                    {!searchTerm && (
                      <Link to="/seller/products/new" className="btn btn-primary btn-lg">
                        <FontAwesomeIcon icon={faPlus} /> Thêm sản phẩm đầu tiên
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="orders-tab">
                <div className="tab-header">
                  <h2><FontAwesomeIcon icon={faShoppingCart} /> Quản lý đơn hàng</h2>
                  <div className="tab-actions">
                    <div className="search-box">
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Tìm mã đơn hoặc tên khách..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="filter-buttons">
                      <button
                        className={`btn-filter ${orderFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('all')}
                      >
                        Tất cả
                      </button>
                      <button
                        className={`btn-filter ${orderFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('pending')}
                      >
                        Chờ xử lý
                      </button>
                      <button
                        className={`btn-filter ${orderFilter === 'processing' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('processing')}
                      >
                        Đang xử lý
                      </button>
                      <button
                        className={`btn-filter ${orderFilter === 'shipped' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('shipped')}
                      >
                        Đang giao
                      </button>
                      <button
                        className={`btn-filter ${orderFilter === 'delivered' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('delivered')}
                      >
                        Đã giao
                      </button>
                    </div>
                  </div>
                </div>

                <div className="orders-table-container">
                  <table className="orders-table modern">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Ngày đặt</th>
                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.order_id} className="order-row">
                          <td className="order-id-cell">
                            <span className="order-id-badge">#{order.order_id}</span>
                          </td>
                          <td>
                            <div className="customer-info">
                              <FontAwesomeIcon icon={faUser} className="customer-icon" />
                              <span>{order.buyer_name || 'Khách hàng'}</span>
                            </div>
                          </td>
                          <td>{order.items_count || 1} sản phẩm</td>
                          <td className="price-cell">{formatPrice(order.total_amount || 0)}</td>
                          <td>
                            <span className={`status-badge status-${order.status}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="date-cell">
                            {formatDate(order.created_at)}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-view"
                                title="Xem chi tiết"
                                onClick={() => navigate(`/seller/orders/${order.order_id}`)}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    className="btn-icon btn-success"
                                    title="Xác nhận"
                                    onClick={() => handleOrderStatusUpdate(order.order_id, 'processing')}
                                  >
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                  </button>
                                  <button
                                    className="btn-icon btn-danger"
                                    title="Hủy"
                                    onClick={() => handleOrderStatusUpdate(order.order_id, 'cancelled')}
                                  >
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                  </button>
                                </>
                              )}
                              {order.status === 'processing' && (
                                <button
                                  className="btn-icon btn-info"
                                  title="Đánh dấu đang giao"
                                  onClick={() => handleOrderStatusUpdate(order.order_id, 'shipped')}
                                >
                                  <FontAwesomeIcon icon={faTruck} />
                                </button>
                              )}
                              {order.status === 'shipped' && (
                                <button
                                  className="btn-icon btn-success"
                                  title="Đã giao hàng"
                                  onClick={() => handleOrderStatusUpdate(order.order_id, 'delivered')}
                                >
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredOrders.length === 0 && (
                    <div className="empty-state-large">
                      <div className="empty-icon">
                        <FontAwesomeIcon icon={faShoppingCart} size="4x" />
                      </div>
                      <h3>Không tìm thấy đơn hàng</h3>
                      <p>
                        {searchTerm
                          ? 'Không có đơn hàng nào khớp với tìm kiếm'
                          : orderFilter !== 'all'
                          ? `Không có đơn hàng ${getStatusText(orderFilter)} nào`
                          : 'Đơn hàng sẽ hiển thị ở đây khi có khách đặt mua'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    pending: (
      <>
        <FontAwesomeIcon icon={faClock} /> Chờ xử lý
      </>
    ),
    processing: (
      <>
        <FontAwesomeIcon icon={faBox} /> Đang xử lý
      </>
    ),
    shipped: (
      <>
        <FontAwesomeIcon icon={faTruck} /> Đang giao
      </>
    ),
    delivered: (
      <>
        <FontAwesomeIcon icon={faCheckCircle} /> Đã giao
      </>
    ),
    cancelled: (
      <>
        <FontAwesomeIcon icon={faTimesCircle} /> Đã hủy
      </>
    ),
  };
  return labels[status] || status;
};

const getStatusText = (status) => {
  const map = {
    all: 'tất cả',
    pending: 'chờ xử lý',
    processing: 'đang xử lý',
    shipped: 'đang giao',
    delivered: 'đã giao',
    cancelled: 'đã hủy',
  };
  return map[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default SellerDashboard;
