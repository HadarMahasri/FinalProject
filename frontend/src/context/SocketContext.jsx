import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const SocketContext = createContext();

// Context מרכזי לניהול חיבור ה-WebSocket בזמן אמת והתראות צ'אט
export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  // שליפת מספר ההודעות שלא נקראו מהשרת
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [token]);

  useEffect(() => {
    // 1. אם אין משתמש/טוקן מחובר - מנתקים את חיבור ה-Socket
    if (!token || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setUnreadCount(0);
      return;
    }

    // 2. פתיחת חיבור WebSocket טהור מול השרת עם אימות טוקן JWT
    const socketUrl = window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket'], // שימוש ב-WebSockets בלבד ללא HTTP Polling
      auth: { token } // העברת ה-JWT לאימות בשרת
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected and authenticated');
    });

    // 3. האזנה להודעות נכנסות בזמן אמת (Server Push)
    socket.on('new_message', (msg) => {
      console.log('✉️ Live message received via WebSockets:', msg);
      
      // א. עדכון מונה ההודעות שלא נקראו
      setUnreadCount(prev => prev + 1);
      // ב. הקפצת התראת Toast קופצת בפינת המסך
      setToastNotification({
        title: `הודעה חדשה מאת ${msg.sender_name || 'משתמש'}`,
        content: msg.content,
        senderId: msg.sender_id
      });

      // הסתרת ההתראה הקופצת כעבור 4 שניות
      setTimeout(() => setToastNotification(null), 4000);
    });

    fetchUnreadCount();

    // ניקוי החיבור בעת יציאה/התנתקות
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]);

  // פתיחת חלונית הצ'אט מול משתמש ספציפי
  const openChatWithUser = (otherUserId) => {
    setActiveChatUserId(otherUserId);
    setIsChatOpen(true);
    setUnreadCount(0);
  };

  // סגירת חלונית הצ'אט
  const closeChat = () => {
    setIsChatOpen(false);
    setActiveChatUserId(null);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      unreadCount,
      fetchUnreadCount,
      activeChatUserId,
      setActiveChatUserId,
      isChatOpen,
      openChatWithUser,
      closeChat,
      toastNotification,
      setToastNotification
    }}>
      {children}

      {/* התראת Toast קופצת בלייב בפינת המסך בעת קבלת הודעה */}
      {toastNotification && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#fff',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--color-primary)',
            cursor: 'pointer',
            maxWidth: '320px'
          }}
          onClick={() => {
            openChatWithUser(toastNotification.senderId);
            setToastNotification(null);
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fbbf24', marginBottom: '4px' }}>
            💬 {toastNotification.title}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {toastNotification.content}
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
