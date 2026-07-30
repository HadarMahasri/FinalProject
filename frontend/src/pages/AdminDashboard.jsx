import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Check, Users, Store, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getPendingVendors(),
        api.getAllUsers()
      ]);
      setStats(statsRes);
      setPendingVendors(pendingRes);
      setUsers(usersRes);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveVendor = async (vendorId, approve) => {
    try {
      await api.approveVendor(vendorId, approve);
      alert(`פרופיל הספק ${approve ? 'אושר' : 'נדחה'} בהצלחה!`);
      loadAdminData();
    } catch (err) {
      alert('שגיאה בעדכון סטטוס הספק: ' + err.message);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={32} color="#f59e0b" />
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '2px' }} className="gradient-text-gold">דשבורד מנהל מערכת (Admin)</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>בקרה מלאה על המערכת, אישור ספקים ודוחות אנליטיקה</p>
          </div>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>סה"כ משתמשים</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.totalUsers}</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>סה"כ ספקים</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{stats.totalVendors}</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>ספקים ממתינים</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{stats.pendingVendors}</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>סה"כ אירועים שנפתחו</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{stats.totalEvents}</span>
          </div>

          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>סה"כ פניות והזמנות</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.totalBookings}</span>
          </div>

        </div>
      )}

      {/* Pending Vendors for Approval */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#f59e0b" /> בקשות אישור ספקים חדשים ({pendingVendors.length})
        </h2>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>טוען בקשות...</p>
        ) : pendingVendors.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>אין ספקים ממתינים לאישור כרגע. כל הספקים מאושרים!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {pendingVendors.map(v => (
              <div key={v.id} className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{v.business_name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  בעלים: <b>{v.owner_name}</b> | קטגוריה: <b>{v.category}</b>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', marginBottom: '14px' }}>{v.description}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleApproveVendor(v.id, false)} className="btn btn-secondary btn-sm" style={{ color: '#f87171' }}>דחה</button>
                  <button onClick={() => handleApproveVendor(v.id, true)} className="btn btn-primary btn-sm">
                    <Check size={14} /> אישור פרופיל
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--color-primary)" /> ניהול משתמשי המערכת ({users.length})
        </h2>

        <div className="glass-card" style={{ overflowX: 'auto', padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '12px' }}>מזהה</th>
                <th style={{ padding: '12px' }}>שם מלא</th>
                <th style={{ padding: '12px' }}>אימייל</th>
                <th style={{ padding: '12px' }}>תפקיד (Role)</th>
                <th style={{ padding: '12px' }}>טלפון</th>
                <th style={{ padding: '12px' }}>תאריך הרשמה</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px' }}>#{u.id}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-warning' : u.role === 'vendor' ? 'badge-gold' : 'badge-primary'}`}>
                      {u.role === 'admin' ? 'אדמין' : u.role === 'vendor' ? 'ספק' : 'לקוח'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{u.phone || '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-subtle)' }}>{new Date(u.created_at).toLocaleDateString('he-IL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
