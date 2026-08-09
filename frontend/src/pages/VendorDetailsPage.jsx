import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSocket } from '../context/SocketContext';
import { Star, MapPin, Phone, Calendar, Image as ImageIcon, CheckCircle, AlertTriangle, MessageSquare, Store, Eye } from 'lucide-react';

const categoryLabels = {
  photography: 'צלמים וסטודיו',
  dj_music: 'תקליטנים ומוזיקה',
  catering: 'קייטרינג ושפים',
  venue: 'גני אירועים ואולמות',
  design_flowers: 'עיצוב אירועים ופרחים',
  other: 'אטרקציות ובידור'
};

export default function VendorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { updateVendorInCache, addBookingToCache } = useData();
  const { openChatWithUser } = useSocket();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customerEvents, setCustomerEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isUserLoggedIn = Boolean(user || token || isAuthenticated);
  const isVendorAccount = user?.role === 'vendor';
  const isCustomerAccount = user?.role === 'customer' || !user?.role;

  useEffect(() => {
    async function loadVendorDetails() {
      try {
        setLoading(true);
        const data = await api.getVendorById(id);
        setVendor(data);
      } catch (err) {
        console.error('Failed to load vendor:', err);
        setError('שגיאה בטעינת פרטי הספק.');
      } finally {
        setLoading(false);
      }
    }
    loadVendorDetails();
  }, [id]);

  const handleOpenBooking = async () => {
    if (!isUserLoggedIn) {
      alert('נא להתחבר למערכת כדי לשלוח בקשת תיאום לספק.');
      navigate('/login');
      return;
    }

    if (isVendorAccount) {
      alert('חשבון ספק מיועד לצפייה וניהול עסק בלבד. שליחת בקשות תיאום מיועדת לחשבון לקוח.');
      return;
    }

    try {
      const events = await api.getCustomerEvents();
      setCustomerEvents(events || []);
      if (events && events.length > 0) {
        setSelectedEventId(events[0].id);
      }
      setShowBookingModal(true);
    } catch (err) {
      alert('שגיאה בטעינת רשימת האירועים שלך: ' + err.message);
    }
  };

  const handleSendBooking = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      alert('נא לבחור אירוע מתוך הרשימה.');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await api.createBooking({
        event_id: Number(selectedEventId),
        vendor_id: Number(vendor.id),
        notes: bookingNotes,
        agreed_price: vendor.starting_price
      });

      alert(res.message || 'בקשת התיאום נשלחה לספק בהצלחה!');
      setShowBookingModal(false);
      setBookingNotes('');
      if (addBookingToCache) addBookingToCache();
    } catch (err) {
      alert('שגיאה בשליחת הבקשה: ' + err.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isUserLoggedIn) {
      alert('נא להתחבר כדי להוסיף ביקורת.');
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.createReview({
        vendor_id: Number(vendor.id),
        rating: Number(rating),
        comment
      });
      alert('תודה על חוות הדעת! הביקורת נוספה בהצלחה.');
      setComment('');
      
      // Update local state directly - ZERO extra GET network calls!
      if (res && res.review) {
        const newReviews = [res.review, ...(vendor?.reviews || [])];
        const newCount = newReviews.length;
        const newAvg = (newReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / newCount).toFixed(1);

        setVendor(prev => ({
          ...prev,
          reviews: newReviews,
          review_count: newCount,
          rating_avg: Number(newAvg)
        }));

        if (updateVendorInCache) {
          updateVendorInCache(vendor.id, {
            review_count: newCount,
            rating_avg: Number(newAvg)
          });
        }
      }
    } catch (err) {
      alert('שגיאה בהוספת הביקורת: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>טוען את פרטי הספק...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error || 'ספק לא נמצא במערכת.'}</h2>
        <button onClick={() => navigate('/vendors')} className="btn btn-primary">חזרה לקטלוג הספקים</button>
      </div>
    );
  }

  const coverImg = vendor.cover_image
    ? vendor.cover_image
    : `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80`;

  // Selected Event & Budget Analysis for Booking Modal
  const selectedEvent = customerEvents.find(e => Number(e.id) === Number(selectedEventId));
  const eventBudget = Number(selectedEvent?.budget) || 0;
  const vendorPrice = Number(vendor.starting_price) || 0;
  const isOverBudget = eventBudget > 0 && vendorPrice > eventBudget;
  const budgetDifference = Math.abs(vendorPrice - eventBudget);

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Cover & Hero Info */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ height: '320px', width: '100%', position: 'relative' }}>
          <img src={coverImg} alt={vendor.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(11, 15, 25, 0.95) 0%, transparent 60%)'
          }} />
          <div style={{ position: 'absolute', bottom: '24px', right: '24px', left: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                {categoryLabels[vendor.category] || vendor.category}
              </span>
              <h1 style={{ fontSize: '2.2rem', color: '#fff' }}>{vendor.business_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} color="var(--color-primary)" /> {vendor.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={16} color="var(--color-success)" /> {vendor.phone || 'טרם עודכן'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>מחיר פתיחה מוערך</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>₪{Number(vendor.starting_price).toLocaleString()}</span>
              </div>

              {isVendorAccount ? (
                <div style={{ background: 'rgba(124, 58, 237, 0.2)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Eye size={18} color="var(--color-primary)" />
                  <span>מצב צפייה כספק</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => openChatWithUser(vendor.user_id)} className="btn btn-gold" style={{ padding: '14px 20px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} /> צ'אט בלייב עם הספק
                  </button>
                  <button onClick={handleOpenBooking} className="btn btn-primary" style={{ padding: '14px 24px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} /> שלח בקשת תיאום
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* Main Content & Gallery */}
        <div>
          
          {/* Business Description */}
          <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>על העסק והשירות</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.8 }}>
              {vendor.description || 'ספק מוביל ומומלץ בתחומו. מעניק יחס אישי, מקצועיות ללא פשרות וליווי מלא לאורך כל הדרך באירוע שלכם.'}
            </p>
          </div>

          {/* Media Gallery */}
          <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="var(--color-primary)" /> גלריית עבודות ותמונות
            </h2>

            {(!vendor.media || vendor.media.length === 0) ? (
              <p style={{ color: 'var(--color-text-muted)' }}>טרם הועלו תמונות לגלריית העסק.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {vendor.media.map(m => {
                  const imgUrl = m.file_path;
                  return (
                    <div key={m.id} style={{ height: '150px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img src={imgUrl} alt="גלריה" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Reviews Section */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="#fbbf24" /> חוות דעת של לקוחות ({vendor.reviews?.length || 0})
            </h2>

            {(!vendor.reviews || vendor.reviews.length === 0) ? (
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>טרם נכתבו חוות דעת עבור ספק זה.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {vendor.reviews.map(r => (
                  <div key={r.id} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{r.customer_name || 'לקוח מאומת'}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} color={i < r.rating ? '#fbbf24' : '#475569'} fill={i < r.rating ? '#fbbf24' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Review Form for Customers */}
            {isUserLoggedIn && isCustomerAccount && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px border var(--color-border)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>הוסף חוות דעת ודירוג</h3>
                
                <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">דירוג באירוע (1 עד 5 כוכבים)</label>
                    <select className="form-select" value={rating} onChange={e => setRating(e.target.value)}>
                      <option value={5}>⭐⭐⭐⭐⭐ (5 - מעולה ביותר)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 - טוב מאוד)</option>
                      <option value={3}>⭐⭐⭐ (3 - בינוני)</option>
                      <option value={2}>⭐⭐ (2 - לא מספק)</option>
                      <option value={1}>⭐ (1 - גרוע)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">תוכן חוות הדעת שלך</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3" 
                      value={comment} 
                      onChange={e => setComment(e.target.value)} 
                      placeholder="ספר על השירות, העמידה בזמנים והחוויה מהאירוע שלך..." 
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-gold btn-sm" disabled={submittingReview}>
                    {submittingReview ? 'מוסיף...' : 'פרסם חוות דעת'}
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Actions & Vendor Summary */}
        <div>
          <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>סיכום פרטי ספק</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>דירוג ממוצע:</span>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                  {vendor.review_count > 0 ? `${Number(vendor.rating_avg).toFixed(1)} ⭐ (${vendor.review_count} מדרגים)` : 'טרם נכתבו ביקורות (0 מדרגים)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>אזור פעילות:</span>
                <span style={{ fontWeight: 600 }}>{vendor.location}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>מחיר פתיחה:</span>
                <span style={{ fontWeight: 800, color: '#fbbf24' }}>₪{Number(vendor.starting_price).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--color-success)" />
                <span>מענה מהיר לבקשות תיאום</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--color-success)" />
                <span>אפשרות להתאמת חבילת מחיר אישית</span>
              </div>
            </div>

            {isVendorAccount ? (
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '10px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <Store size={16} color="var(--color-primary)" style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                מצב צפייה בספק כקולגה
              </div>
            ) : (
              <button onClick={handleOpenBooking} className="btn btn-primary" style={{ width: '100%' }}>
                <Calendar size={18} /> שלח בקשת תיאום
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }} className="gradient-text">שליחת בקשת תיאום ל-{vendor.business_name}</h2>
            
            {customerEvents.length === 0 ? (
              <div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>עדיין לא הגדרת אירועים בחשבונך. צרי אירוע חדש בדשבורד כדי לשלוח בקשות תיאום לספקים.</p>
                <button onClick={() => navigate('/dashboard/customer')} className="btn btn-primary">עבור לדשבורד ליצירת אירוע</button>
              </div>
            ) : (
              <form onSubmit={handleSendBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">בחר אירוע מתוך החשבון שלך</label>
                  <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                    {customerEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title} (תקציב: ₪{Number(ev.budget).toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                {/* Smart Budget Analysis & Alert Badge */}
                {selectedEvent && eventBudget > 0 && (
                  <div style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: isOverBudget ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${isOverBudget ? '#ef4444' : '#10b981'}`,
                    fontSize: '0.88rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontWeight: 700, color: isOverBudget ? '#f87171' : '#34d399' }}>
                      {isOverBudget ? <AlertTriangle size={18} color="#ef4444" /> : <CheckCircle size={18} color="#10b981" />}
                      <span>{isOverBudget ? 'התראת חריגה מתקציב האירוע!' : 'הפנייה תואמת את מסגרת התקציב'}</span>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                      תקציב מתוכנן לאירוע: <b>₪{eventBudget.toLocaleString()}</b> | מחיר פתיחה של הספק: <b>₪{vendorPrice.toLocaleString()}</b>
                      {isOverBudget && <span style={{ display: 'block', marginTop: '4px', color: '#f87171', fontWeight: 600 }}>חריגה מוערכת: ₪{budgetDifference.toLocaleString()} (ניתן עדיין לשלוח פנייה ולבקש הצעת מחיר מותאמת אישית).</span>}
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">הערות / בקשות מיוחדות לספק</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    value={bookingNotes} 
                    onChange={e => setBookingNotes(e.target.value)} 
                    placeholder="פרטי האירוע, סגנון מבוקש, שעות פעילות מוערכות..." 
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowBookingModal(false)} className="btn btn-secondary">ביטול</button>
                  <button type="submit" className="btn btn-primary" disabled={bookingSubmitting}>
                    {bookingSubmitting ? 'שולח...' : 'שלח בקשה'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
