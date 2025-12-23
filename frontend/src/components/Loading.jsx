import React from 'react';
// dùng CSS trong assets
import '../assets/Loading.css';

export default function Loading({ message = 'Đang tải...', size = 60 }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" style={{ width: size, height: size }}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
