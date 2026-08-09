import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

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
    if (!token || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setUnreadCount(0);
      return;
    }

    // Connect Socket.io client
    const socketUrl = window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected, joining user room:', user.id);
      socket.emit('join_user_room', user.id);
    });

    // Listen for live incoming messages
    socket.on('new_message', (msg) => {
      console.log('✉️ Live message received via WebSockets:', msg);
      
      setUnreadCount(prev => prev + 1);
      setToastNotification({
        title: `הודעה חדשה מאת ${msg.sender_name || 'משתמש'}`,
        content: msg.content,
        senderId: msg.sender_id
      });

      // Hide toast after 4 seconds
      setTimeout(() => setToastNotification(null), 4000);
    });

    fetchUnreadCount();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]);

  const openChatWithUser = (otherUserId) => {
    setActiveChatUserId(otherUserId);
    setIsChatOpen(true);
    setUnreadCount(0);
  };

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

      {/* Live Toast Notification Popup */}
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
