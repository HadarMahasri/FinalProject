import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-bg-alt)',
      borderTop: '1px solid var(--color-border)',
      padding: '40px 0 20px 0',
      marginTop: '60px'
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={20} color="var(--color-primary)" />
          <span style={{ fontSize: '1.2rem', fontWeight: 800 }} className="gradient-text">EventHub</span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          פלטפורמת ה-FullStack המתקדמת ביותר לתכנון ותיאום אירועים וספקים בקליק.
        </p>
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
          © {new Date().getFullYear()} EventHub | פרויקט מסכם בפולסטאק - נבנה באהבה <Heart size={14} color="#ec4899" style={{ display: 'inline', verticalAlign: 'middle' }} />
        </div>
      </div>
    </footer>
  );
}
