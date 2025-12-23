import React, { useRef } from 'react';
import Icon from './Icon';
import { API_BASE } from '../data/constants';

export default function ImageSearchUpload({
  endpoint = `${API_BASE}/api/search/image/`,
  label = 'Tìm bằng ảnh',
  onStart,
  onFinish,
  onResults,
  onError,
  className = 'btn btn-primary',
  icon = 'image'
}) {
  const inputRef = useRef(null);

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      onStart?.();
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch(endpoint, { 
        method: 'POST', 
        body: fd 
      });
      
      const text = await res.text();
      let json = {};
      try { 
        json = JSON.parse(text); 
      } catch { 
        /* HTML error page */ 
      }

      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      // Xử lý kết quả từ API
      const predictedClass = json.predicted_class || 'Unknown';
      const category = json.category || predictedClass;
      const results = Array.isArray(json.results) ? json.results : [];
      
      // Thông báo kết quả phân loại
      console.log(`🎯 Phát hiện: ${predictedClass} (${results.length} sản phẩm)`);
      
      // Gọi callback với kết quả
      onResults?.({
        predictedClass,
        category,
        totalResults: results.length,
        products: results
      });
      
    } catch (err) {
      console.error('Image search error:', err);
      onError?.(String(err?.message || 'Tìm kiếm bằng ảnh thất bại.'));
    } finally {
      onFinish?.();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  const content = typeof label === 'string'
    ? (
        <>
          {icon && <Icon name={icon} size={16} style={{ marginRight: 6 }} />}
          <span>{label}</span>
        </>
      )
    : label;

  return (
    <label
      className={className}
      style={{ 
        cursor: 'pointer', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 6 
      }}
    >
      {content}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </label>
  );
}
