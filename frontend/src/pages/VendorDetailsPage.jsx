import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Star, MapPin, Tag, Phone, Mail, Calendar, Send, CheckCircle, Image as ImageIcon } from 'lucide-react';

const categoryLabels = {
  photography: 'צילום אירועים',
  dj_music: 'תקליטן & מוזיקה',
  catering: 'קייטרינג & שף',
  venue: 'אולמות & גנים',
  design_flowers: 'עיצוב & פרחים',
  other: 'שירותים נוספים'
};

export default function VendorDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customerEvents, setCustomerEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Review State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadVendorDetails = async () => {
    try {
      const data = await api.getVendorById(id);
      setVendor(data);
    } catch (err) {
      console.error('Failed to load vendor details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorDetails();
  }, [id]);

  const handleOpenBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      alert('רק לקוח רשום יכול לשלוח בקשת הזמנה לספק.');
      return;
    }
    try {
      const events = await api.getCustomerEvents();
      setCustomerEvents(events);
      if (events.length > 0) setSelectedEventId(events[0].id);
      setShowBookingModal(true);
    } catch (err) {
      alert('שגיאה בשליפת האירועים שלך: ' + err.message);
    }
  };

  const handleSendBooking = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      alert('נא לבחור אירוע או ליצור אירוע חדש בדשבורד.');
      return;
    }
    setBookingSubmitting(true);
    try {
      await api.createBooking({
        event_id: selectedEventId,
        vendor_id: vendor.id,
        notes: bookingNotes,
        agreed_price: vendor.starting_price
      });
      alert('בקשת הצעת המחיר נשלחה לספק בהצלחה!');
      setShowBookingModal(false);
    } catch (err) {
      alert('שגיאה בשליחת הבקשה: ' + err.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setReviewSubmitting(true);
    try {
      await api.addReview({
        vendor_id: vendor.id,
        rating: Number(rating),
        comment
      });
      alert('תודה! חוות הדעת שלך נוספה בהצלחה.');
      setComment('');
      loadVendorDetails();
    } catch (err) {
      alert('שגיאה בהוספת הביקורת: ' + err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0' }}><span className="gradient-text">טוען פרטי ספק...</span></div>;
  if (!vendor) return <div style={{ textAlign: 'center', padding: '80px 0' }}><h2>ספק לא נמצא.</h2></div>;

  const coverImg = vendor.cover_image 
    ? (vendor.cover_image.startsWith('http') ? vendor.cover_image : `http://localhost:5000${vendor.cover_image}`)
    : `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80`;

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
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={16} color="var(--color-success)" /> {vendor.phone || '050-0000000'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>מחיר פתיחה מוערך</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>₪{Number(vendor.starting_price).toLocaleString()}</span>
              </div>

              <button onClick={handleOpenBooking} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
                <Calendar size={18} /> שלח בקשת תיאום
              </button>
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
              <p style={{ color: 'var(--color-text-subtle)' }}>טרם הועלו תמונות לגלריה.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {vendor.media.map(m => {
                  const mediaUrl = m.file_path.startsWith('http') ? m.file_path : `http://localhost:5000${m.file_path}`;
                  return (
                    <div key={m.id} style={{ height: '140px', borderRadius: '10px', overflow: 'hidden' }}>
                      <img src={mediaUrl} alt="גלריית ספק" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Reviews Section */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>חוות דעת ודירוגים ({vendor.reviews ? vendor.reviews.length : 0})</h2>

            {/* Add Review Form */}
            {user && user.role === 'customer' && (
              <form onSubmit={handleAddReview} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>הוסף חוות דעת על הספק</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>דירוג:</label>
                  <select className="form-select" value={rating} onChange={e => setRating(e.target.value)} style={{ width: 'auto' }}>
                    <option value="5">⭐⭐⭐⭐⭐ (5 - מעולה)</option>
                    <option value="4">⭐⭐⭐⭐ (4 - טוב מאוד)</option>
                    <option value="3">⭐⭐⭐ (3 - בסדר)</option>
                    <option value="2">⭐⭐ (2 - טעון שיפור)</option>
                    <option value="1">⭐ (1 - לא מומלץ)</option>
                  </select>
                </div>

                <div className="form-group">
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    placeholder="שתף את החוויה שלך..." 
                    value={comment} 
                    onChange={e => setComment(e.target.value)} 
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-sm" disabled={reviewSubmitting}>
                  <Send size={14} /> {reviewSubmitting ? 'שולח...' : 'פרסם חוות דעת'}
                </button>
              </form>
            )}

            {/* List Reviews */}
            {(!vendor.reviews || vendor.reviews.length === 0) ? (
              <p style={{ color: 'var(--color-text-subtle)' }}>עדיין אין ביקורות עבור ספק זה. היו הראשונים לדרג!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {vendor.reviews.map(rev => (
                  <div key={rev.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rev.customer_name}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{rev.comment}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '6px', display: 'block' }}>
                      {new Date(rev.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Sidebar Summary & Contact */}
        <div>
          <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>סיכום ואישור ספק</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--color-success)" />
                <span>פרופיל מאושר ומאומת במערכת</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--color-success)" />
                <span>מענה מהיר לבקשות תיאום</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--color-success)" />
                <span>אפשרות להתאמת חבילת מחיר אישית</span>
              </div>
            </div>

            <button onClick={handleOpenBooking} className="btn btn-primary" style={{ width: '100%' }}>
              <Calendar size={18} /> שלח בקשת תיאום
            </button>
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
                      <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.event_date).toLocaleDateString('he-IL')})</option>
                    ))}
                  </select>
                </div>

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
