import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { API_BASE } from '../data/constants';
import { 
  faChartLine, faUsers, faBoxes, faShoppingCart, faSync,
  faUserPlus, faStore, faMoneyBillWave, faStar, faFire,
  faChartBar, faUserCog, faPlus, faFolder, faEdit, faLock,
  faHourglassHalf, faCreditCard, faTruck, faCheckCircle, faTimesCircle,
  faExclamationTriangle, faComments, faEnvelope,
  faHeart, faBookmark, faUserCircle
} from '@fortawesome/free-solid-svg-icons';
import '../assets/AdminDashboard.css';
import '../assets/AdminCRUD.css';
import { AdminCRUDManager } from '../components/AdminCRUD';
import {
  usersConfig, profilesConfig, productsConfig, categoriesConfig,
  cartItemsConfig, ordersConfig, orderItemsConfig, conversationsConfig,
  messagesConfig, reviewsConfig, wishlistItemsConfig, savedItemsConfig
} from '../config/adminModelsConfig';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, products, orders

  usePageTitle('Bảng điều khiển quản trị');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/users/admin/stats/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <FontAwesomeIcon icon={faSync} size="3x" />
          <div>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-content">
          <div className="admin-error">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <FontAwesomeIcon icon={faChartLine} /> Quản trị hệ thống
            </h1>
            <p className="admin-header-subtitle">
              Chào mừng, <strong>{user?.full_name || user?.username}</strong>!
            </p>
          </div>
          <button onClick={fetchAdminStats} className="admin-refresh-btn">
            <FontAwesomeIcon icon={faSync} /> Làm mới
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Tabs */}
        <div className="admin-tabs" style={{flexWrap: 'wrap'}}>
          <button
            className={activeTab === 'overview' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('overview')}
          >
            <FontAwesomeIcon icon={faChartBar} /> Overview
          </button>
          <button
            className={activeTab === 'users' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('users')}
          >
            <FontAwesomeIcon icon={faUsers} /> Users
          </button>
          <button
            className={activeTab === 'profiles' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('profiles')}
          >
            <FontAwesomeIcon icon={faUserCircle} /> Profiles
          </button>
          <button
            className={activeTab === 'products' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('products')}
          >
            <FontAwesomeIcon icon={faBoxes} /> Products
          </button>
          <button
            className={activeTab === 'categories' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('categories')}
          >
            <FontAwesomeIcon icon={faFolder} /> Categories
          </button>
          <button
            className={activeTab === 'cart-items' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('cart-items')}
          >
            <FontAwesomeIcon icon={faShoppingCart} /> Cart Items
          </button>
          <button
            className={activeTab === 'orders' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('orders')}
          >
            <FontAwesomeIcon icon={faTruck} /> Orders
          </button>
          <button
            className={activeTab === 'order-items' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('order-items')}
          >
            <FontAwesomeIcon icon={faBoxes} /> Order Items
          </button>
          <button
            className={activeTab === 'conversations' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('conversations')}
          >
            <FontAwesomeIcon icon={faComments} /> Conversations
          </button>
          <button
            className={activeTab === 'messages' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('messages')}
          >
            <FontAwesomeIcon icon={faEnvelope} /> Messages
          </button>
          <button
            className={activeTab === 'reviews' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('reviews')}
          >
            <FontAwesomeIcon icon={faStar} /> Reviews
          </button>
          <button
            className={activeTab === 'wishlist-items' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('wishlist-items')}
          >
            <FontAwesomeIcon icon={faHeart} /> Wishlist
          </button>
          <button
            className={activeTab === 'saved-items' ? 'admin-tab admin-tab-active' : 'admin-tab'}
            onClick={() => setActiveTab('saved-items')}
          >
            <FontAwesomeIcon icon={faBookmark} /> Saved Items
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="admin-grid">
            {/* Users Stats */}
            <div className="admin-card">
              <h2 className="admin-card-title">
                <FontAwesomeIcon icon={faUsers} /> Thống kê người dùng
              </h2>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-number">{stats.users?.total || 0}</div>
                  <div className="admin-stat-label">Tổng người dùng</div>
                </div>
                <div className="admin-stat-card info">
                  <div className="admin-stat-number">{stats.users?.active || 0}</div>
                  <div className="admin-stat-label">Đang hoạt động</div>
                </div>
                <div className="admin-stat-card success">
                  <div className="admin-stat-number">{stats.users?.buyers || 0}</div>
                  <div className="admin-stat-label">Người mua</div>
                </div>
                <div className="admin-stat-card warning">
                  <div className="admin-stat-number">{stats.users?.sellers || 0}</div>
                  <div className="admin-stat-label">Người bán</div>
                </div>
              </div>
              <div className="admin-info-text">
                <FontAwesomeIcon icon={faUserPlus} /> {stats.users?.new_last_7_days || 0} người dùng mới trong 7 ngày qua
              </div>
            </div>

            {/* Revenue Stats */}
            <div className="admin-card">
              <h2 className="admin-card-title">
                <FontAwesomeIcon icon={faMoneyBillWave} /> Doanh thu
              </h2>
              <div className="admin-stats-grid">
                <div className="admin-stat-card" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                  <div className="admin-stat-number" style={{fontSize: '24px'}}>{formatCurrency(stats.revenue?.total || 0)}</div>
                  <div className="admin-stat-label">Tổng doanh thu</div>
                </div>
                <div className="admin-stat-card warning">
                  <div className="admin-stat-number" style={{fontSize: '24px'}}>{formatCurrency(stats.revenue?.monthly || 0)}</div>
                  <div className="admin-stat-label">Tháng này</div>
                </div>
                <div className="admin-stat-card info">
                  <div className="admin-stat-number" style={{fontSize: '24px'}}>{formatCurrency(stats.revenue?.today || 0)}</div>
                  <div className="admin-stat-label">Hôm nay</div>
                </div>
                <div className="admin-stat-card success">
                  <div className="admin-stat-number">{stats.orders?.total || 0}</div>
                  <div className="admin-stat-label">Tổng đơn hàng</div>
                </div>
              </div>
            </div>

            {/* Products & Orders Stats */}
            <div className="admin-card">
              <h2 className="admin-card-title">
                <FontAwesomeIcon icon={faBoxes} /> Sản phẩm & Đơn hàng
              </h2>
              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <span className="admin-info-label">Sản phẩm:</span>
                  <span className="admin-info-value">{stats.products?.total || 0} (Active: {stats.products?.active || 0})</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">Hết hàng:</span>
                  <span className="admin-info-value">{stats.products?.out_of_stock || 0}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">Danh mục:</span>
                  <span className="admin-info-value">{stats.categories?.total || 0}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">Đánh giá:</span>
                  <span className="admin-info-value">{stats.reviews?.total || 0}</span>
                </div>
              </div>
              <div className="admin-order-stats">
                <div className="admin-order-item">
                  <span><FontAwesomeIcon icon={faHourglassHalf} /> Chờ xử lý:</span>
                  <strong>{stats.orders?.pending || 0}</strong>
                </div>
                <div className="admin-order-item">
                  <span><FontAwesomeIcon icon={faCreditCard} /> Đã thanh toán:</span>
                  <strong>{stats.orders?.paid || 0}</strong>
                </div>
                <div className="admin-order-item">
                  <span><FontAwesomeIcon icon={faTruck} /> Đang giao:</span>
                  <strong>{stats.orders?.shipping || 0}</strong>
                </div>
                <div className="admin-order-item">
                  <span><FontAwesomeIcon icon={faCheckCircle} /> Hoàn thành:</span>
                  <strong>{stats.orders?.completed || 0}</strong>
                </div>
                <div className="admin-order-item">
                  <span><FontAwesomeIcon icon={faTimesCircle} /> Đã hủy:</span>
                  <strong>{stats.orders?.canceled || 0}</strong>
                </div>
              </div>
            </div>

            {/* Top Products */}
            {stats.top_products && stats.top_products.length > 0 && (
              <div className="admin-card">
                <h2 className="admin-card-title">
                  <FontAwesomeIcon icon={faFire} /> Top sản phẩm bán chạy (7 ngày qua)
                </h2>
                <div className="admin-top-products-list">
                  {stats.top_products.map((product, index) => (
                    <div key={index} className="admin-top-product-item">
                      <div className="admin-top-product-rank">#{index + 1}</div>
                      <div className="admin-top-product-info">
                        <div className="admin-top-product-name">{product.product__name}</div>
                        <div className="admin-top-product-stats">
                          Đã bán: {product.total_sold} | Giá: {formatCurrency(product.product__price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="admin-card">
              <h2 className="admin-card-title">
                <FontAwesomeIcon icon={faChartLine} /> Hoạt động gần đây
              </h2>
              
              {stats.recent_activity?.users && stats.recent_activity.users.length > 0 && (
                <div className="admin-activity-section">
                  <h3 className="admin-activity-title">
                    <FontAwesomeIcon icon={faUserPlus} /> Người dùng mới:
                  </h3>
                  {stats.recent_activity.users.map((user, index) => (
                    <div key={index} className="admin-activity-item">
                      <strong>{user.username}</strong> ({user.user_type}) - {formatDate(user.created_at)}
                    </div>
                  ))}
                </div>
              )}

              {stats.recent_activity?.orders && stats.recent_activity.orders.length > 0 && (
                <div className="admin-activity-section">
                  <h3 className="admin-activity-title">
                    <FontAwesomeIcon icon={faShoppingCart} /> Đơn hàng mới:
                  </h3>
                  {stats.recent_activity.orders.map((order, index) => (
                    <div key={index} className="admin-activity-item">
                      Đơn <strong>{order.order_id}</strong> - {order.status} - {formatCurrency(order.total_amount)} - {formatDate(order.created_at)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Actions */}
            <div className="admin-card">
              <h2 className="admin-card-title">
                <FontAwesomeIcon icon={faUserCog} /> Quản lý hệ thống
              </h2>
              <div className="admin-actions-grid">
                <Link to="/users" className="admin-action-btn">
                  <span className="admin-action-icon"><FontAwesomeIcon icon={faUsers} /></span>
                  <span>Quản lý người dùng</span>
                </Link>
                <Link to="/add-product" className="admin-action-btn">
                  <span className="admin-action-icon"><FontAwesomeIcon icon={faPlus} /></span>
                  <span>Thêm sản phẩm</span>
                </Link>
                <Link to="/add-category" className="admin-action-btn">
                  <span className="admin-action-icon"><FontAwesomeIcon icon={faFolder} /></span>
                  <span>Thêm danh mục</span>
                </Link>
                <Link to="/profile" className="admin-action-btn">
                  <span className="admin-action-icon"><FontAwesomeIcon icon={faEdit} /></span>
                  <span>Chỉnh sửa hồ sơ</span>
                </Link>
                <Link to="/change-password" className="admin-action-btn">
                  <span className="admin-action-icon"><FontAwesomeIcon icon={faLock} /></span>
                  <span>Đổi mật khẩu</span>
                </Link>
                <Link to="/shops" className="admin-action-btn">
                  <span className="admin-action-icon"><FontAwesomeIcon icon={faStore} /></span>
                  <span>Danh sách Shop</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && <UsersManagement />}

        {/* Products Tab */}
        {activeTab === 'products' && <ProductsManagement />}

        {/* Orders Tab - Legacy */}
        {activeTab === 'orders-old' && <OrdersManagement />}
        
        {/* CRUD Tabs */}
        {activeTab === 'users' && <AdminCRUDManager {...usersConfig} />}
        {activeTab === 'profiles' && <AdminCRUDManager {...profilesConfig} />}
        {activeTab === 'products' && <AdminCRUDManager {...productsConfig} />}
        {activeTab === 'categories' && <AdminCRUDManager {...categoriesConfig} />}
        {activeTab === 'cart-items' && <AdminCRUDManager {...cartItemsConfig} />}
        {activeTab === 'orders' && <AdminCRUDManager {...ordersConfig} />}
        {activeTab === 'order-items' && <AdminCRUDManager {...orderItemsConfig} />}
        {activeTab === 'conversations' && <AdminCRUDManager {...conversationsConfig} />}
        {activeTab === 'messages' && <AdminCRUDManager {...messagesConfig} />}
        {activeTab === 'reviews' && <AdminCRUDManager {...reviewsConfig} />}
        {activeTab === 'wishlist-items' && <AdminCRUDManager {...wishlistItemsConfig} />}
        {activeTab === 'saved-items' && <AdminCRUDManager {...savedItemsConfig} />}
      </div>
    </div>
  );
};

// Component quản lý Users - Legacy
const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    user_type: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (filters.user_type) params.append('user_type', filters.user_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE}/api/users/admin/users/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card">
      <h2 className="admin-card-title">
        <FontAwesomeIcon icon={faUsers} /> Quản lý người dùng
      </h2>
      
      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên, email..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="admin-filter-input"
        />
        <select
          value={filters.user_type}
          onChange={(e) => setFilters({...filters, user_type: e.target.value})}
          className="admin-filter-select"
        >
          <option value="">Tất cả loại</option>
          <option value="buyer">Người mua</option>
          <option value="seller">Người bán</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="admin-filter-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
          <option value="suspended">Bị khóa</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="admin-loading">
          <FontAwesomeIcon icon={faSync} size="2x" />
          <div>Đang tải...</div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Họ tên</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id}>
                  <td>{user.user_id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.full_name || '-'}</td>
                  <td><span className="admin-badge">{user.user_type}</span></td>
                  <td>
                    <span className={`admin-status-badge admin-status-${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Component quản lý Products
const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/users/admin/products/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="admin-card">
      <h2 className="admin-card-title">
        <FontAwesomeIcon icon={faBoxes} /> Quản lý sản phẩm
      </h2>
      
      {loading ? (
        <div className="admin-loading">
          <FontAwesomeIcon icon={faSync} size="2x" />
          <div>Đang tải...</div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên sản phẩm</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Người bán</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id}>
                  <td>{product.product_id}</td>
                  <td>{product.name}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>{product.seller__username}</td>
                  <td>{product.category__name || '-'}</td>
                  <td>
                    <span className={product.is_active ? 'admin-status-active' : 'admin-status-inactive'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(product.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Component quản lý Orders
const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/users/admin/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOrders(response.data.orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="admin-card">
      <h2 className="admin-card-title">
        <FontAwesomeIcon icon={faShoppingCart} /> Quản lý đơn hàng
      </h2>
      
      {loading ? (
        <div className="admin-loading">
          <FontAwesomeIcon icon={faSync} size="2x" />
          <div>Đang tải...</div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.order_id}>
                  <td><strong>{order.order_id}</strong></td>
                  <td>{order.full_name}</td>
                  <td>{order.email}</td>
                  <td>{order.phone}</td>
                  <td>{formatCurrency(order.total_amount)}</td>
                  <td>{order.payment_method}</td>
                  <td>
                    <span className={`admin-status-badge admin-status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;