import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import VendorCard from '../components/VendorCard';
import { Sparkles, Camera, Disc, UtensilsCrossed, Building2, Flower2, Search, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

export default function HomePage({ onOpenAIModal }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedVendors() {
      try {
        const data = await api.getVendors();
        setVendors(data.slice(0, 4)); // Show top 4 vendors
      } catch (err) {
        console.error('Failed to load vendors:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeaturedVendors();
  }, []);

  const categories = [
    { key: 'photography', name: 'צילום אירועים', icon: Camera, color: '#6366f1' },
    { key: 'dj_music', name: 'תקליטן & מוזיקה', icon: Disc, color: '#ec4899' },
    { key: 'catering', name: 'קייטרינג & שף', icon: UtensilsCrossed, color: '#f59e0b' },
    { key: 'venue', name: 'אולמות & גנים', icon: Building2, color: '#10b981' },
    { key: 'design_flowers', name: 'עיצוב & פרחים', icon: Flower2, color: '#8b5cf6' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '100px 0 80px 0',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)'
      }}>
        <div className="container">
          
          <div className="badge badge-gold" style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
            ✨ פלטפורמת האירועים של ישראל 2026
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginBottom: '24px', fontWeight: 800, letterSpacing: '-1px' }}>
            מתכננים אירוע? סוגרים את <br />
            <span className="gradient-text">הספקים הטובים ביותר בקליק</span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: '700px', margin: '0 auto 40px auto' }}>
            חיפוש ספקים מובילים, תיאום מחירים, ניהול אירועים אישיים, וייעוץ תקציבי חכם מבוסס AI - הכל במקום אחד.
          </p>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/vendors" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              <Search size={20} /> לספורים ולספקים המובילים
            </Link>

            <button onClick={onOpenAIModal} className="btn btn-gold" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              <Sparkles size={20} /> תכנון תקציב חכם ב-AI
            </button>
          </div>

        </div>
      </section>

      {/* Categories Bar */}
      <section style={{ padding: '40px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '30px' }}>
            חיפוש לפי קטגוריה
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
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={26} color={cat.color} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Vendors Section */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem' }}>ספקים מומלצים</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>הספקים המובילים ביותר עם הדירוגים הגבוהים ביותר ברשת</p>
            </div>
            <Link to="/vendors" style={{ color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              לכל הספקים <ArrowLeft size={16} />
            </Link>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>טוען ספקים מומלצים...</p>
          ) : (
            <div className="grid-vendors">
              {vendors.map(v => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights */}
      <section style={{ padding: '60px 0', background: 'rgba(19, 27, 46, 0.5)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          
          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
              <ShieldCheck size={28} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>ספקים מאושרים ומאומתים</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>כל ספק נבדק ומאושר ע"י מנהלי המערכת כולל שקיפות מחירים וחוות דעת אמיתיות.</p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
              <Zap size={28} color="var(--color-gold)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>יועץ AI אישי</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>אלגוריתם חכם שיעזור לך להגדיר תקציב נכון, לחלק את הכסף בין הספקים ולקבל צ'קליסט מלא.</p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
              <Sparkles size={28} color="var(--color-secondary)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>דשבורד אישי מקצה לקצה</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>ניהול בקשות, הזמנות, מעקב סטטוסים ותקשורת ישירה מול הספקים בנוחות מרבית.</p>
          </div>

        </div>
      </section>

    </div>
  );
}
