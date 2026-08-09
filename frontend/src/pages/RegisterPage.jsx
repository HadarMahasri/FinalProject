import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Sparkles, AlertCircle, Building2, User } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState('customer'); // 'customer' or 'vendor'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Vendor specific state
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('photography');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('תל אביב והמרכז');
  const [startingPrice, setStartingPrice] = useState(3000);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Phone Validation: Must be exactly 10 digits if provided
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    if (phone && cleanPhone.length !== 10) {
      setError('מספר הטלפון אינו תקין. יש להזין מספר טלפון בן 10 ספרות (לדוגמה: 0501234567 או 050-1234567).');
      return;
    }

    // Vendor Starting Price Validation: Must be >= 0
    if (role === 'vendor') {
      if (startingPrice === '' || isNaN(Number(startingPrice)) || Number(startingPrice) < 0) {
        setError('מחיר פתיחה חייב להיות מספר תקין (0 או יותר).');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        phone: cleanPhone ? cleanPhone : phone,
        business_name: businessName,
        category,
        description,
        location,
        starting_price: Number(startingPrice)
      };

      const newUser = await register(payload);
      if (newUser.role === 'customer') navigate('/dashboard/customer');
      else if (newUser.role === 'vendor') navigate('/dashboard/vendor');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'הרשמה נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '580px', width: '100%', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(236, 72, 153, 0.2)', borderRadius: '14px', marginBottom: '12px' }}>
            <Sparkles size={28} color="var(--color-secondary)" />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>הרשמה למערכת EventHub</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>בחר את סוג החשבון והזן את פרטיך</p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button 
            type="button" 
            onClick={() => setRole('customer')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: role === 'customer' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: role === 'customer' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
              color: 'var(--color-text-main)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <User size={18} color="var(--color-primary)" />
            לקוח / מארגן אירוע
          </button>

          <button 
            type="button" 
            onClick={() => setRole('vendor')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: role === 'vendor' ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)',
              background: role === 'vendor' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.03)',
              color: 'var(--color-text-main)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Building2 size={18} color="var(--color-secondary)" />
            ספק שירות / עסק
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">שם מלא *</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">מספר טלפון (10 ספרות)</label>
              <input 
                type="tel" 
                className="form-input" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="0501234567" 
                maxLength="12"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">אימייל *</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">סיסמה *</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          {/* Vendor Specific Form Fields */}
          {role === 'vendor' && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-secondary)' }}>פרטי העסק והספק</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">שם העסק *</label>
                  <input type="text" className="form-input" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">קטגוריה *</label>
                  <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="photography">צילום אירועים</option>
                    <option value="dj_music">תקליטן & מוזיקה</option>
                    <option value="catering">קייטרינג & שף</option>
                    <option value="venue">אולמות & גנים</option>
                    <option value="design_flowers">עיצוב & פרחים</option>
                    <option value="other">שירות אחר</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">אזור פעילות</label>
                  <input type="text" className="form-input" value={location} onChange={e => setLocation(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">מחיר פתיחה (₪)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={startingPrice} 
                    onChange={e => setStartingPrice(e.target.value)} 
                    min="0" 
                    placeholder="הזן מחיר בש''ח (לדוגמה: 120)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">תיאור העסק</label>
                <textarea className="form-textarea" rows="3" value={description} onChange={e => setDescription(e.target.value)} placeholder="ספר על הניסיון שלך, השירותים המיוחדים והערך שאתה מעניק..." />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
            <UserPlus size={18} />
            {loading ? 'יוצר חשבון...' : 'סים הרשמה'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          כבר רשום? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>התחבר עכשיו</Link>
        </div>

      </div>
    </div>
  );
}
