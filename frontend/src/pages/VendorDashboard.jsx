import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSocket } from '../context/SocketContext';
import { Store, Upload, Check, X, Calendar, Phone, Mail, FileText, Image as ImageIcon, Eye, TrendingUp, CheckCircle2, DollarSign, Star, PieChart, ChevronDown, MessageSquare, Edit3 } from 'lucide-react';

const BOOKINGS_PER_PAGE = 5;

export default function VendorDashboard() {
  const { user } = useAuth();
  const { getVendorBookingsCached, updateVendorInCache, updateBookingStatusInCache } = useData();
  const { openChatWithUser } = useSocket();

  const [bookings, setBookings] = useState([]);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Tab State: 'bookings' | 'profile' | 'analytics'
  const [activeTab, setActiveTab] = useState('bookings');

  // Bookings pagination state
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalCount, setBookingsTotalCount] = useState(0);
  const [hasMoreBookings, setHasMoreBookings] = useState(false);
  const [loadingMoreBookings, setLoadingMoreBookings] = useState(false);

  // Edit Profile Form State
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [location, setLocation] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Media Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadVendorData = async (force = false) => {
    setLoading(true);
    setBookingsPage(1);
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        api.getProfile(),
        getVendorBookingsCached({ limit: BOOKINGS_PER_PAGE, page: 1 }, force)
      ]);
      setVendorProfile(profileRes.vendorProfile);
      setPhone(profileRes.user?.phone || profileRes.vendorProfile?.phone || '');

      if (profileRes.vendorProfile) {
        setDescription(profileRes.vendorProfile.description || '');
        setStartingPrice(profileRes.vendorProfile.starting_price || '');
        setLocation(profileRes.vendorProfile.location || '');
      }

      if (bookingsRes && bookingsRes.bookings) {
        setBookings(bookingsRes.bookings);
        setBookingsTotalCount(bookingsRes.totalCount || 0);
        setHasMoreBookings(bookingsRes.hasMore || false);
      } else if (Array.isArray(bookingsRes)) {
        setBookings(bookingsRes.slice(0, BOOKINGS_PER_PAGE));
        setBookingsTotalCount(bookingsRes.length);
        setHasMoreBookings(bookingsRes.length > BOOKINGS_PER_PAGE);
      }
    } catch (err) {
      console.error('Failed to load vendor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, []);

  const handleLoadMoreBookings = async () => {
    const nextPage = bookingsPage + 1;
    setLoadingMoreBookings(true);
    try {
      const res = await getVendorBookingsCached({ limit: BOOKINGS_PER_PAGE, page: nextPage });
      if (res && res.bookings) {
        setBookings(prev => [...prev, ...res.bookings]);
        setBookingsPage(nextPage);
        setHasMoreBookings(res.hasMore || false);
      }
    } catch (err) {
      console.error('Failed to load more vendor bookings:', err);
    } finally {
      setLoadingMoreBookings(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setBookings(prev => prev.map(b => Number(b.id) === Number(bookingId) ? { ...b, status: newStatus } : b));
    if (updateBookingStatusInCache) {
      updateBookingStatusInCache(bookingId, newStatus);
    }

    try {
      await api.updateBookingStatus(bookingId, newStatus);
    } catch (err) {
      alert('שגיאה בעדכון הסטטוס: ' + err.message);
      loadVendorData(true);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const updatedFields = {
        phone,
        description,
        starting_price: Number(startingPrice) || 0,
        location
      };

      await api.updateVendorProfile(updatedFields);
      alert('פרטי העסק עודכנו בהצלחה!');

      setVendorProfile(prev => ({ ...prev, ...updatedFields }));
      if (vendorProfile?.id && updateVendorInCache) {
        updateVendorInCache(vendorProfile.id, updatedFields);
      }
    } catch (err) {
      alert('שגיאה בעדכון הפרטים: ' + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('נא לבחור קובץ תמונה להעלאה.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const res = await api.uploadMedia(formData);
      alert('התמונה הועלתה בהצלחה לגלריה!');
      setSelectedFile(null);
      const uploadedPath = res?.file_path || res?.media?.file_path;
      if (uploadedPath) {
        if (!vendorProfile?.cover_image) {
          setVendorProfile(prev => ({ ...prev, cover_image: uploadedPath }));
          if (vendorProfile?.id && updateVendorInCache) {
            updateVendorInCache(vendorProfile.id, { cover_image: uploadedPath });
          }
        }
      }
    } catch (err) {
      alert('שגיאה בהעלאת התמונה: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const approvedBookingsCount = bookings.filter(b => b.status === 'approved').length;
  const totalAgreedSpent = bookings.reduce((sum, b) => sum + Number(b.agreed_price || 0), 0);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>טוען את נתוני הדשבורד של העסק...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <span className="badge badge-gold" style={{ marginBottom: '8px' }}>אזור אישי - ספק</span>
          <h1 style={{ fontSize: '2rem' }}>{vendorProfile?.business_name || user?.name} 👋</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>ניהול נוח של פניות הלקוחות, צ'אט בלייב, עדכון פרטי העסק והעלאת תמונות לגלרייה</p>
        </div>

        {vendorProfile?.id && (
          <Link to={`/vendors/${vendorProfile.id}`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} /> תצוגה מקדימה כפי שלקוחות רואים
          </Link>
        )}
      </div>

      {/* Segmented Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '32px', 
        background: 'rgba(15, 23, 42, 0.8)', 
        padding: '6px', 
        borderRadius: '16px', 
        border: '1px solid var(--color-border)',
        overflowX: 'auto'
      }}>
        <button 
          onClick={() => setActiveTab('bookings')} 
          style={{ 
            flex: 1, 
            minWidth: '160px',
            padding: '12px 16px', 
            borderRadius: '12px', 
            border: 'none',
            background: activeTab === 'bookings' ? 'linear-gradient(135deg, var(--color-primary), #4338ca)' : 'transparent',
            color: activeTab === 'bookings' ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <FileText size={18} /> פניות מספקים ({bookingsTotalCount || bookings.length})
        </button>

        <button 
          onClick={() => setActiveTab('profile')} 
          style={{ 
            flex: 1, 
            minWidth: '160px',
            padding: '12px 16px', 
            borderRadius: '12px', 
            border: 'none',
            background: activeTab === 'profile' ? 'linear-gradient(135deg, var(--color-primary), #4338ca)' : 'transparent',
            color: activeTab === 'profile' ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Store size={18} /> ניהול פרופיל עסק וגלרייה
        </button>

        <button 
          onClick={() => setActiveTab('analytics')} 
          style={{ 
            flex: 1, 
            minWidth: '160px',
            padding: '12px 16px', 
            borderRadius: '12px', 
            border: 'none',
            background: activeTab === 'analytics' ? 'linear-gradient(135deg, var(--color-primary), #4338ca)' : 'transparent',
            color: activeTab === 'analytics' ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <TrendingUp size={18} /> סטטיסטיקות וביצועים
        </button>
      </div>

      {/* TAB 1: BOOKINGS / ENQUIRIES */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in">
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={22} color="var(--color-primary)" /> פניות והצעות מחיר מלקוחות ({bookingsTotalCount || bookings.length})
            </h2>

            {bookings.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '20px 0' }}>טרם התקבלו פניות מלקוחות.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bookings.map(b => (
                    <div key={b.id} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <span className="badge badge-primary" style={{ marginBottom: '4px' }}>{b.event_type}</span>
                          <h3 style={{ fontSize: '1.15rem' }}>{b.event_title}</h3>
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            שם הלקוח/ה: <b>{b.customer_name}</b> | טלפון: <b>{b.customer_phone || 'טרם עודכן'}</b>
                          </p>
                        </div>

                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>מחיר מוצע / מוסכם</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
                            ₪{Number(b.agreed_price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                        תאריך אירוע: <b>{new Date(b.event_date).toLocaleDateString('he-IL')}</b> | אזור: <b>{b.location}</b> | אורחים: <b>{b.guest_count || 'לא צוין'}</b>
                        {b.notes && <p style={{ marginTop: '6px', color: 'var(--color-text-main)' }}>הערות הלקוח: "{b.notes}"</p>}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          {b.status === 'pending' && <span className="badge badge-warning">ממתין לתגובתך</span>}
                          {b.status === 'approved' && <span className="badge badge-success">אישרת פנייה זו</span>}
                          {b.status === 'declined' && <span className="badge badge-danger">דחית פנייה זו</span>}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {b.customer_id && (
                            <button onClick={() => openChatWithUser(b.customer_id)} className="btn btn-gold btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MessageSquare size={16} /> צ'אט עם הלקוח/ה
                            </button>
                          )}

                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateStatus(b.id, 'approved')} className="btn btn-primary btn-sm">
                                <Check size={16} /> אישור פנייה
                              </button>
                              <button onClick={() => handleUpdateStatus(b.id, 'declined')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)' }}>
                                <X size={16} /> דחייה
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Bookings Button */}
                {hasMoreBookings && (
                  <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      מוצגות <b>{bookings.length}</b> מתוך <b>{bookingsTotalCount}</b> פניות
                    </p>
                    <button 
                      onClick={handleLoadMoreBookings} 
                      className="btn btn-secondary" 
                      disabled={loadingMoreBookings}
                      style={{ padding: '10px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ChevronDown size={16} /> {loadingMoreBookings ? 'טוען פניות...' : `טען פניות נוספות (${bookingsTotalCount - bookings.length} נותרו)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE & MEDIA GALLERY MANAGEMENT */}
      {activeTab === 'profile' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Edit Profile Form */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={20} color="var(--color-primary)" /> עדכון פרטי העסק והמחירים
            </h2>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">טלפון ליצירת קשר</label>
                <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">מחיר פתיחה מוערך (₪)</label>
                  <input type="number" className="form-input" min="0" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">אזור פעילות</label>
                  <select className="form-select" value={location} onChange={e => setLocation(e.target.value)}>
                    <option value="תל אביב והמרכז">תל אביב והמרכז</option>
                    <option value="ירושלים והסביבה">ירושלים והסביבה</option>
                    <option value="צפון והגליל">צפון והגליל</option>
                    <option value="שפלה ודרום">שפלה ודרום</option>
                    <option value="כל הארץ">כל הארץ</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">על העסק והשירות</label>
                <textarea className="form-textarea" rows="4" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" disabled={updatingProfile} style={{ alignSelf: 'flex-start' }}>
                {updatingProfile ? 'מעדכן...' : 'שמור שינויים בפרטי העסק'}
              </button>
            </form>
          </div>

          {/* Media Upload Form */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="var(--color-primary)" /> העלאת תמונות לגלרייה
            </h2>

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">בחר תמונה להעלאה (JPG / PNG / WEBP)</label>
                <input 
                  type="file" 
                  className="form-input" 
                  accept="image/*" 
                  onChange={e => setSelectedFile(e.target.files[0])} 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-gold" disabled={uploading || !selectedFile} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} /> {uploading ? 'מעלה תמונה...' : 'העלה תמונה לגלרייה'}
              </button>
            </form>

            {vendorProfile?.cover_image && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>תמונת שער נוכחית:</span>
                <img 
                  src={vendorProfile.cover_image} 
                  alt="Cover" 
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--color-border)' }} 
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: ANALYTICS & PERFORMANCE */}
      {activeTab === 'analytics' && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '16px', borderRadius: '14px', color: '#fbbf24' }}>
                <Calendar size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>פניות חדשות (ממתינות)</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{pendingBookingsCount}</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '16px', borderRadius: '14px', color: '#34d399' }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>סגירות שנחתמו (מאושרות)</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{approvedBookingsCount}</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(79, 70, 229, 0.15)', padding: '16px', borderRadius: '14px', color: '#a5b4fc' }}>
                <Star size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>דירוג ממוצע מעודכן</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>
                  {vendorProfile?.review_count > 0 ? `${Number(vendorProfile.rating_avg).toFixed(1)} ⭐` : 'טרם דורג (ספק חדש)'}
                </span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '16px', borderRadius: '14px', color: '#34d399' }}>
                <DollarSign size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>סך הכנסות מוסכמות</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>₪{totalAgreedSpent.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
