import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Sparkles, Clock, CheckCircle2, XCircle, Tag, MapPin, Users } from 'lucide-react';

export default function CustomerDashboard({ onOpenAIModal }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Event Form Modal State
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('חתונה');
  const [eventDate, setEventDate] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('מרכז');
  const [guestCount, setGuestCount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        api.getCustomerEvents(),
        api.getCustomerBookings()
      ]);
      setEvents(eventsRes);
      setBookings(bookingsRes);
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createEvent({
        title,
        event_type: eventType,
        event_date: eventDate,
        budget: Number(budget) || 0,
        location,
        guest_count: Number(guestCount) || 0,
        notes
      });
      alert('האירוע נוצר בהצלחה!');
      setShowAddEventModal(false);
      // Reset form
      setTitle('');
      setEventDate('');
      setBudget('');
      setGuestCount('');
      setNotes('');
      loadData();
    } catch (err) {
      alert('שגיאה ביצירת האירוע: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> אושר ע"י הספק</span>;
      case 'declined':
        return <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> לא זמין / נדחה</span>;
      case 'completed':
        return <span className="badge badge-primary">הושלם</span>;
      default:
        return <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> ממתין לאישור ספק</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>שלום, {user.name} 👋</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>אזור ניהול האירועים והפניות לספקים שלך</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onOpenAIModal} className="btn btn-gold btn-sm">
            <Sparkles size={16} /> יועץ AI לתכנון אירוע
          </button>
          <button onClick={() => setShowAddEventModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> יצירת אירוע חדש
          </button>
        </div>
      </div>

      {/* Events List */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="var(--color-primary)" /> האירועים שלי ({events.length})
        </h2>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>טוען אירועים...</p>
        ) : events.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>עדיין לא פתחת אירוע במערכת.</p>
            <button onClick={() => setShowAddEventModal(true)} className="btn btn-primary btn-sm">צור את האירוע הראשון שלך</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {events.map(ev => (
              <div key={ev.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-primary">{ev.event_type}</span>
                  <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
                    {new Date(ev.event_date).toLocaleDateString('he-IL')}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{ev.title}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--color-primary)" />
                    <span>מיקום: {ev.location || 'לא צוין'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="var(--color-secondary)" />
                    <span>מוזמנים: {ev.guest_count || 0} אורחים</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={14} color="#f59e0b" />
                    <span>תקציב יעד: ₪{Number(ev.budget).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Requests Status */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>בקשות תיאום וספקים שנפנו ({bookings.length})</h2>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>טוען פניות לספקים...</p>
        ) : bookings.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>עדיין לא שלחת בקשות תיאום לספקים. עייני בקטלוג הספקים כדי להתחיל.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map(b => (
              <div key={b.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{b.business_name}</h3>
                    {getStatusBadge(b.status)}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    עבור אירוע: <b>{b.event_title}</b> | טלפון ספק: <b>{b.vendor_phone || '050-0000000'}</b>
                  </p>
                  {b.notes && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>הערות שלך: {b.notes}</p>}
                </div>

                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>מחיר מוסכם</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
                    ₪{Number(b.agreed_price || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="modal-overlay" onClick={() => setShowAddEventModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }} className="gradient-text">יצירת אירוע חדש</h2>
            
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">שם האירוע *</label>
                <input type="text" className="form-input" placeholder="למשל: חתונה של מיכל ויונתן" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">סוג אירוע *</label>
                  <select className="form-select" value={eventType} onChange={e => setEventType(e.target.value)}>
                    <option value="חתונה">חתונה</option>
                    <option value="בר / בת מצווה">בר / בת מצווה</option>
                    <option value="אירוע חברה">אירוע חברה</option>
                    <option value="יום הולדת / מסיבה">יום הולדת / מסיבה</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">תאריך האירוע *</label>
                  <input type="date" className="form-input" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">תקציב יעד (₪)</label>
                  <input type="number" className="form-input" value={budget} onChange={e => setBudget(e.target.value)} placeholder="80000" />
                </div>

                <div className="form-group">
                  <label className="form-label">כמות אורחים</label>
                  <input type="number" className="form-input" value={guestCount} onChange={e => setGuestCount(e.target.value)} placeholder="200" />
                </div>

                <div className="form-group">
                  <label className="form-label">מיקום מועדף</label>
                  <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">הערות ותכנונים ראשוניים</label>
                <textarea className="form-textarea" rows="3" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddEventModal(false)} className="btn btn-secondary">ביטול</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'יוצר אירוע...' : 'צור אירוע'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
