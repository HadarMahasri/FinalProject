import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// רכיב הגנת נתיבים ב-Frontend (Client-Side Route Guard)
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // 1. אם ה-State עדיין בטעינה ראשונית מ-localStorage - מציגים אינדיקטור טעינה
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 700 }}>טוען נתונים...</span>
      </div>
    );
  }

  // 2. אם המשתמש אינו מחובר - מעבירים אותו אוטומטית לעמוד ההתחברות (login)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. אם מוגדרות הרשאות תפקידים והמשתמש אינו בתפקיד המורשה (למשל ספק שמנסה להיכנס לאזור לקוח) - מעבירים לדף הבית
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 4. המשתמש מחובר ומורשה - מציגים את העמוד המבוקש (children)
  return children;
}
