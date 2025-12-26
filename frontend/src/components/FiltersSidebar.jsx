import React from 'react';
import { Link } from 'react-router-dom';
import CategoryChip from './CategoryChip.jsx';

export default function FiltersSidebar({ 
  categories = [], 
  selectedCategory, 
  onCategoryChange,
  priceRange = { min: '', max: '' },
  onPriceRangeChange = () => {},
  sortBy,
  onSortChange = () => {},
  onClearFilters = () => {},
  showCategoryLinks = false,
  selectedColor = '',
  onColorChange = () => {}
}) {
  // normalize incoming categories to objects { id, name, slug }
  const normalized = (categories || []).map((c) => {
    if (!c) return { id: null, name: 'Tất cả', slug: '' };
    if (typeof c === 'string') return { id: null, name: c, slug: '' };
    return { id: c.id ?? null, name: c.name ?? String(c), slug: c.slug ?? '' };
  });

  return (
    <div className="filters-sidebar">
      <div className="filters-header">
        <h3>Bộ lọc</h3>
        <button 
          className="clear-filters-btn"
          onClick={() => onClearFilters && onClearFilters()}
        >
          Xóa bộ lọc
        </button>
      </div>

      {showCategoryLinks && (
        <div className="filter-section">
          <h4>Danh mục</h4>
          <div className="filter-options">
            {normalized.map((cat, i) => {
              const valueToSend = cat.slug || cat.name || String(cat.id ?? i);
              const to = cat.slug ? (cat.name === 'Tất cả' ? '/' : `/category/${encodeURIComponent(cat.slug)}`) : (cat.name === 'Tất cả' ? '/' : `/category/${encodeURIComponent(cat.name)}`);
              const active = (selectedCategory && (String(selectedCategory) === String(cat.slug) || String(selectedCategory) === String(cat.name)));
              return (
                <CategoryChip
                  key={cat.slug || cat.name || `${i}`}
                  label={cat.name}
                  to={to}
                  active={active}
                  onClick={() => onCategoryChange && onCategoryChange(valueToSend)}
                />
              );
            })}
          </div>
        </div>
      )}

      {!showCategoryLinks && (
        <div className="filter-section">
          <h4>Danh mục</h4>
          <div className="filter-options">
            {normalized.map((cat, i) => {
              const value = cat.slug || cat.name;
              return (
                <label key={value || i} className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={String(selectedCategory || '') === String(value)}
                    onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
                  />
                  <span>{cat.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="filter-section">
        <h4>Khoảng giá</h4>
        <div className="price-range">
          <input
            type="number"
            placeholder="Từ"
            value={priceRange.min ?? ''}
            onChange={(e) => onPriceRangeChange && onPriceRangeChange(prev => ({ ...prev, min: e.target.value }))}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Đến"
            value={priceRange.max ?? ''}
            onChange={(e) => onPriceRangeChange && onPriceRangeChange(prev => ({ ...prev, max: e.target.value }))}
          />
        </div>
      </div>

      <div className="filter-section">
        <h4>Màu sắc</h4>
        <div className="color-filter">
          {[
            { name: 'Đỏ', value: 'red', hex: '#EF4444' },
            { name: 'Cam', value: 'orange', hex: '#F97316' },
            { name: 'Vàng', value: 'yellow', hex: '#EAB308' },
            { name: 'Xanh lá', value: 'green', hex: '#22C55E' },
            { name: 'Xanh dương', value: 'blue', hex: '#3B82F6' },
            { name: 'Tím', value: 'purple', hex: '#A855F7' },
            { name: 'Hồng', value: 'pink', hex: '#EC4899' },
            { name: 'Nâu', value: 'brown', hex: '#92400E' },
            { name: 'Đen', value: 'black', hex: '#000000' },
            { name: 'Trắng', value: 'white', hex: '#FFFFFF' },
            { name: 'Xám', value: 'gray', hex: '#6B7280' },
            { name: 'Be', value: 'beige', hex: '#D4A574' }
          ].map(color => (
            <div 
              key={color.value}
              className={`color-item ${selectedColor === color.value ? 'active' : ''}`}
              onClick={() => onColorChange(selectedColor === color.value ? '' : color.value)}
            >
              <div
                className="color-swatch"
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={`Lọc theo màu ${color.name}`}
              />
              <span className="color-label">{color.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Sắp xếp theo</h4>
        <select 
          value={sortBy} 
          onChange={(e) => onSortChange && onSortChange(e.target.value)}
          className="sort-select"
        >
          <option value="relevance">Liên quan nhất</option>
          <option value="price-low">Giá thấp đến cao</option>
          <option value="price-high">Giá cao đến thấp</option>
          <option value="name">Tên A-Z</option>
          <option value="newest">Mới nhất</option>
        </select>
      </div>
    </div>
  )
}
