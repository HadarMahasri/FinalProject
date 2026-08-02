import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Tag, Eye } from 'lucide-react';

const categoryLabels = {
  photography: 'צילום אירועים',
  dj_music: 'תקליטן & מוזיקה',
  catering: 'קייטרינג & שף',
  venue: 'אולם / גן אירועים',
  design_flowers: 'עיצוב & פרחים',
  other: 'שירותים נוספים'
};

export default function VendorCard({ vendor }) {
  const coverImg = vendor.cover_image 
    ? vendor.cover_image
    : `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80`;

  return (
    <div className="glass-card animate-fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Vendor Cover Image */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
        <img 
          src={coverImg} 
          alt={vendor.business_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
        />
        <span className="badge badge-primary" style={{ position: 'absolute', top: '12px', right: '12px' }}>
          {categoryLabels[vendor.category] || vendor.category}
        </span>
      </div>

      {/* Card Content */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{vendor.business_name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                {vendor.review_count > 0 ? Number(vendor.rating_avg).toFixed(1) : 'חדש'}
              </span>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {vendor.description || 'ספק מוביל בתחומו המספק שירות ברמה גבוהה לאירועים מיוחדים.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-subtle)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="var(--color-primary)" />
              <span>{vendor.location}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={14} color="var(--color-secondary)" />
              <span>מ- ₪{Number(vendor.starting_price).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <Link to={`/vendors/${vendor.id}`} className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Eye size={16} /> צפייה בפרופיל
        </Link>
      </div>
    </div>
  );
}
