import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Sparkles, Clock, CheckCircle2, XCircle, Tag, MapPin, Users, Edit, Trash2, Filter, Layers } from 'lucide-react';

export default function CustomerDashboard({ onOpenAIModal }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected event filter state
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Today's date string formatted as YYYY-MM-DD for min date constraint
  const todayString = new Date().toISOString().split('T')[0];

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

  // Edit Event Form Modal State
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEventType, setEditEventType] = useState('חתונה');
  const [editEventDate, setEditEventDate] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editLocation, setEditLocation] = useState('מרכז');
  const [editGuestCount, setEditGuestCount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updatingEvent, setUpdatingEvent] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        api.getCustomerEvents(),
        api.getCustomerBookings()
      ]);
      setEvents(eventsRes || []);
      setBookings(bookingsRes || []);
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
    
    if (eventDate < todayString) {
      alert('לא ניתן לבחור תאריך שכבר עבר. נא לבחור תאריך החל מהיום.');
      return;
    }

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

  const openEditModal = (ev, e) => {
    e.stopPropagation(); // prevent selecting card
    setEditingEvent(ev);
    setEditTitle(ev.title || '');
    setEditEventType(ev.event_type || 'חתונה');
    
    // Format date string safely for input type="date"
    let dStr = '';
    if (ev.event_date) {
      const d = new Date(ev.event_date);
      dStr = isNaN(d.getTime()) ? ev.event_date : d.toISOString().split('T')[0];
    }
    setEditEventDate(dStr);
    setEditBudget(ev.budget || '');
    setEditLocation(ev.location || 'מרכז');
    setEditGuestCount(ev.guest_count || '');
    setEditNotes(ev.notes || '');
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();

    if (editEventDate < todayString) {
      alert('לא ניתן לבחור תאריך שכבר עבר. נא לבחור תאריך החל מהיום.');
      return;
    }

    setUpdatingEvent(true);
    try {
      await api.updateEvent(editingEvent.id, {
        title: editTitle,
        event_type: editEventType,
        event_date: editEventDate,
        budget: Number(editBudget) || 0,
        location: editLocation,
        guest_count: Number(editGuestCount) || 0,
        notes: editNotes
      });
      alert('פרטי האירוע עודכנו בהצלחה!');
      setEditingEvent(null);
      loadData();
    } catch (err) {
      alert('שגיאה בעדכון האירוע: ' + err.message);
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm('האם את בטוחה שברצונך למחוק אירוע זה?')) return;
    try {
      await api.deleteEvent(eventId);
      alert('האירוע נמחק בהצלחה.');
      if (selectedEventId === eventId) setSelectedEventId(null);
      loadData();
    } catch (err) {
      alert('שגיאה במחיקת האירוע: ' + err.message);
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

  // Filter bookings if an event is selected
  const filteredBookings = selectedEventId 
    ? bookings.filter(b => Number(b.event_id) === Number(selectedEventId))
    : bookings;

  const selectedEventObj = events.find(e => Number(e.id) === Number(selectedEventId));

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>שלום, {user.name} 👋</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>אזור ניהול האירועים, עריכת תכנונים והפניות לספקים שלך</p>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--color-primary)" /> האירועים שלי ({events.length})
          </h2>
          {selectedEventId && (
            <button onClick={() => setSelectedEventId(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.85rem' }}>
              <Filter size={14} /> הצג פניות מכל האירועים
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>טוען אירועים...</p>
        ) : events.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>עדיין לא פתחת אירוע במערכת.</p>
            <button onClick={() => setShowAddEventModal(true)} className="btn btn-primary btn-sm">צור את האירוע הראשון שלך</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
            {events.map(ev => {
              const isSelected = Number(selectedEventId) === Number(ev.id);
              const eventBookingsCount = bookings.filter(b => Number(b.event_id) === Number(ev.id)).length;

              return (
                <div 
                  key={ev.id} 
                  className="glass-card" 
                  onClick={() => setSelectedEventId(isSelected ? null : ev.id)}
                  style={{ 
                    padding: '22px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 0 20px rgba(124, 58, 237, 0.4)' : 'none',
                    background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'rgba(30, 41, 59, 0.5)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-primary">{ev.event_type}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
                        {new Date(ev.event_date).toLocaleDateString('he-IL')}
                      </span>
                      <button 
                        onClick={(e) => openEditModal(ev, e)} 
                        title="עריכת פרטי אירוע"
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#a78bfa', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteEvent(ev.id, e)} 
                        title="מחיקת אירוע"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: isSelected ? '#a78bfa' : 'var(--color-text-main)' }}>
                    {ev.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--color-primary)" />
                      <span>מיקום: <b>{ev.location || 'לא צוין'}</b></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="var(--color-secondary)" />
                      <span>מוזמנים: <b>{ev.guest_count || 0} אורחים</b></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={14} color="#f59e0b" />
                      <span>תקציב יעד: <b>₪{Number(ev.budget).toLocaleString()}</b></span>
                    </div>
                  </div>

                  <div style={{ 
                    borderTop: '1px solid var(--color-border)', 
                    paddingTop: '10px', 
                    display: 'flex', 
                    justify: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '0.8rem',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-subtle)' 
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={14} /> {eventBookingsCount} פניות לספקים
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {isSelected ? '✓ אירוע נבחר (לחץ לביטול)' : 'לחצי להצגת פניות ←'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Requests Status */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>
            {selectedEventObj ? `פניות לספקים עבור: "${selectedEventObj.title}" (${filteredBookings.length})` : `כל בקשות התיאום והפניות לספקים (${filteredBookings.length})`}
          </h2>

          {selectedEventId && (
            <button onClick={() => setSelectedEventId(null)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.85rem' }}>
              הצג את כל הפניות
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>טוען פניות לספקים...</p>
        ) : filteredBookings.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {selectedEventId ? 'טרם נשלחו פניות לספקים עבור אירוע זה. עייני בקטלוג הספקים כדי לשלוח בקשת תיאום!' : 'עדיין לא שלחת בקשות תיאום לספקים.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredBookings.map(b => (
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

      {/* Create Event Modal */}
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
                  <input 
                    type="date" 
                    className="form-input" 
                    value={eventDate} 
                    min={todayString}
                    onChange={e => setEventDate(e.target.value)} 
                    required 
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>תאריכים החל מהיום בלבד</span>
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

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="modal-overlay" onClick={() => setEditingEvent(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }} className="gradient-text">עריכת פרטי אירוע - {editingEvent.title}</h2>
            
            <form onSubmit={handleUpdateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">שם האירוע *</label>
                <input type="text" className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">סוג אירוע *</label>
                  <select className="form-select" value={editEventType} onChange={e => setEditEventType(e.target.value)}>
                    <option value="חתונה">חתונה</option>
                    <option value="בר / בת מצווה">בר / בת מצווה</option>
                    <option value="אירוע חברה">אירוע חברה</option>
                    <option value="יום הולדת / מסיבה">יום הולדת / מסיבה</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">תאריך האירוע *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editEventDate} 
                    min={todayString}
                    onChange={e => setEditEventDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">תקציב יעד (₪)</label>
                  <input type="number" className="form-input" value={editBudget} onChange={e => setEditBudget(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">כמות אורחים</label>
                  <input type="number" className="form-input" value={editGuestCount} onChange={e => setEditGuestCount(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">מיקום מועדף</label>
                  <input type="text" className="form-input" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">הערות ותכנונים</label>
                <textarea className="form-textarea" rows="3" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingEvent(null)} className="btn btn-secondary">ביטול</button>
                <button type="submit" className="btn btn-primary" disabled={updatingEvent}>
                  {updatingEvent ? 'שומר שינויים...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
