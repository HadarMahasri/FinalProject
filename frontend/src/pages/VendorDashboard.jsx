import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Store, Upload, Check, X, Calendar, Phone, Mail, FileText, Image as ImageIcon, Eye } from 'lucide-react';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Form State
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [location, setLocation] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Media Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        api.getProfile(),
        api.getVendorBookings()
      ]);
      setVendorProfile(profileRes.vendorProfile);
      if (profileRes.vendorProfile) {
        setDescription(profileRes.vendorProfile.description || '');
        setStartingPrice(profileRes.vendorProfile.starting_price || '');
        setLocation(profileRes.vendorProfile.location || '');
      }
      setBookings(bookingsRes || []);
    } catch (err) {
      console.error('Failed to load vendor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      alert(`סטטוס הבקשה עודכן ל-${newStatus === 'approved' ? 'אושר' : 'נדחה'}`);
      loadVendorData();
    } catch (err) {
      alert('שגיאה בעדכון הסטטוס: ' + err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.updateVendorProfile({
        description,
        starting_price: Number(startingPrice),
        location
      });
      alert('פרופיל העסק עודכן בהצלחה!');
      loadVendorData();
    } catch (err) {
      alert('שגיאה בעדכון הפרופיל: ' + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('נא לבחור קובץ להעלאה.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await api.uploadMedia(formData);
      alert('התמונה הועלתה בהצלחה לגלריה!');
      setSelectedFile(null);
      loadVendorData();
    } catch (err) {
      alert('שגיאה בהעלאת התמונה: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'תאריך טרם נקבע';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('he-IL');
  };

  const mediaList = vendorProfile?.media || [];

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Store size={28} color="var(--color-secondary)" />
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '2px' }}>אזור ניהול ספק - {vendorProfile?.business_name || user.name}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>ניהול פניות נכנסות מלקוחות, עדכון מחירון והעלאת תמונות לגלריה</p>
          </div>
        </div>

        {vendorProfile && (
          <Link to={`/vendors/${vendorProfile.id}`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={16} color="var(--color-primary)" /> לצפייה בפרופיל הציבורי שלך
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* Main Left Column: Bookings & My Gallery */}
        <div>
          
          {/* Bookings Table / List */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>פניות נכנסות מלקוחות ({bookings.length})</h2>

            {loading ? (
              <p style={{ color: 'var(--color-text-muted)' }}>טוען פניות...</p>
            ) : bookings.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>אין פניות נכנסות כרגע.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookings.map(b => (
                  <div key={b.id} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{b.event_title} ({b.event_type})</h3>
                        <p style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 700 }}>
                          תאריך האירוע: {formatDate(b.event_date)}
                        </p>
                      </div>

                      <span className={`badge ${b.status === 'approved' ? 'badge-success' : b.status === 'declined' ? 'badge-danger' : 'badge-warning'}`}>
                        {b.status === 'approved' ? 'מאושר' : b.status === 'declined' ? 'נדחה' : 'ממתין לתשובה'}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                      <p style={{ marginBottom: '4px' }}>שם הלקוח: <b>{b.customer_name}</b> | טלפון: <b>{b.customer_phone || '054-0000000'}</b> | אימייל: <b>{b.customer_email || 'לא צוין'}</b></p>
                      {b.notes && <p style={{ color: 'var(--color-text-main)', marginTop: '4px' }}>הערות: "{b.notes}"</p>}
                    </div>

                    {b.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleUpdateStatus(b.id, 'declined')} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--color-danger)', color: '#f87171' }}>
                          <X size={14} /> דחה פנייה
                        </button>
                        <button onClick={() => handleUpdateStatus(b.id, 'approved')} className="btn btn-primary btn-sm">
                          <Check size={14} /> אישור הזמנה
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dedicated My Gallery Section */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={22} color="var(--color-primary)" /> הגלריה שלי ({mediaList.length} תמונות)
              </h2>
              {vendorProfile && (
                <Link to={`/vendors/${vendorProfile.id}`} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  איך הלקוחות רואים את הגלריה? ←
                </Link>
              )}
            </div>

            {mediaList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  טרם העלית תמונות לגלריה. השתמש בטופס הצידי כדי להעלות תמונות ראשונות!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
                {mediaList.map(m => {
                  const mediaUrl = m.file_path.startsWith('http') ? m.file_path : `http://localhost:5000${m.file_path}`;
                  return (
                    <div key={m.id} style={{ height: '120px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
                      <img src={mediaUrl} alt="תמונת גלריה" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar: Media Upload & Profile Edit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* File Upload Box (Multer API) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="var(--color-primary)" /> העלאת תמונה לגלריית העסק
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              העלאת קבצים ישירות לשרת Node.js (תמיכה ב-JPG, PNG, WEBP).
            </p>

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => setSelectedFile(e.target.files[0])}
                className="form-input" 
                style={{ padding: '8px' }} 
              />
              <button type="submit" className="btn btn-gold btn-sm" disabled={uploading || !selectedFile}>
                <Upload size={14} /> {uploading ? 'מעלה קובץ לשרת...' : 'העלה תמונה לגלריה'}
              </button>
            </form>
          </div>

          {/* Quick Profile Edit */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>עדכון פרטי עסק</h3>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">מחיר פתיחה מוערך (₪)</label>
                <input type="number" className="form-input" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">אזור פעילות עיקרי</label>
                <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">תיאור העסק</label>
                <textarea className="form-textarea" rows="3" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={updatingProfile}>
                {updatingProfile ? 'שומר שינויים...' : 'שמור עדכונים'}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
