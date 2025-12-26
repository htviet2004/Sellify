import React, { useState, useEffect } from 'react';
import { API_BASE } from '../data/constants';
import ProductCard from './ProductCard';
import Icon from './Icon';
import '../assets/SimilarProducts.css';

export default function SimilarProducts({ productId, productImage }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSimilarProducts() {
      if (!productImage) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch the product image and convert to blob
        const imageResponse = await fetch(productImage.startsWith('http') ? productImage : `${API_BASE}${productImage}`);
        const blob = await imageResponse.blob();
        const file = new File([blob], 'product.jpg', { type: blob.type });

        // Send to image search API
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/search/image/?k=16`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Failed to fetch similar products');

        const data = await response.json();
        if (cancelled) return;

        // Filter out current product and limit to 15 results
        const filtered = (data.results || [])
          .filter(p => String(p.id) !== String(productId))
          .slice(0, 15);

        setProducts(filtered);
      } catch (err) {
        console.error('Error fetching similar products:', err);
        if (!cancelled) setError('Không thể tải sản phẩm tương tự');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSimilarProducts();
    return () => { cancelled = true; };
  }, [productId, productImage]);

  if (loading) {
    return (
      <div className="similar-products-section">
        <h3>
          <Icon name="wand-magic-sparkles" size={20} />
          Sản phẩm tương tự
        </h3>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <Icon name="circle-notch" size={24} spin />
          <p style={{ marginTop: 12 }}>Đang tìm sản phẩm tương tự...</p>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <div className="similar-products-section">
      <h3>
        <Icon name="wand-magic-sparkles" size={20} />
        Sản phẩm tương tự
      </h3>
      <div className="product-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
