import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, X, CheckCircle, Calculator, Lightbulb } from 'lucide-react';

export default function AIAssistantModal({ isOpen, onClose }) {
  const [eventType, setEventType] = useState('חתונה');
  const [budget, setBudget] = useState(80000);
  const [guestCount, setGuestCount] = useState(200);
  const [location, setLocation] = useState('מרכז');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.getAIPlan({ eventType, budget, guestCount, location });
      setAiResult(res);
    } catch (err) {
      alert('שגיאה ביצירת המלצת ה-AI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', borderRadius: '10px' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem' }} className="gradient-text-gold">יועץ AI חכם לתכנון אירוע</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>בניית תוכנית תקציב וחלוקת ספקים אופטימלית</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group">
            <label className="form-label">סוג האירוע</label>
            <select className="form-select" value={eventType} onChange={e => setEventType(e.target.value)}>
              <option value="חתונה">חתונה</option>
              <option value="בר / בת מצווה">בר / בת מצווה</option>
              <option value="אירוע חברה">אירוע חברה</option>
              <option value="יום הולדת / מסיבה">יום הולדת / מסיבה</option>
              <option value="רית'ם & אירוע פרטי">אירוע פרטי מיוחד</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">תקציב כולל (₪)</label>
            <input 
              type="number" 
              className="form-input" 
              value={budget} 
              onChange={e => setBudget(e.target.value)} 
              step="5000"
              min="10000"
            />
          </div>

          <div className="form-group">
            <label className="form-label">כמות מוזמנים</label>
            <input 
              type="number" 
              className="form-input" 
              value={guestCount} 
              onChange={e => setGuestCount(e.target.value)} 
              step="10"
              min="20"
            />
          </div>

          <div className="form-group">
            <label className="form-label">אזור בארץ</label>
            <select className="form-select" value={location} onChange={e => setLocation(e.target.value)}>
              <option value="מרכז">מרכז ותל אביב</option>
              <option value="שרון">שרון והשפלה</option>
              <option value="ירושלים">ירושלים והסביבה</option>
              <option value="צפון">חיפה והצפון</option>
              <option value="דרום">באר שבע והדרום</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-gold" 
            disabled={loading}
            style={{ gridColumn: 'span 2', width: '100%', marginTop: '8px' }}
          >
            {loading ? 'מנתח נתונים ומייצר תוכנית...' : '✨ הופק תוכנית תקציב עם AI'}
          </button>
        </form>

        {/* AI Output Results */}
        {aiResult && (
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--color-border-accent)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#fbbf24' }}>
              {aiResult.summary}
            </h3>

            {/* Budget Breakdown Table */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calculator size={16} /> חלוקת תקציב מומלצת לספקים
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {aiResult.recommendedBreakdown.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.9rem' }}>{item.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-primary">{item.percentage}</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>₪{item.recommendedAmount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips & Checklist */}
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={16} color="#fbbf24" /> טיפים לתכנון נכון
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {aiResult.adviceList.map((tip, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <CheckCircle size={14} color="var(--color-success)" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
