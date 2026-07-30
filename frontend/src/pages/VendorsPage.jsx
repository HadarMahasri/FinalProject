import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import VendorCard from '../components/VendorCard';
import { Search, Filter, RefreshCw } from 'lucide-react';

export default function VendorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const loadVendors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category && category !== 'all') params.category = category;
      if (location) params.location = location;
      if (maxPrice) params.maxPrice = maxPrice;

      const data = await api.getVendors(params);
      setVendors(data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [category, location, maxPrice]);

  const handleClearFilters = () => {
    setCategory('all');
    setLocation('');
    setMaxPrice('');
    setSearchParams({});
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
              step="500"
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
        <div className="grid-vendors">
          {vendors.map(v => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      )}

    </div>
  );
}
