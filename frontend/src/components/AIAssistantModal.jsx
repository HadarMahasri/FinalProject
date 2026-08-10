import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, X, CheckCircle, Calculator, Lightbulb, Send, MessageSquare } from 'lucide-react';

export default function AIAssistantModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' | 'consult'

  // Budget Plan Form State
  const [eventType, setEventType] = useState('חתונה');
  const [budget, setBudget] = useState(80000);
  const [guestCount, setGuestCount] = useState(200);
  const [location, setLocation] = useState('מרכז');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom Consultation Chat State
  const [customPrompt, setCustomPrompt] = useState('');
  const [consultHistory, setConsultHistory] = useState([]);
  const [askingAI, setAskingAI] = useState(false);

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

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!customPrompt.trim() || askingAI) return;

    const userQuestion = customPrompt.trim();
    setCustomPrompt('');
    setConsultHistory(prev => [...prev, { role: 'user', text: userQuestion }]);
    setAskingAI(true);

    try {
      const res = await api.askAI(userQuestion);
      setConsultHistory(prev => [...prev, { role: 'ai', text: res.answer }]);
    } catch (err) {
      setConsultHistory(prev => [...prev, { role: 'ai', text: 'שגיאה במענה AI: ' + err.message }]);
    } finally {
      setAskingAI(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', borderRadius: '10px' }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }} className="gradient-text-gold">סוכן AI אישי לייעוץ ותכנון אירוע</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>מענה אנושי, מותאם אישית וחינמי לחלוטין</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <button 
            onClick={() => setActiveTab('plan')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'plan' ? 'var(--color-primary)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Calculator size={16} /> מחשבון תקציב AI
          </button>

          <button 
            onClick={() => setActiveTab('consult')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'consult' ? 'linear-gradient(135deg, #f59e0b, #ec4899)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <MessageSquare size={16} /> צ'אט ייעוץ חופשי ב-AI
          </button>
        </div>

        {/* TAB 1: BUDGET CALCULATOR */}
        {activeTab === 'plan' && (
          <div>
            <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">סוג האירוע</label>
                <select className="form-select" value={eventType} onChange={e => setEventType(e.target.value)}>
                  <option value="חתונה">חתונה</option>
                  <option value="בר / בת מצווה">בר / בת מצווה</option>
                  <option value="אירוע חברה">אירוע חברה</option>
                  <option value="יום הולדת / מסיבה">יום הולדת / מסיבה</option>
                  <option value="אירוע פרטי מיוחד">אירוע פרטי מיוחד</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">תקציב יעד (₪)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={budget} 
                  onChange={e => setBudget(e.target.value)}
                  step="1000"
                  min="5000"
                  required
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
                  required
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
                style={{ gridColumn: 'span 2', width: '100%', marginTop: '4px' }}
              >
                {loading ? 'סוכן AI מנתח נתונים...' : 'הפקת תוכנית תקציב עם AI'}
              </button>
            </form>

            {aiResult && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#fbbf24' }}>
                  {aiResult.summary}
                </h3>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calculator size={16} /> חלוקת תקציב מומלצת לספקים
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aiResult.recommendedBreakdown.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--color-border)', padding: '10px 14px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.9rem' }}>{item.category}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="badge badge-primary">{item.percentage}</span>
                          <span style={{ fontWeight: 700, color: '#fbbf24' }}>₪{item.recommendedAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={16} color="#fbbf24" /> טיפים מהסוכן AI
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0 }}>
                    {aiResult.adviceList.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <CheckCircle size={14} color="#34d399" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FREE AI CONSULTATION CHAT */}
        {activeTab === 'consult' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              💬 <b>שאלו את סוכן ה-AI כל שאלה:</b> למשל "איזה שיר מומלץ לחופה?", "איך לבחור צלם לחתונה?", "כמה טיפ מקובל לתת למלצרים?"
            </div>

            <div style={{ minHeight: '200px', maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px' }}>
              {consultHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: 'auto', fontSize: '0.9rem' }}>
                  אין עדיין שאלות. הזידו שאלה למטה וקבלו תשובה מיידית מסוכן ה-AI!
                </p>
              ) : (
                consultHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: item.role === 'user' ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : 'rgba(30, 41, 59, 0.9)',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: item.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {item.role === 'ai' && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', display: 'block', marginBottom: '4px' }}>
                        🤖 סוכן AI אישי:
                      </span>
                    )}
                    {item.text}
                  </div>
                ))
              )}
              {askingAI && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(30, 41, 59, 0.9)', color: '#fbbf24', padding: '10px 14px', borderRadius: '14px', fontSize: '0.85rem' }}>
                  🤖 סוכן ה-AI מקליד תשובה...
                </div>
              )}
            </div>

            <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="כתבו שאלה לסוכן ה-AI..." 
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-gold" disabled={askingAI} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Send size={16} /> {askingAI ? 'עונה...' : 'שאל/י'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
