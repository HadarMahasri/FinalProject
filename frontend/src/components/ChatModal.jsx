import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Send, MessageSquare, User, Store } from 'lucide-react';

export default function ChatModal() {
  const { user } = useAuth();
  const { isChatOpen, closeChat, activeChatUserId, setActiveChatUserId, socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await api.getConversationsList();
      setConversations(res || []);
      
      if (!activeChatUserId && res && res.length > 0) {
        setActiveChatUserId(res[0].other_user_id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (otherUserId) => {
    if (!otherUserId) return;
    setLoadingMessages(true);
    try {
      const res = await api.getConversation(otherUserId);
      setMessages(res || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      loadConversations();
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (isChatOpen && activeChatUserId) {
      loadConversationMessages(activeChatUserId);
    }
  }, [activeChatUserId, isChatOpen]);

  // Listen for live socket messages while chat window is open
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (Number(msg.sender_id) === Number(activeChatUserId) || Number(msg.receiver_id) === Number(activeChatUserId)) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      }
      
      const otherId = Number(msg.sender_id) === Number(user?.id) ? msg.receiver_id : msg.sender_id;
      setConversations(prev => prev.map(c => {
        if (Number(c.other_user_id) === Number(otherId)) {
          return {
            ...c,
            last_message: msg.content,
            last_message_time: msg.created_at || new Date().toISOString()
          };
        }
        return c;
      }));
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, activeChatUserId, user?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeChatUserId || sending) return;

    const textToSend = inputContent.trim();
    setInputContent('');
    setSending(true);

    try {
      const res = await api.sendMessage({
        receiver_id: Number(activeChatUserId),
        content: textToSend
      });

      if (res) {
        const sentMsg = {
          id: res.id || Date.now(),
          sender_id: user.id,
          receiver_id: Number(activeChatUserId),
          content: textToSend,
          sender_name: user.name,
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, sentMsg]);
        setTimeout(scrollToBottom, 100);

        setConversations(prev => prev.map(c => {
          if (Number(c.other_user_id) === Number(activeChatUserId)) {
            return {
              ...c,
              last_message: textToSend,
              last_message_time: new Date().toISOString()
            };
          }
          return c;
        }));
      }
    } catch (err) {
      alert('שגיאה בשליחת ההודעה: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!isChatOpen) return null;

  const currentChatUser = conversations.find(c => Number(c.other_user_id) === Number(activeChatUserId));

  return (
    <div className="modal-overlay" onClick={closeChat} style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={e => e.stopPropagation()} 
        style={{
          width: '920px',
          maxWidth: '95vw',
          height: '620px',
          maxHeight: '90vh',
          padding: 0,
          display: 'grid',
          gridTemplateColumns: '290px minmax(0, 1fr)',
          overflow: 'hidden',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Left Sidebar: Conversations List */}
        <div style={{ background: '#f8fafc', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>הודעות וצ'אט</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {loadingConversations ? (
              <p style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>טוען שיחות...</p>
            ) : conversations.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>עדיין אין שיחות פעילות.</p>
            ) : (
              conversations.map(c => {
                const isActive = Number(c.other_user_id) === Number(activeChatUserId);
                const displayName = c.other_user_role === 'vendor' && c.business_name ? c.business_name : c.other_user_name;
                return (
                  <div 
                    key={c.other_user_id}
                    onClick={() => setActiveChatUserId(c.other_user_id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      background: isActive ? '#ffffff' : '#f1f5f9',
                      border: isActive ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                      boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isActive ? 'var(--color-primary)' : '#0f172a' }}>
                        {displayName}
                      </span>
                      {c.unread_count > 0 && (
                        <span className="badge badge-gold" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.last_message || 'התחל שיחה...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Messages Chat Room */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, minHeight: 0, overflow: 'hidden', background: '#f8fafc' }}>
          
          {/* Chat Header */}
          <div style={{ padding: '16px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {currentChatUser ? (currentChatUser.other_user_role === 'vendor' && currentChatUser.business_name ? currentChatUser.business_name : currentChatUser.other_user_name) : 'שיחה פרטית'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                {currentChatUser?.other_user_role === 'vendor' ? <Store size={14} color="var(--color-primary)" /> : <User size={14} color="var(--color-primary)" />}
                {currentChatUser?.other_user_role === 'vendor' ? 'ספק מורשה ב-EventHub' : 'לקוח במערכת'}
              </span>
            </div>

            <button onClick={closeChat} className="btn btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '50%', background: '#f1f5f9', border: 'none', color: '#0f172a', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages List Area */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc' }}>
            {!activeChatUserId ? (
              <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>בחר שיחה מהרשימה בצד ימין כדי להתחיל להתכתב בלייב</p>
              </div>
            ) : loadingMessages ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>טוען הודעות...</p>
            ) : messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>אין הודעות קודמות בשיחה זו. שלח הודעה ראשונה!</p>
            ) : (
              messages.map(m => {
                const isMe = Number(m.sender_id) === Number(user?.id);
                return (
                  <div 
                    key={m.id} 
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      background: isMe ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : '#ffffff',
                      color: isMe ? '#ffffff' : '#0f172a',
                      padding: '12px 18px',
                      borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      boxShadow: isMe ? '0 4px 14px rgba(79, 70, 229, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      border: isMe ? 'none' : '1px solid #e2e8f0',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {!isMe && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309', display: 'block', marginBottom: '4px' }}>
                        {m.sender_name}
                      </span>
                    )}
                    <p style={{ fontSize: '0.92rem', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: 500 }}>{m.content}</p>
                    <span style={{ fontSize: '0.72rem', color: isMe ? 'rgba(255, 255, 255, 0.85)' : '#64748b', display: 'block', textAlign: 'left', marginTop: '6px', fontWeight: 600 }}>
                      {new Date(m.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Footer */}
          {activeChatUserId && (
            <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', background: '#ffffff', flexShrink: 0 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="כתוב הודעה בלייב..." 
                value={inputContent} 
                onChange={e => setInputContent(e.target.value)} 
                required 
                style={{ 
                  flex: 1,
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.95rem',
                  padding: '12px 16px',
                  borderRadius: '12px'
                }}
              />
              <button type="submit" className="btn btn-primary" disabled={sending} style={{ padding: '12px 24px', fontSize: '0.95rem', fontWeight: 700, borderRadius: '12px' }}>
                <Send size={18} /> {sending ? 'שולח...' : 'שלח'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
