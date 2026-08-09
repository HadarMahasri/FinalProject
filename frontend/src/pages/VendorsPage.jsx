import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import VendorCard from '../components/VendorCard';
import { Search, Filter, RefreshCw, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 6;

export default function VendorsPage() {
  const { getVendorsCached } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters state
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const loadInitialVendors = async () => {
    setLoading(true);
    setPage(1);
    try {
      const params = { limit: PAGE_SIZE, page: 1 };
      if (category && category !== 'all') params.category = category;
      if (location) params.location = location;

      // Fix maxPrice vs max_price query parameter mismatch with backend
      if (maxPrice) params.max_price = maxPrice;

      const res = await getVendorsCached(params);

      if (res && res.vendors) {
        setVendors(res.vendors);
        setTotalCount(res.totalCount || 0);
        setHasMore(res.hasMore || false);
      } else if (Array.isArray(res)) {
        setVendors(res.slice(0, PAGE_SIZE));
        setTotalCount(res.length);
        setHasMore(res.length > PAGE_SIZE);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialVendors();
  }, [category, location, maxPrice]);

  const handleClearFilters = () => {
    setCategory('all');
    setLocation('');
    setMaxPrice('');
    setSearchParams({});
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = { limit: PAGE_SIZE, page: nextPage };
      if (category && category !== 'all') params.category = category;
      if (location) params.location = location;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await getVendorsCached(params);

      if (res && res.vendors) {
        setVendors(prev => [...prev, ...res.vendors]);
        setPage(nextPage);
        setHasMore(res.hasMore || false);
      }
    } catch (err) {
      console.error('Failed to load more vendors:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }} className="gradient-text">קטלוג הספקים</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>חפש וסנן את הספקים המובילים ביותר לאירוע שלך</p>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          
          <div className="form-group">
            <label className="form-label">קטגוריה</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="all">כל הקטגוריות</option>
              <option value="photography">צילום אירועים</option>
              <option value="dj_music">תקליטן & מוזיקה</option>
              <option value="catering">קייטרינג & שף</option>
              <option value="venue">אולמות & גנים</option>
              <option value="design_flowers">עיצוב & פרחים</option>
              <option value="other">שירותים נוספים</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">חיפוש לפי אזור</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="למשל: תל אביב, ירושלים, צפון" 
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">מחיר מקסימלי (₪)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="לדוגמה: 5000" 
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>

          <button onClick={handleClearFilters} className="btn btn-secondary" style={{ height: '46px' }}>
            <RefreshCw size={16} /> איפוס מסננים
          </button>

        </div>
      </div>

      {/* Vendors Grid Output */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          <span className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 700 }}>טוען את רשימת הספקים...</span>
        </div>
      ) : vendors.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>לא נמצאו ספקים העונים לקריטריונים אלו.</p>
          <button onClick={handleClearFilters} className="btn btn-primary">הצג את כל הספקים</button>
        </div>
      ) : (
        <>
          <div className="grid-vendors">
            {vendors.map(v => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>

          {/* Server-Side Paginated Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                מוצגים <b>{vendors.length}</b> מתוך <b>{totalCount}</b> ספקים בקטלוג
              </p>
              <button 
                onClick={handleLoadMore} 
                className="btn btn-secondary" 
                disabled={loadingMore}
                style={{ padding: '12px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronDown size={18} /> {loadingMore ? 'טוען ספקים מ-SQL...' : `טען ספקים נוספים (${totalCount - vendors.length} נותרו ב-DB)`}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
