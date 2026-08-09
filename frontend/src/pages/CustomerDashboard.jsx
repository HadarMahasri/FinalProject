import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useSocket } from '../context/SocketContext';
import { 
  Calendar, Plus, Sparkles, Clock, CheckCircle2, XCircle, Tag, MapPin, Users, 
  Edit, Trash2, Filter, Layers, ChevronDown, DollarSign, PieChart, CheckSquare, Square, 
  MessageSquare, AlertCircle, ArrowUpRight, FileText
} from 'lucide-react';

export default function CustomerDashboard({ onOpenAIModal }) {
  const { user } = useAuth();
  const { 
    getCustomerEventsCached, 
    getCustomerBookingsCached, 
    addEventToCache, 
    updateEventInCache, 
    removeEventFromCache 
  } = useData();
  const { openChatWithUser } = useSocket();

  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab State: 'events' | 'bookings' | 'budget' | 'tasks'
  const [activeTab, setActiveTab] = useState('events');

  // Selected event filter state
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Tasks Checklist State
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

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

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        getCustomerEventsCached(force),
        getCustomerBookingsCached({ limit: 'all' }, force)
      ]);
      setEvents(eventsRes || []);

      if (bookingsRes && bookingsRes.bookings) {
        setBookings(bookingsRes.bookings);
      } else if (Array.isArray(bookingsRes)) {
        setBookings(bookingsRes);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEventTasks = async (eventId) => {
    if (!eventId) return;
    setLoadingTasks(true);
    try {
      const res = await api.getEventTasks(eventId);
      setTasks(res || []);
    } catch (err) {
      console.error('Failed to load event tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // A primitive id (not the `events` array itself) as the dependency —
  // otherwise every create/update/delete on `events` produces a new array
  // reference and re-triggers a redundant GET /api/tasks/event/:id call
  // even when the actually-selected event hasn't changed.
  const activeEventId = selectedEventId || events[0]?.id || null;

  useEffect(() => {
    if (activeEventId) {
      loadEventTasks(activeEventId);
    }
  }, [activeEventId]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (eventDate < todayString) {
      alert('לא ניתן לבחור תאריך שכבר עבר. נא לבחור תאריך החל מהיום.');
      return;
    }

    setSubmitting(true);
    try {
      const newEventData = {
        title,
        event_type: eventType,
        event_date: eventDate,
        budget: Number(budget) || 0,
        location,
        guest_count: Number(guestCount) || 0,
        notes
      };

      const res = await api.createEvent(newEventData);
      alert('האירוע נוצר בהצלחה!');
      setShowAddEventModal(false);

      const createdEventObj = { id: res.id || Date.now(), ...newEventData };
      setEvents(prev => [createdEventObj, ...prev]);
      setSelectedEventId(createdEventObj.id);
      if (addEventToCache) addEventToCache(createdEventObj);

      // Reset form
      setTitle('');
      setEventDate('');
      setBudget('');
      setGuestCount('');
      setNotes('');
    } catch (err) {
      alert('שגיאה ביצירת האירוע: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (ev, e) => {
    e.stopPropagation();
    setEditingEvent(ev);
    setEditTitle(ev.title || '');
    setEditEventType(ev.event_type || 'חתונה');
    
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

    const updatedFields = {
      title: editTitle,
      event_type: editEventType,
      event_date: editEventDate,
      budget: Number(editBudget) || 0,
      location: editLocation,
      guest_count: Number(editGuestCount) || 0,
      notes: editNotes
    };

    setUpdatingEvent(true);
    try {
      await api.updateEvent(editingEvent.id, updatedFields);
      alert('פרטי האירוע עודכנו בהצלחה!');
      
      setEvents(prev => prev.map(ev => Number(ev.id) === Number(editingEvent.id) ? { ...ev, ...updatedFields } : ev));
      if (updateEventInCache) updateEventInCache(editingEvent.id, updatedFields);
      setEditingEvent(null);
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
      alert('האירוע נמחק בהצלחה!');
      setEvents(prev => prev.filter(ev => Number(ev.id) !== Number(eventId)));
      if (removeEventFromCache) removeEventFromCache(eventId);
      if (selectedEventId === eventId) setSelectedEventId(null);
    } catch (err) {
      alert('שגיאה במחיקת האירוע: ' + err.message);
    }
  };

  // Task Checklist Handlers
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!activeEventId || !newTaskTitle.trim() || addingTask) return;

    setAddingTask(true);
    try {
      const res = await api.createTask({
        event_id: activeEventId,
        title: newTaskTitle.trim(),
        category: 'general'
      });

      const createdTaskObj = {
        id: res.id || Date.now(),
        event_id: activeEventId,
        title: newTaskTitle.trim(),
        category: 'general',
        is_completed: false
      };
      setTasks(prev => [...prev, createdTaskObj]);
      setNewTaskTitle('');
    } catch (err) {
      alert('שגיאה בהוספת המשימה: ' + err.message);
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = !currentStatus;
    setTasks(prev => prev.map(t => Number(t.id) === Number(taskId) ? { ...t, is_completed: newStatus } : t));
    try {
      await api.toggleTask(taskId, newStatus);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => Number(t.id) !== Number(taskId)));
    try {
      await api.deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success"><CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> אושר ע"י הספק</span>;
      case 'declined':
        return <span className="badge badge-danger"><XCircle size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> נדחה</span>;
      default:
        return <span className="badge badge-warning"><Clock size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> ממתין לאישור ספק</span>;
    }
  };

  // Active Event & Budget Math
  const selectedEvent = events.find(e => Number(e.id) === Number(selectedEventId)) || events[0];
  const targetBudget = selectedEvent ? Number(selectedEvent.budget || 0) : 0;
  
  const activeBookings = selectedEventId
    ? bookings.filter(b => Number(b.event_id) === Number(selectedEventId))
    : bookings;

  const totalAgreedSpent = activeBookings.reduce((sum, b) => sum + Number(b.agreed_price || 0), 0);
  const remainingBudget = targetBudget > 0 ? targetBudget - totalAgreedSpent : 0;
  const budgetPercentage = targetBudget > 0 ? Math.min(100, Math.round((totalAgreedSpent / targetBudget) * 100)) : 0;

  // Task Stats
  const completedTasksCount = tasks.filter(t => t.is_completed).length;
  const tasksPercentage = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>טוען את נתוני הדשבורד שלך...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>אזור אישי - לקוח</span>
          <h1 style={{ fontSize: '2rem' }}>שלום, {user?.name || 'חוגג/ת'}! 👋</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>ניהול נוח ומפולח של האירועים, הפניות, התקציב והמשימות שלך</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowAddEventModal(true)} className="btn btn-primary">
            <Plus size={18} /> יצירת אירוע חדש
          </button>
          <button onClick={onOpenAIModal} className="btn btn-gold">
            <Sparkles size={18} /> עוזר AI לאירוע
          </button>
        </div>
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
          onClick={() => setActiveTab('events')} 
          style={{ 
            flex: 1, 
            minWidth: '140px',
            padding: '12px 16px', 
            borderRadius: '12px', 
            border: 'none',
            background: activeTab === 'events' ? 'linear-gradient(135deg, var(--color-primary), #4338ca)' : 'transparent',
            color: activeTab === 'events' ? '#fff' : 'var(--color-text-muted)',
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
          <Calendar size={18} /> האירועים שלי ({events.length})
        </button>

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
          <FileText size={18} /> פניות מספקים ({bookings.length})
        </button>

        <button 
          onClick={() => setActiveTab('budget')} 
          style={{ 
            flex: 1, 
            minWidth: '150px',
            padding: '12px 16px', 
            borderRadius: '12px', 
            border: 'none',
            background: activeTab === 'budget' ? 'linear-gradient(135deg, var(--color-primary), #4338ca)' : 'transparent',
            color: activeTab === 'budget' ? '#fff' : 'var(--color-text-muted)',
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
          <PieChart size={18} /> מחשבון תקציב
        </button>

        <button 
          onClick={() => setActiveTab('tasks')} 
          style={{ 
            flex: 1, 
            minWidth: '150px',
            padding: '12px 16px', 
            borderRadius: '12px', 
            border: 'none',
            background: activeTab === 'tasks' ? 'linear-gradient(135deg, var(--color-primary), #4338ca)' : 'transparent',
            color: activeTab === 'tasks' ? '#fff' : 'var(--color-text-muted)',
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
          <CheckSquare size={18} /> צ'ק-ליסט משימות ({tasks.length})
        </button>
      </div>

      {/* TAB 1: EVENTS */}
      {activeTab === 'events' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>האירועים המתוכננים שלי ({events.length})</h2>
            <button onClick={() => setShowAddEventModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> אירוע חדש
            </button>
          </div>

          {events.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>עדיין לא פתחת אירוע במערכת. צור את האירוע הראשון שלך כדי להתחיל לקבל הצעות מחיר!</p>
              <button onClick={() => setShowAddEventModal(true)} className="btn btn-primary">
                <Plus size={18} /> פתח אירוע ראשון
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {events.map(ev => {
                const isSelected = Number(selectedEventId) === Number(ev.id);
                return (
                  <div 
                    key={ev.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '24px', 
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--color-primary)' : undefined,
                      background: isSelected ? 'rgba(79, 70, 229, 0.12)' : undefined
                    }}
                    onClick={() => {
                      setSelectedEventId(ev.id);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>{ev.event_type}</span>
                        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{ev.title}</h3>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={(e) => openEditModal(ev, e)} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }} title="ערוך אירוע">
                          <Edit size={14} />
                        </button>
                        <button onClick={(e) => handleDeleteEvent(ev.id, e)} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px', color: 'var(--color-danger)' }} title="מחק אירוע">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                      <span>📅 תאריך: <b>{new Date(ev.event_date).toLocaleDateString('he-IL')}</b></span>
                      <span>📍 אזור: <b>{ev.location}</b></span>
                      <span>👥 כמות אורחים: <b>{ev.guest_count || 0}</b></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>תקציב יעד:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
                        ₪{Number(ev.budget || 0).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(ev.id);
                          setActiveTab('bookings');
                        }}
                        className="btn btn-secondary btn-sm" 
                        style={{ flex: 1, fontSize: '0.8rem' }}
                      >
                        צפה בפניות ({bookings.filter(b => Number(b.event_id) === Number(ev.id)).length})
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(ev.id);
                          setActiveTab('budget');
                        }}
                        className="btn btn-gold btn-sm" 
                        style={{ flex: 1, fontSize: '0.8rem' }}
                      >
                        תקציב
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKINGS / VENDOR ENQUIRIES */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
              פניות והצעות מחיר מספקים {selectedEventId ? `(${selectedEvent?.title})` : `(כל ${bookings.length} הפניות)`}
            </h2>

            {events.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedEventId && (
                  <button onClick={() => setSelectedEventId(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    הצג את כל הפניות ({bookings.length})
                  </button>
                )}
                <select 
                  className="form-select" 
                  style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
                  value={selectedEventId || ''}
                  onChange={e => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">כל האירועים שלי ({bookings.length} פניות)</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {activeBookings.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>עדיין לא נשלחו פניות לספקים עבור אירוע זה. היכנסי לקטלוג הספקים כדי לפנות לספק המבוקש!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeBookings.map(b => (
                <div key={b.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1.1rem' }}>{b.business_name}</h3>
                      {getStatusBadge(b.status)}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      עבור אירוע: <b>{b.event_title}</b> | טלפון ספק: <b>{b.vendor_phone || 'טרם עודכן'}</b>
                    </p>
                    {b.notes && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginTop: '4px' }}>הערות שלך: {b.notes}</p>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>מחיר מוסכם</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
                        ₪{Number(b.agreed_price || 0).toLocaleString()}
                      </span>
                    </div>

                    <button 
                      onClick={() => openChatWithUser(b.vendor_user_id || b.vendor_id)} 
                      className="btn btn-gold btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                    >
                      <MessageSquare size={16} /> צ'אט
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUDGET PLANNER & ANALYTICS */}
      {activeTab === 'budget' && (
        <div className="animate-fade-in">
          {events.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>פתח אירוע חדש כדי להתחיל לתכנן את התקציב שלך!</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChart size={22} color="#fbbf24" /> מחשבון תקציב ומעקב הוצאות
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                    מציג נתוני תקציב עבור האירוע: <b>{selectedEvent?.title}</b>
                  </p>
                </div>

                <select 
                  className="form-select" 
                  style={{ padding: '8px 14px', fontSize: '0.9rem', width: 'auto' }}
                  value={selectedEventId || ''}
                  onChange={e => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '20px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>תקציב יעד כולל</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>₪{targetBudget.toLocaleString()}</span>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '20px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>סך הצעות מחיר מוסכמות</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>₪{totalAgreedSpent.toLocaleString()}</span>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '20px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>תקציב נותר מתוך היעד</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: remainingBudget >= 0 ? '#34d399' : '#f87171' }}>
                    ₪{remainingBudget.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Budget Visual Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  <span>ניצול תקציב האירוע</span>
                  <b>{budgetPercentage}% ניצול ({totalAgreedSpent.toLocaleString()} ₪ מתוך {targetBudget.toLocaleString()} ₪)</b>
                </div>

                <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '7px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${budgetPercentage}%`, 
                      height: '100%', 
                      background: budgetPercentage > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                      transition: 'width 0.5s ease-in-out'
                    }} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TASK CHECKLIST */}
      {activeTab === 'tasks' && (
        <div className="animate-fade-in">
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={22} color="var(--color-primary)" /> צ'ק-ליסט ומשימות לאירוע
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  מציג משימות עבור האירוע: <b>{selectedEvent?.title}</b>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {tasks.length > 0 && (
                  <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                    {tasksPercentage}% הושלם ({completedTasksCount}/{tasks.length})
                  </span>
                )}
                <select 
                  className="form-select" 
                  style={{ padding: '8px 14px', fontSize: '0.9rem', width: 'auto' }}
                  value={selectedEventId || ''}
                  onChange={e => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task Progress Bar */}
            {tasks.length > 0 && (
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ width: `${tasksPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.4s ease' }} />
              </div>
            )}

            {/* New Task Input */}
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="הוסף משימה חדשה (למשל: סגירת טעימות, מדידות שמלה)..." 
                value={newTaskTitle} 
                onChange={e => setNewTaskTitle(e.target.value)} 
                required 
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.95rem' }}
              />
              <button type="submit" className="btn btn-primary" disabled={addingTask}>
                <Plus size={18} /> הוסף משימה
              </button>
            </form>

            {/* Task List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingTasks ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>טוען משימות...</p>
              ) : tasks.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>עדיין אין משימות צ'ק-ליסט לאירוע זה. הוסף משימה ראשונה למעלה!</p>
              ) : (
                tasks.map(t => (
                  <div 
                    key={t.id} 
                    style={{ 
                      padding: '14px 18px', 
                      borderRadius: '12px', 
                      background: t.is_completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div 
                      onClick={() => handleToggleTask(t.id, t.is_completed)} 
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                    >
                      {t.is_completed ? (
                        <CheckSquare size={22} color="#34d399" />
                      ) : (
                        <Square size={22} color="var(--color-text-muted)" />
                      )}
                      <span style={{ 
                        fontSize: '1rem', 
                        textDecoration: t.is_completed ? 'line-through' : 'none',
                        color: t.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-main)'
                      }}>
                        {t.title}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeleteTask(t.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '6px' }}
                      title="מחק משימה"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
                  <label className="form-label">סוג האירוע *</label>
                  <select className="form-select" value={eventType} onChange={e => setEventType(e.target.value)}>
                    <option value="חתונה">חתונה</option>
                    <option value="בר/בת מצווה">בר/בת מצווה</option>
                    <option value="ברית/בריתה">ברית/בריתה</option>
                    <option value="אירוע חברה">אירוע חברה</option>
                    <option value="מסיבה פרטית">מסיבה פרטית</option>
                    <option value="יום הולדת">יום הולדת</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">תאריך האירוע *</label>
                  <input type="date" className="form-input" min={todayString} value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">תקציב מתוכנן (₪)</label>
                  <input type="number" className="form-input" placeholder="למשל: 80000" min="0" value={budget} onChange={e => setBudget(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">כמות אורחים משוערת</label>
                  <input type="number" className="form-input" placeholder="למשל: 300" min="0" value={guestCount} onChange={e => setGuestCount(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">אזור בארץ</label>
                <select className="form-select" value={location} onChange={e => setLocation(e.target.value)}>
                  <option value="תל אביב והמרכז">תל אביב והמרכז</option>
                  <option value="ירושלים והסביבה">ירושלים והסביבה</option>
                  <option value="צפון והגליל">צפון והגליל</option>
                  <option value="שפלה ודרום">שפלה ודרום</option>
                  <option value="כל הארץ">כל הארץ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">הערות נוספות</label>
                <textarea className="form-textarea" rows="3" placeholder="פרטים שחשוב לך לציין..." value={notes} onChange={e => setNotes(e.target.value)} />
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
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }} className="gradient-text">עריכת פרטי אירוע</h2>
            
            <form onSubmit={handleUpdateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">שם האירוע *</label>
                <input type="text" className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">סוג האירוע *</label>
                  <select className="form-select" value={editEventType} onChange={e => setEditEventType(e.target.value)}>
                    <option value="חתונה">חתונה</option>
                    <option value="בר/בת מצווה">בר/בת מצווה</option>
                    <option value="ברית/בריתה">ברית/בריתה</option>
                    <option value="אירוע חברה">אירוע חברה</option>
                    <option value="מסיבה פרטית">מסיבה פרטית</option>
                    <option value="יום הולדת">יום הולדת</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">תאריך האירוע *</label>
                  <input type="date" className="form-input" min={todayString} value={editEventDate} onChange={e => setEditEventDate(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">תקציב מתוכנן (₪)</label>
                  <input type="number" className="form-input" min="0" value={editBudget} onChange={e => setEditBudget(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">כמות אורחים משוערת</label>
                  <input type="number" className="form-input" min="0" value={editGuestCount} onChange={e => setEditGuestCount(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">אזור בארץ</label>
                <select className="form-select" value={editLocation} onChange={e => setEditLocation(e.target.value)}>
                  <option value="תל אביב והמרכז">תל אביב והמרכז</option>
                  <option value="ירושלים והסביבה">ירושלים והסביבה</option>
                  <option value="צפון והגליל">צפון והגליל</option>
                  <option value="שפלה ודרום">שפלה ודרום</option>
                  <option value="כל הארץ">כל הארץ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">הערות נוספות</label>
                <textarea className="form-textarea" rows="3" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingEvent(null)} className="btn btn-secondary">ביטול</button>
                <button type="submit" className="btn btn-primary" disabled={updatingEvent}>
                  {updatingEvent ? 'מעדכן אירוע...' : 'עדכן אירוע'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
