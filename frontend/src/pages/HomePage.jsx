import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import VendorCard from '../components/VendorCard';
import { 
  Sparkles, Camera, Disc, UtensilsCrossed, Building2, Flower2, Search, 
  ArrowLeft, ShieldCheck, Zap, Heart, Star, CheckCircle, MessageSquare, MapPin
} from 'lucide-react';

export default function HomePage({ onOpenAIModal }) {
  const navigate = useNavigate();
  const { getVendorsCached } = useData();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  useEffect(() => {
    async function loadFeaturedVendors() {
      try {
        const data = await getVendorsCached({ limit: 4 });
        const list = data?.vendors || (Array.isArray(data) ? data : []);
        setVendors(list.slice(0, 4));
      } catch (err) {
        console.error('Failed to load vendors:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeaturedVendors();
  }, [getVendorsCached]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (searchCategory) params.set('category', searchCategory);
    navigate(`/vendors?${params.toString()}`);
  };

  const categories = [
    { key: 'photography', name: 'צלמים וסטודיו', icon: Camera, color: '#6366f1' },
    { key: 'dj_music', name: 'תקליטנים ומוזיקה', icon: Disc, color: '#ec4899' },
    { key: 'catering', name: 'קייטרינג ושפים', icon: UtensilsCrossed, color: '#f59e0b' },
    { key: 'venue', name: 'גני אירועים ואולמות', icon: Building2, color: '#10b981' },
    { key: 'design_flowers', name: 'עיצוב אירועים ופרחים', icon: Flower2, color: '#8b5cf6' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '90px 0 70px 0',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(79, 70, 229, 0.18) 0%, transparent 60%)'
      }}>
        <div className="container">
          
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', marginBottom: '16px', fontWeight: 800, lineHeight: 1.2 }}>
            סוגרים ספקים לאירוע <span className="gradient-text">בקלות ובביטחון</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', maxWidth: '720px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
            חפשו צלמים, תקליטנים, קייטרינג ואולמות מומלצים, השוו מחירים, צרו קשר ישיר בצ'אט בלייב ונהלו את תקציב האירוע שלכם בנוחות מרבית.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/vendors" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              <Search size={18} /> לצפייה בקטלוג הספקים
            </Link>

            <button onClick={onOpenAIModal} className="btn btn-gold" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              <Sparkles size={18} /> תכנון תקציב וצ'ק-ליסט ב-AI
            </button>
          </div>

        </div>
      </section>

      {/* Category Icons Section */}
      <section style={{ padding: '50px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '24px' }}>
            מה אתם מחפשים לאירוע שלכם?
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <Link 
                  key={cat.key} 
                  to={`/vendors?category=${cat.key}`}
                  className="glass-card"
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={26} color={cat.color} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Real Vendors Section */}
      <section style={{ padding: '50px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', margin: 0 }}>ספקים מומלצים במיוחד</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                הספקים המובילים ביותר שזכו לדירוגים הגבוהים ביותר מבעלי אירועים
              </p>
            </div>
            <Link to="/vendors" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              לכל קטלוג הספקים <ArrowLeft size={16} />
            </Link>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>טוען ספקים מומלצים...</p>
          ) : (
            <div className="grid-vendors">
              {vendors.map(v => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ padding: '70px 0', background: 'rgba(15, 23, 42, 0.6)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.6rem', textAlign: 'center', marginBottom: '10px' }}>
            איך EventHub עוזר לכם לסגור אירוע מושלם?
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            תהליך פשוט, שקוף ונוח מהחיפוש הראשון ועד ליום האירוע
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.2)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, margin: '0 auto 16px auto' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>מוצאים ספקים מומלצים</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                חופרים בקטלוג הספקים, מעיינים בגלריות העבודות, בודקים חוות דעת מאומתות ומשווים מחירי פתיחה.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, margin: '0 auto 16px auto' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>מדברים בלייב בצ'אט</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                שולחים בקשת תיאום או מתכתבים בזמן אמת בצ'אט הישיר מול הספקים לקבלת הצעת מחיר מותאמת אישית.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, margin: '0 auto 16px auto' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>מנהלים תקציב ומשימות</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                עוקבים אחר ניצול התקציב של האירוע בדשבורד, מנהלים צ'ק-ליסט משימות וסוגרים אירוע בראש שקט.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
