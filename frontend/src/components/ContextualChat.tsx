'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Check, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isSocketConnected, sendMessageWs, onNewMessage, onTyping, emitTyping, markReadWs, onReadReceipt, joinConversation, leaveConversation, ChatMessage } from '@/lib/chat';

interface ContextualChatProps {
  type: 'INCIDENT' | 'DEPLOYMENT' | 'SITE';
  contextId: string;
}

export default function ContextualChat({ type, contextId }: ContextualChatProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingDict, setTypingDict] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const initChat = async () => {
      try {
        setLoading(true);
        // Get or create contextual conversation
        const conv = await api.getContextualChat(type, contextId);
        if (!active) return;
        
        setConversationId(conv.id);
        
        // Load history
        const msgs = await api.getChatMessages(conv.id, undefined, 20);
        setMessages(msgs);
        
        // Join room and mark read
        joinConversation(conv.id);
        markReadWs(conv.id);
      } catch (err) {
        console.error('Failed to init contextual chat', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initChat();

    return () => {
      active = false;
      if (conversationId) leaveConversation(conversationId);
    };
  }, [type, contextId, user]);

  // Real-time hooks
  useEffect(() => {
    if (!conversationId) return;

    const unsubMsg = onNewMessage((msg) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id || (msg.offlineId && m.offlineId === msg.offlineId))) return prev;
          return [...prev, msg];
        });
        if (msg.senderId !== user?.id) markReadWs(conversationId);
      }
    });

    const unsubTyping = onTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingDict((prev) => ({ ...prev, [data.userId]: data.isTyping }));
      }
    });

    const unsubRead = onReadReceipt((data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            data.messageIds.includes(m.id)
              ? { ...m, readReceipts: [...(m.readReceipts || []), { userId: data.userId, readAt: data.readAt }] }
              : m
          )
        );
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
    };
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || sending) return;
    
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      if (isSocketConnected()) {
        sendMessageWs({
          conversationId,
          content: text,
        });
      } else {
        await api.sendChatMessage(conversationId, { content: text });
      }
    } catch (e) {
      console.error('Send failed', e);
    } finally {
      setSending(false);
    }
  };

  const isTyping = Object.values(typingDict).some(Boolean);

  if (loading) {
    return <div style={{ padding: '1rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}/></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map((msg) => {
          const isSent = msg.senderId === user?.id;
          
          if (msg.messageType === 'SYSTEM') {
            return <div key={msg.id} className="chat-msg-system" style={{ fontSize: '0.7rem' }}>{msg.content}</div>;
          }

          return (
            <div key={msg.id} style={{ alignSelf: isSent ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {!isSent && (
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>
                  {msg.sender?.name}
                </div>
              )}
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  background: isSent ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
                  color: isSent ? 'white' : 'var(--text-primary)',
                  borderRadius: isSent ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  border: isSent ? 'none' : '1px solid var(--border)',
                  fontSize: '0.8rem',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
                <div style={{ fontSize: '0.55rem', opacity: 0.7, textAlign: 'right', marginTop: '0.2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2px' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isSent && (msg.readReceipts?.length ? <CheckCheck size={10} /> : <Check size={10} />)}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="typing-indicator" style={{ padding: '0.5rem', alignSelf: 'flex-start' }}>
            <div className="typing-dots"><span/><span/><span/></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="input"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (conversationId) emitTyping(conversationId, true);
          }}
          onBlur={() => conversationId && emitTyping(conversationId, false)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ padding: '0.4rem 0.75rem', borderRadius: '16px', fontSize: '0.8rem' }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          style={{
            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            opacity: !inputText.trim() ? 0.5 : 1
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
