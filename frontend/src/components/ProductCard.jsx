import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../utils/CartContext';
import { useWishlist } from '../utils/WishlistContext';
import { API_BASE } from '../data/constants';
import '../assets/ProductCard.css';  // Thêm import CSS cho thẻ sản phẩm
import Icon from './Icon';
import flyToCart from '../utils/flyToCart';

// Helper function to normalize image URL
const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return '/default-product.png';
  
  // If already absolute URL (http/https), return as is
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  
  // If data URL, return as is
  if (/^data:/i.test(imageUrl)) return imageUrl;
  
  // If relative path, prepend API_BASE
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${API_BASE}${path}`;
};

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { findWishlistItem, toggleWishlist, isBuyer } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const imageRef = useRef(null);

  // normalize category to a string
  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name ?? product.category?.title ?? '';

  const defaultImage = '/default-product.png';
  const rawImageSrc = product.image || product.image_url || null;
  const imgSrc = normalizeImageUrl(rawImageSrc);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    addToCart(product, 1);
    flyToCart(imageRef.current);
    
    setShowSuccess(true);
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(false);
    }, 1500);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const wishlistEntry = findWishlistItem(product.id);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isBuyer) {
      alert('Vui lòng đăng nhập bằng tài khoản người mua để sử dụng danh sách yêu thích.');
      return;
    }

    try {
      setWishlistBusy(true);
      await toggleWishlist(product);
    } catch (err) {
      alert(err.message || 'Không thể cập nhật danh sách yêu thích.');
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-thumb">
          <button
            type="button"
            className={`wishlist-heart ${wishlistEntry ? 'active' : ''}`}
            onClick={handleToggleWishlist}
            aria-label={wishlistEntry ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
            disabled={wishlistBusy}
          >
            {wishlistBusy ? (
              <Icon name="spinner" size={18} className="fa-spin" />
            ) : (
              <Icon
                name="heart"
                variant={wishlistEntry ? 'solid' : 'regular'}
                size={18}
              />
            )}
          </button>
          <div className="product-image">
            <img 
              ref={imageRef}
              src={imageError ? defaultImage : imgSrc} 
              alt={product.name || 'Product image'}
              loading="lazy"
              onError={handleImageError}
            />
          </div>
          <div className="product-overlay">
            <button
              className={`add-to-cart-btn ${isAdding ? 'adding' : ''} ${showSuccess ? 'success' : ''}`}
              onClick={handleAddToCart}
              disabled={isAdding}
              aria-label="Thêm vào giỏ hàng"
            >
              {showSuccess ? (
                <>
                  <Icon name="circle-check" size={16} className="cart-icon" />
                  <span className="cart-text">Đã thêm</span>
                </>
              ) : isAdding ? (
                <>
                  <Icon name="spinner" size={16} className="cart-icon fa-spin" />
                  <span className="cart-text">Đang thêm...</span>
                </>
              ) : (
                <>
                  <Icon name="cart-plus" size={16} className="cart-icon" />
                  <span className="cart-text">Thêm vào giỏ</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="product-body">
          <h3 className="product-name">{product.name}</h3>
          {categoryName && <div className="product-category">{categoryName}</div>}

          {(() => {
            const avg =
              product.rating_avg ??
              product.average_rating ??
              product.rating ?? null;
            const cnt =
              product.rating_count ??
              product.reviews_count ??
              product.reviews?.length ??
              null;
            const hasAny = typeof cnt === 'number' ? cnt > 0 : avg !== null;

            return (
              <div
                className="product-meta-row"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}
              >
                <div className="product-price">
                  {product.price ? `${Number(product.price).toLocaleString('vi-VN')}₫` : 'Liên hệ'}
                </div>

                {hasAny ? (
                  <div
                    className="product-avg"
                    title={`${Number(avg || 0).toFixed(1)} sao`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}
                  >
                    <span style={{ fontSize: 13, lineHeight: 1, color: 'inherit' }}>
                      {Number(avg || 0).toFixed(1)}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="#f59e0b"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      aria-hidden="true"
                      style={{ display: 'block' }}
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                ) : <span /> }
              </div>
            );
          })()}
        </div>
      </Link>
    </article>
  );
}

