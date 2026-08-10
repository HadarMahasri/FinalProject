import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'customer') navigate('/dashboard/customer');
      else if (loggedUser.role === 'vendor') navigate('/dashboard/vendor');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'אימייל או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(79, 70, 229, 0.08)', borderRadius: '14px', marginBottom: '12px' }}>
            <Sparkles size={28} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>התחברות למערכת EventHub</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>הזן את פרטי התחברות שלך כדי להמשיך</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">כתובת אימייל</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="example@mail.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">סיסמה</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            <LogIn size={18} />
            {loading ? 'מתחבר...' : 'התחבר למערכת'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          עדיין אין לך חשבון? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>הרשם עכשיו</Link>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-subtle)', textAlign: 'center' }}>
          מידע לבדיקה מהירה: אימייל: <b>michal@gmail.com</b> או <b>roey@studioshahar.co.il</b> (סיסמה: <b>password123</b>)
        </div>

      </div>
    </div>
  );
}
