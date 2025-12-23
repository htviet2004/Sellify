import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../utils/WishlistContext';
import { useCart } from '../utils/CartContext';
import { formatPrice } from '../utils/formatPrice';
import '../assets/Wishlist.css';
import Icon from '../components/Icon';
import usePageTitle from '../hooks/usePageTitle';

const WishlistPage = () => {
  const {
    wishlist,
    savedItems,
    loading,
    removeFromWishlist,
    toggleWishlist,
    updateSavedQuantity,
    removeSavedItem,
  } = useWishlist();
  const { addToCart } = useCart();

  usePageTitle('Danh sách yêu thích');

  const moveWishlistItemToCart = async (item) => {
    addToCart(item.product, 1, { color: item.color, size: item.size });
    await removeFromWishlist(item.id);
  };

  const moveSavedItemToCart = async (item) => {
    addToCart(item.product, item.quantity || 1, { color: item.color, size: item.size });
    await removeSavedItem(item.id);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <header className="wishlist-header">
          <div>
            <p className="eyebrow">Danh sách của bạn</p>
            <h1>Yêu thích &amp; Lưu để mua sau</h1>
          </div>
          <Link to="/" className="wishlist-link">Tiếp tục mua sắm</Link>
        </header>

        {loading && <div className="wishlist-card">Đang tải dữ liệu...</div>}

        <section className="wishlist-section">
          <div className="wishlist-section-title">
            <h2>Danh sách yêu thích</h2>
            <span>{wishlist.length} sản phẩm</span>
          </div>
          {wishlist.length === 0 ? (
            <div className="wishlist-card empty">
              <p>Bạn chưa thêm sản phẩm nào. Hãy nhấn biểu tượng trái tim trên sản phẩm để lưu lại.</p>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map((item) => (
                <article key={item.id} className="wishlist-card">
                  <div className="wishlist-thumb">
                    <img src={item.product?.image || '/default-product.png'} alt={item.product?.name} />
                  </div>
                  <div className="wishlist-body">
                    <div className="wishlist-head">
                      <div>
                        <p className="wishlist-label">Yêu thích</p>
                        <h3>{item.product?.name}</h3>
                      </div>
                      <span className="wishlist-price">{formatPrice(item.product?.price || 0)}</span>
                    </div>
                    <div className="wishlist-variants">
                      {item.color && <span>Màu: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <div className="wishlist-actions">
                      <button type="button" className="primary" onClick={() => moveWishlistItemToCart(item)}>
                        <Icon name="cart-plus" size={14} />
                        <span>Thêm vào giỏ</span>
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => toggleWishlist(item.product, { color: item.color, size: item.size })}
                      >
                        <Icon name="trash" size={14} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="wishlist-section">
          <div className="wishlist-section-title">
            <h2>Đang lưu để mua sau</h2>
            <span>{savedItems.length} sản phẩm</span>
          </div>
          {savedItems.length === 0 ? (
            <div className="wishlist-card empty">
              <p>Chưa có sản phẩm nào được lưu. Bạn có thể lưu từ giỏ hàng.</p>
            </div>
          ) : (
            <div className="wishlist-grid saved">
              {savedItems.map((item) => (
                <article key={item.id} className="wishlist-card">
                  <div className="wishlist-thumb">
                    <img src={item.product?.image || '/default-product.png'} alt={item.product?.name} />
                  </div>
                  <div className="wishlist-body">
                    <div className="wishlist-head">
                      <div>
                        <p className="wishlist-label muted">Lưu để mua sau</p>
                        <h3>{item.product?.name}</h3>
                      </div>
                      <span className="wishlist-price">{formatPrice(item.product?.price || 0)}</span>
                    </div>
                    <div className="wishlist-variants">
                      {item.color && <span>Màu: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <div className="wishlist-saved-controls">
                      <label className="saved-qty">
                        Số lượng
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => updateSavedQuantity(item.id, Number(e.target.value) || 1)}
                        />
                      </label>
                    </div>
                    <div className="wishlist-actions">
                      <button type="button" className="primary" onClick={() => moveSavedItemToCart(item)}>
                        <Icon name="cart-arrow-down" size={14} />
                        <span>Đưa lại vào giỏ</span>
                      </button>
                      <button type="button" className="ghost" onClick={() => removeSavedItem(item.id)}>
                        <Icon name="trash" size={14} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WishlistPage;
