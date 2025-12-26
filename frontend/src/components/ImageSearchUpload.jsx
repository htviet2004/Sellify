import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function ImageSearchUpload({
  label = 'Tìm bằng ảnh',
  className = 'btn btn-primary',
  icon = 'image'
}) {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  // Navigate to search page with image file
  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // Store image data and file in sessionStorage
      sessionStorage.setItem('imageSearchFile', reader.result);
      sessionStorage.setItem('imageSearchFileName', file.name);
      // Navigate to search results page
      navigate('/search?mode=image');
    };
    reader.readAsDataURL(file);
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
