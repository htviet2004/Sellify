import React, { useEffect, useState } from 'react';
import { API_BASE } from '../data/constants';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import '../assets/Home.css';
import Icon from '../components/Icon';
import usePageTitle from '../hooks/usePageTitle';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageTitle('Trang chủ');

  useEffect(() => {
    // Fetch products
    fetch(`${API_BASE}/api/products/`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.slice(0, 20));
      })
      .catch(err => console.error('Error loading products:', err));

    // Fetch categories
    fetch(`${API_BASE}/api/categories/`)
      .then(res => res.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data.results || []);
        const sorted = [...items].sort((a, b) => (b.product_count || 0) - (a.product_count || 0));
        setCategories(sorted.slice(0, 6));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading categories:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-page">
      {loading ? (
        <Loading message="Đang tải trang chủ..." />
      ) : (
        <>
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">Chào mừng đến với Sellify</h1>
              <p className="hero-subtitle">
                Khám phá hàng ngàn sản phẩm chất lượng cao với giá tốt nhất. 
                Mua sắm dễ dàng, giao hàng nhanh chóng.
              </p>
              <div className="hero-cta">
                <Link to="/products" className="hero-btn hero-btn-primary">
                  Khám phá ngay &rarr;
                </Link>
                <Link to="/about" className="hero-btn hero-btn-secondary">
                  Tìm hiểu thêm
                </Link>
              </div>
            </div>
          </section>

          {/* Featured Categories */}
          {!loading && categories.length > 0 && (
            <section className="featured-categories">
              <div className="section-header">
                <h2 className="section-title">Danh mục nổi bật</h2>
                <p className="section-subtitle">
                  Khám phá các danh mục sản phẩm phong phú và đa dạng
                </p>
              </div>
              <div className="categories-grid">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    className="category-card"
                  >
                    <span className="category-icon">
                      <Icon name="box-open" size={20} />
                    </span>
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-count">
                      {category.product_count || 0} sản phẩm
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured Products */}
          {!loading && products.length > 0 && (
            <section className="featured-products">
              <div className="products-container">
                <div className="section-header">
                  <h2 className="section-title">Sản phẩm nổi bật</h2>
                  <p className="section-subtitle">
                    Những sản phẩm được yêu thích nhất tại Sellify
                  </p>
                </div>
                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Features Section */}
          <section className="features-section">
            <div className="section-header">
              <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
              <p className="section-subtitle">
                Những lý do khiến khách hàng tin tưởng và lựa chọn PBL6 Shop
              </p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">
                  <Icon name="truck-fast" size={22} />
                </span>
                <h3 className="feature-title">Giao hàng nhanh</h3>
                <p className="feature-description">
                  Giao hàng toàn quốc, nhận hàng trong 2-3 ngày với dịch vụ vận chuyển uy tín
                </p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">
                  <Icon name="medal" size={22} />
                </span>
                <h3 className="feature-title">Chất lượng đảm bảo</h3>
                <p className="feature-description">
                  100% sản phẩm chính hãng, được kiểm tra kỹ càng trước khi giao
                </p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">
                  <Icon name="lock" size={22} />
                </span>
                <h3 className="feature-title">Thanh toán an toàn</h3>
                <p className="feature-description">
                  Hỗ trợ nhiều hình thức thanh toán, bảo mật thông tin tuyệt đối
                </p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Sản phẩm</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Khách hàng</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">100+</span>
                <span className="stat-label">Đối tác</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">99%</span>
                <span className="stat-label">Hài lòng</span>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <div className="cta-content">
              <h2 className="cta-title">Bắt đầu mua sắm ngay hôm nay</h2>
              <p className="cta-text">
                Đăng ký tài khoản để nhận nhiều ưu đãi hấp dẫn và trải nghiệm mua sắm tuyệt vời
              </p>
              <Link to="/register" className="cta-btn">
                Đăng ký miễn phí
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}