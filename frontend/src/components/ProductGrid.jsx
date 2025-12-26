import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], className = '' }) {
  if (!Array.isArray(products)) return null;
  return (
    <div className={`product-grid ${className}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}