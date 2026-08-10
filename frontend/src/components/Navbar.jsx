import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Sparkles, Calendar, User, LogOut, Menu, X, Shield, Store, MessageSquare } from 'lucide-react';

export default function Navbar({ onOpenAIModal }) {
  const { user, logout } = useAuth();
  const { unreadCount, openChatWithUser } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      position: 'sticky',
      top: '16px',
      margin: '0 auto 24px auto',
      maxWidth: '1200px',
      width: 'calc(100% - 40px)',
      zIndex: 900,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--color-border)',
      borderRadius: '24px',
      padding: '12px 24px',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="gradient-text">
              EventHub
            </span>
            <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--color-text-muted)', marginTop: '-4px' }}>
              חכם. יוקרתי. פשוט.
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>דף הבית</Link>
          <Link to="/vendors" style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>קטלוג ספקים</Link>
          
          {user?.role !== 'vendor' && (
            <button 
              onClick={onOpenAIModal}
              className="btn btn-gold btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} />
              יועץ AI לתכנון אירוע
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Live Chat Button */}
              <button 
                onClick={() => openChatWithUser(null)} 
                className="btn btn-secondary btn-sm"
                style={{ position: 'relative', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="צ'אט והודעות בלייב"
              >
                <MessageSquare size={16} color="var(--color-primary)" />
                <span>צ'אט</span>
                {unreadCount > 0 && (
                  <span className="badge badge-gold" style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {user.role === 'customer' && (
                <Link to="/dashboard/customer" className="btn btn-secondary btn-sm">
                  <Calendar size={16} /> האירועים שלי
                </Link>
              )}

              {user.role === 'vendor' && (
                <Link to="/dashboard/vendor" className="btn btn-secondary btn-sm">
                  <Store size={16} /> אזור ספק
                </Link>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: '20px' }}>
                <User size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
                <button 
                  onClick={handleLogout} 
                  title="התנתק"
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginRight: '6px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">התחברות</Link>
              <Link to="/register" className="btn btn-primary btn-sm">הרשמה</Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
