import React, { useState } from 'react';

export default function StarRating({
  value = 0,
  count,
  readOnly = true,
  onChange,
  size = 18,
  showValue = false
}) {
  const [hover, setHover] = useState(0);

  const current = hover || value || 0;
  const stars = [1, 2, 3, 4, 5];

  const Star = ({ filled }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke="#f59e0b"
      strokeWidth="2"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div>
        {stars.map((s) =>
          readOnly ? (
            <span key={s} aria-hidden="true">
              <Star filled={s <= Math.round(current)} />
            </span>
          ) : (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange && onChange(s)}
              style={{
                appearance: 'none',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                lineHeight: 0
              }}
              aria-label={`Chọn ${s} sao`}
            >
              <Star filled={s <= current} />
            </button>
          )
        )}
      </div>
      {showValue && (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {Number(value || 0).toFixed(1)}{typeof count === 'number' ? ` • ${count}` : ''}
        </span>
      )}
    </div>
  );
}