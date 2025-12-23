import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryChip({ label, to, active = false, onClick = () => {} }) {
  const className = `category-chip ${active ? 'active' : ''}`;
  // nếu có đường dẫn, render Link để giữ SPA navigation, còn không thì button
  if (to) {
    return (
      <Link to={to} className={className} onClick={() => onClick(label)}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={() => onClick(label)}>
      {label}
    </button>
  );
}