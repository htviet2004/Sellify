import React, { useEffect, useMemo, useState } from 'react';
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
  const qs = useQuery();
  const mode = qs.get('mode') || 'text';
  const q = (qs.get('q') || '').trim();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [imageSearchData, setImageSearchData] = useState(null);

  const title = mode === 'image'
    ? 'Kết quả tìm kiếm bằng ảnh'
    : (q ? `Kết quả cho "${q}"` : 'Kết quả tìm kiếm');
  usePageTitle(title);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true); setErr(null);
      try {
        if (mode === 'image') {
          const cached = sessionStorage.getItem('imageSearchResults');
          if (cached) {
            const data = JSON.parse(cached);
            if (!cancelled) {
              setImageSearchData(data);
              setResults(Array.isArray(data.products) ? data.products : []);
            }
          } else {
            if (!cancelled) setResults([]);
          }
        } else {
          if (!q) { setResults([]); return; }
          const res = await fetch(`${API_BASE}/api/products/?search=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
          const items = Array.isArray(data) ? data : (data.results || []);
          if (!cancelled) setResults(items);
        }
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [mode, q]);

  const resultsCount = results?.length || 0;

  return (
    <div className="search-results-page">
      <div className="search-results-container">
        <div className="search-header">
          <h1>Kết quả tìm kiếm {mode === 'image' ? '(Ảnh)' : ''}</h1>
          {mode === 'image' && imageSearchData && (
            <div className="image-search-info">
              <p className="detected-category">
                🎯 Phát hiện: <strong>{imageSearchData.predictedClass || imageSearchData.category}</strong>
              </p>
              <p className="category-desc">Hiển thị sản phẩm trong danh mục này</p>
            </div>
          )}
          {mode !== 'image' && (
            <div className="search-query">Từ khóa: <strong>{q || '(trống)'}</strong></div>
          )}
          <p className="results-count">{resultsCount} sản phẩm</p>
        </div>

        <div className="products-section">
          {err && <div className="search-error">{err}</div>}

          {loading ? (
            <Loading message="Đang tải kết quả..." />
          ) : resultsCount === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔎</div>
              <h3>Không tìm thấy kết quả</h3>
              <p>Thử từ khóa khác hoặc dùng tính năng “Tìm bằng ảnh” ở thanh tìm kiếm.</p>
              <div className="suggestions">
                <h4>Gợi ý nhanh</h4>
                <div className="suggestion-tags">
                  {['tshirt', 'jeans', 'sneakers', 'watch', 'bag'].map((s) => (
                    <a key={s} className="suggestion-tag" href={`/search?q=${encodeURIComponent(s)}`}>{s}</a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="results-header">
                <div className="results-info">
                  Hiển thị {resultsCount} sản phẩm
                  {mode === 'image' && <span style={{ marginLeft: 8, color: 'var(--text-light)' }}>(kết quả từ ảnh)</span>}
                </div>
              </div>
              <ProductGrid products={results} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}