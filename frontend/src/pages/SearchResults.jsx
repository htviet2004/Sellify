import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE } from '../data/constants';
import ProductGrid from '../components/ProductGrid';
import Loading from '../components/Loading';
import '../assets/SearchResults.css';
import usePageTitle from '../hooks/usePageTitle';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchResults() {
  const location = useLocation();
  const qs = useQuery();
  const mode = qs.get('mode') || 'text';
  const q = (qs.get('q') || '').trim();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  
  // Image search UI state
  const [imageSrc, setImageSrc] = useState(null);
  const [drag, setDrag] = useState(null);
  const [rect, setRect] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [searching, setSearching] = useState(false);

  const title = mode === 'image'
    ? 'Kết quả tìm kiếm bằng ảnh'
    : mode === 'clip'
    ? `Tìm kiếm CLIP: "${q}"`
    : (q ? `Kết quả cho "${q}"` : 'Kết quả tìm kiếm');
  usePageTitle(title);

  // Load image from sessionStorage if in image mode
  useEffect(() => {
    if (mode === 'image') {
      const imgData = sessionStorage.getItem('imageSearchFile');
      if (imgData) {
        setImageSrc(imgData);
        setLoading(false);
        setRect(null); // Reset ROI when new image is loaded
      }
    }
  }, [mode, location.key]);

  // Draw ROI rectangle on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (rect) {
      ctx.strokeStyle = 'rgba(79,70,229,0.95)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6,4]);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(79,70,229,0.15)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
  }, [rect]);

  // Text search effect
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (mode === 'image') return;
      setLoading(true); setErr(null);
      try {
        if (!q) { setResults([]); return; }
        
        let url;
        if (mode === 'clip') {
          // CLIP text embedding search
          url = `${API_BASE}/api/search/text/?q=${encodeURIComponent(q)}&k=50`;
        } else {
          // Normal text search
          url = `${API_BASE}/api/products/?search=${encodeURIComponent(q)}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        
        let items;
        if (mode === 'clip') {
          items = data.results || [];
        } else {
          items = Array.isArray(data) ? data : (data.results || []);
        }
        
        if (!cancelled) setResults(items);
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [mode, q]);

  // Auto-search on ROI change
  useEffect(() => {
    if (!rect || !imageSrc || mode !== 'image') return;
    
    const timer = setTimeout(() => {
      performImageSearch();
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timer);
  }, [rect, imageSrc, mode]);

  async function performImageSearch() {
    if (!imageSrc || searching) return;
    
    setSearching(true);
    setErr(null);
    try {
      // Convert base64 to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], sessionStorage.getItem('imageSearchFileName') || 'image.jpg', { type: blob.type });
      
      const fd = new FormData();
      fd.append('file', file);

      // Add ROI if selected
      if (rect && imgRef.current) {
        const displayedW = imgRef.current.clientWidth;
        const displayedH = imgRef.current.clientHeight;
        const naturalW = imgRef.current.naturalWidth || displayedW;
        const naturalH = imgRef.current.naturalHeight || displayedH;

        const scaleX = naturalW / displayedW;
        const scaleY = naturalH / displayedH;
        const nx = (rect.x) * scaleX / naturalW;
        const ny = (rect.y) * scaleY / naturalH;
        const nw = (rect.w) * scaleX / naturalW;
        const nh = (rect.h) * scaleY / naturalH;
        const roi = { x: nx, y: ny, w: nw, h: nh };
        fd.append('roi', JSON.stringify(roi));
      }

      const response = await fetch(`${API_BASE}/api/search/image/`, { method: 'POST', body: fd });
      const text = await response.text();
      let json = {};
      try { json = JSON.parse(text); } catch {}
      if (!response.ok) throw new Error(json?.error || `HTTP ${response.status}`);

      const results = Array.isArray(json.results) ? json.results : [];
      setResults(results);
      sessionStorage.setItem('imageSearchResults', JSON.stringify({ totalResults: results.length, products: results }));
    } catch (e) {
      console.error('Image search error:', e);
      setErr(String(e.message || 'Tìm kiếm bằng ảnh thất bại.'));
    } finally {
      setSearching(false);
    }
  }

  function handleImageLoad() {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    canvas.style.width = img.clientWidth + 'px';
    canvas.style.height = img.clientHeight + 'px';
    setRect(null);
    // Auto-search with full image on load
    performImageSearch();
  }

  function onMouseDown(e) {
    e.preventDefault();
    if (!imgRef.current) return;
    const bounds = imgRef.current.getBoundingClientRect();
    const sx = e.clientX - bounds.left;
    const sy = e.clientY - bounds.top;
    setDrag({ startX: sx, startY: sy });
    setRect({ x: sx, y: sy, w: 0, h: 0 });
  }

  function onMouseMove(e) {
    if (!drag || !imgRef.current) return;
    e.preventDefault();
    const bounds = imgRef.current.getBoundingClientRect();
    const cx = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width));
    const cy = Math.max(0, Math.min(e.clientY - bounds.top, bounds.height));
    const x = Math.min(drag.startX, cx);
    const y = Math.min(drag.startY, cy);
    const w = Math.abs(cx - drag.startX);
    const h = Math.abs(cy - drag.startY);
    setRect({ x, y, w, h });
  }

  function onMouseUp() {
    setDrag(null);
    // Auto-search will trigger via useEffect when rect changes
  }

  // Global mouseup handler
  useEffect(() => {
    function handleWindowUp() { setDrag(null); }
    window.addEventListener('mouseup', handleWindowUp);
    return () => window.removeEventListener('mouseup', handleWindowUp);
  }, []);

  const resultsCount = results?.length || 0;

  return (
    <div className="search-results-page">
      <div className="search-results-container">
        <div className="search-header">
          <h1>Kết quả tìm kiếm {mode === 'image' ? '(Ảnh)' : ''}</h1>
          
          {mode === 'image' && imageSrc && (
            <div style={{ marginTop: 20, marginBottom: 20, padding: 20, background: '#f8f9fa', borderRadius: 8 }}>
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', userSelect: 'none' }}>
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Query"
                  draggable={false}
                  style={{ maxWidth: '600px', maxHeight: '400px', display: 'block', borderRadius: 4, cursor: 'crosshair', userSelect: 'none' }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onLoad={handleImageLoad}
                />
                <canvas
                  ref={canvasRef}
                  style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                />
              </div>
              {searching && <p style={{ marginTop: 8, color: '#4f46e5', fontSize: 14 }}>⏳ Đang tìm kiếm...</p>}
              {rect && <p style={{ marginTop: 8, color: '#6c757d', fontSize: 13 }}>💡 Thả chuột để tự động tìm kiếm vùng đã chọn</p>}
            </div>
          )}
          
          {mode !== 'image' && (
            <div className="search-query">
              {mode === 'clip' && <span style={{ color: '#6366f1', fontWeight: 600, marginRight: 8 }}>🤖 CLIP</span>}
              Từ khóa: <strong>{q || '(trống)'}</strong>
            </div>
          )}
          <p className="results-count">{resultsCount} sản phẩm</p>
        </div>

        <div className="products-section">
          {err && <div className="search-error">{err}</div>}

          {loading && mode !== 'image' ? (
            <Loading message="Đang tải kết quả..." />
          ) : resultsCount === 0 && !searching && (!imageSrc || mode !== 'image') ? (
            <div className="no-results">
              <div className="no-results-icon">🔎</div>
              <h3>Không tìm thấy kết quả</h3>
              <p>Thử từ khóa khác hoặc dùng tính năng "Tìm bằng ảnh" ở thanh tìm kiếm.</p>
              <div className="suggestions">
                <h4>Gợi ý nhanh</h4>
                <div className="suggestion-tags">
                  {['tshirt', 'jeans', 'sneakers', 'watch', 'bag'].map((s) => (
                    <a key={s} className="suggestion-tag" href={`/search?q=${encodeURIComponent(s)}`}>{s}</a>
                  ))}
                </div>
              </div>
            </div>
          ) : resultsCount > 0 ? (
            <>
              <div className="results-header">
                <div className="results-info">
                  Hiển thị {resultsCount} sản phẩm
                  {mode === 'image' && rect && <span style={{ marginLeft: 8, color: '#4f46e5', fontWeight: 600 }}>(từ vùng ROI)</span>}
                  {mode === 'image' && !rect && <span style={{ marginLeft: 8, color: 'var(--text-light)' }}>(toàn bộ ảnh)</span>}
                </div>
              </div>
              <ProductGrid products={results} />
            </>
          ) : mode === 'image' && searching ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Loading message="Đang tìm kiếm sản phẩm tương tự..." />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
