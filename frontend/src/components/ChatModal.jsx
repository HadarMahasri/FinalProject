import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Send, MessageSquare, User, Store, Check, CheckCheck } from 'lucide-react';

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
    <div className="modal-overlay" onClick={closeChat} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={e => e.stopPropagation()} 
        style={{
          width: '900px',
          maxWidth: '95vw',
          height: '600px',
          maxHeight: '90vh',
          padding: 0,
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          overflow: 'hidden',
          borderRadius: '16px'
        }}
      >
        {/* Left Sidebar: Conversations List */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>הודעות וצ'אט</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {loadingConversations ? (
              <p style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>טוען שיחות...</p>
            ) : conversations.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>עדיין אין שיחות פעילות.</p>
            ) : (
              conversations.map(c => {
                const isActive = Number(c.other_user_id) === Number(activeChatUserId);
                const displayName = c.other_user_role === 'vendor' && c.business_name ? c.business_name : c.other_user_name;
                return (
                  <div 
                    key={c.other_user_id}
                    onClick={() => setActiveChatUserId(c.other_user_id)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {displayName}
                      </span>
                      {c.unread_count > 0 && (
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.last_message || 'התחל שיחה...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Messages Chat Room */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-dark)' }}>
          
          {/* Chat Header */}
          <div style={{ padding: '16px 20px', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                {currentChatUser ? (currentChatUser.other_user_role === 'vendor' && currentChatUser.business_name ? currentChatUser.business_name : currentChatUser.other_user_name) : 'שיחה פרטית'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {currentChatUser?.other_user_role === 'vendor' ? 'ספק מורשה' : 'לקוח במערכת'}
              </span>
            </div>

            <button onClick={closeChat} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages List Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!activeChatUserId ? (
              <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--color-text-muted)' }}>
                <p>בחר שיחה מהרשימה בצד ימין כדי להתחיל להתכתב בלייב</p>
              </div>
            ) : loadingMessages ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>טוען הודעות...</p>
            ) : messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>אין הודעות קודמות בשיחה זו. שלח הודעה ראשונה!</p>
            ) : (
              messages.map(m => {
                const isMe = Number(m.sender_id) === Number(user?.id);
                return (
                  <div 
                    key={m.id} 
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      background: isMe ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : 'rgba(30, 41, 59, 0.9)',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {!isMe && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fbbf24', display: 'block', marginBottom: '4px' }}>
                        {m.sender_name}
                      </span>
                    )}
                    <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', display: 'block', textAlign: 'left', marginTop: '4px' }}>
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
            <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', background: 'rgba(15, 23, 42, 0.9)' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="כתוב הודעה בלייב..." 
                value={inputContent} 
                onChange={e => setInputContent(e.target.value)} 
                required 
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={sending}>
                <Send size={16} /> {sending ? 'שולח...' : 'שלח'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
