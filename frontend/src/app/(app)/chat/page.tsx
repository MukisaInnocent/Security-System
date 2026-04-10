'use client';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  connectChat, disconnectChat, joinConversation, leaveConversation,
  sendMessageWs, emitTyping, markReadWs, onNewMessage, onTyping,
  onReadReceipt, onConversationUpdated, isSocketConnected,
  ChatMessage, ChatConversation,
} from '@/lib/chat';
import { generateOfflineId, addChatToQueue, getUnsentChatMessages, markChatMessageSent } from '@/lib/db';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, Plus, Search, Users, ArrowLeft,
  Radio, MapPin, AlertTriangle, CalendarDays, Megaphone,
  Check, CheckCheck, Image, Hash, X, ChevronDown,
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  DIRECT: <MessageSquare size={16} />,
  GROUP: <Users size={16} />,
  SITE: <MapPin size={16} />,
  INCIDENT: <AlertTriangle size={16} />,
  DEPLOYMENT: <CalendarDays size={16} />,
  BROADCAST: <Megaphone size={16} />,
};

const TYPE_LABELS: Record<string, string> = {
  DIRECT: 'Direct', GROUP: 'Group', SITE: 'Site',
  INCIDENT: 'Incident', DEPLOYMENT: 'Deployment', BROADCAST: 'Broadcast',
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDate.getTime();
  if (diff === 0) return 'Today';
  if (diff === 86400000) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function getConvName(conv: ChatConversation, userId: string) {
  if (conv.name) return conv.name;
  if (conv.type === 'DIRECT' && conv.participantUsers) {
    const other = conv.participantUsers.find((u) => u.id !== userId);
    return other?.name || 'Direct Message';
  }
  return 'Conversation';
}

function getConvAvatar(conv: ChatConversation, userId: string) {
  if (conv.type === 'DIRECT' && conv.participantUsers) {
    const other = conv.participantUsers.find((u) => u.id !== userId);
    return other?.name?.charAt(0)?.toUpperCase() || '?';
  }
  return conv.name?.charAt(0)?.toUpperCase() || '#';
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastRoles, setBroadcastRoles] = useState<string[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevConvRef = useRef<string | null>(null);

  // ─── Socket connection ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const token = api.getToken();
    if (token) connectChat(token);

    return () => disconnectChat();
  }, [user]);

  // ─── Load conversations ─────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getChatConversations();
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  // ─── Real-time message handler ──────────────────────────────
  useEffect(() => {
    const unsubMsg = onNewMessage((msg) => {
      if (activeConv && msg.conversationId === activeConv.id) {
        setMessages((prev) => {
          // Dedupe by offlineId or id
          if (msg.offlineId && prev.some((m) => m.offlineId === msg.offlineId)) {
            return prev.map((m) => m.offlineId === msg.offlineId ? msg : m);
          }
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Auto mark as read
        if (msg.senderId !== user?.id) {
          markReadWs(msg.conversationId);
        }
      }
      // Update conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: { content: msg.content, senderId: msg.senderId, createdAt: msg.createdAt },
                lastMessageAt: msg.createdAt,
                unreadCount: msg.conversationId === activeConv?.id ? 0 : (c.unreadCount || 0) + 1,
              }
            : c
        ).sort((a, b) => {
          const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bT - aT;
        })
      );
    });

    const unsubTyping = onTyping((data) => {
      setTypingUsers((prev) => {
        const convTyping = prev[data.conversationId] || [];
        if (data.isTyping) {
          return { ...prev, [data.conversationId]: [...new Set([...convTyping, data.userId])] };
        } else {
          return { ...prev, [data.conversationId]: convTyping.filter((id) => id !== data.userId) };
        }
      });
    });

    const unsubRead = onReadReceipt((data) => {
      if (activeConv && data.conversationId === activeConv.id) {
        setMessages((prev) =>
          prev.map((m) =>
            data.messageIds.includes(m.id)
              ? { ...m, readReceipts: [...(m.readReceipts || []), { userId: data.userId, readAt: data.readAt }] }
              : m
          )
        );
      }
    });

    const unsubUpdate = onConversationUpdated(() => {
      loadConversations();
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubUpdate();
    };
  }, [activeConv, user, loadConversations]);

  // ─── Open conversation ──────────────────────────────────────
  const openConversation = async (conv: ChatConversation) => {
    if (prevConvRef.current) leaveConversation(prevConvRef.current);

    setActiveConv(conv);
    setMobileShowChat(true);
    prevConvRef.current = conv.id;
    joinConversation(conv.id);

    try {
      const msgs = await api.getChatMessages(conv.id);
      setMessages(msgs);
      await api.markChatRead(conv.id);
      markReadWs(conv.id);

      // Reset unread
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  // ─── Send message ──────────────────────────────────────────
  const handleSend = async () => {
    if (!inputText.trim() || !activeConv || sendingMsg) return;
    const text = inputText.trim();
    setInputText('');
    setSendingMsg(true);

    const offlineId = generateOfflineId();

    // Optimistic UI
    const optimistic: ChatMessage = {
      id: offlineId,
      conversationId: activeConv.id,
      senderId: user!.id,
      content: text,
      messageType: 'TEXT',
      isEdited: false,
      isDeleted: false,
      offlineId,
      createdAt: new Date().toISOString(),
      sender: { id: user!.id, name: user!.name, role: user!.role },
      readReceipts: [],
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      if (isSocketConnected()) {
        sendMessageWs({
          conversationId: activeConv.id,
          content: text,
          offlineId,
        });
      } else {
        // Queue offline
        await addChatToQueue({
          id: offlineId,
          conversationId: activeConv.id,
          content: text,
          messageType: 'TEXT',
          timestamp: new Date().toISOString(),
          sent: false,
        });
        // Try REST fallback
        await api.sendChatMessage(activeConv.id, { content: text, offlineId });
        await markChatMessageSent(offlineId);
      }
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSendingMsg(false);
    }

    emitTyping(activeConv.id, false);
    inputRef.current?.focus();
  };

  // ─── Typing indicator ──────────────────────────────────────
  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!activeConv) return;

    emitTyping(activeConv.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeConv) emitTyping(activeConv.id, false);
    }, 2000);
  };

  // ─── Scroll to bottom ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Sync offline messages ─────────────────────────────────
  useEffect(() => {
    if (!isSocketConnected()) return;
    getUnsentChatMessages().then((unsent) => {
      unsent.forEach(async (msg) => {
        try {
          await api.sendChatMessage(msg.conversationId, { content: msg.content, offlineId: msg.id });
          await markChatMessageSent(msg.id);
        } catch {}
      });
    });
  }, []);

  // ─── New direct chat ───────────────────────────────────────
  const startDirectChat = async (contactId: string) => {
    try {
      const conv = await api.createChatConversation({
        type: 'DIRECT',
        participantIds: [contactId],
      });
      setShowNewChat(false);
      await loadConversations();
      openConversation(conv);
    } catch (e: any) {
      alert(e.message || 'Failed to create conversation');
    }
  };

  // ─── Load contacts ────────────────────────────────────────
  useEffect(() => {
    if (showNewChat && user) {
      api.getChatContacts()
        .then((res) => {
          if (Array.isArray(res)) setContacts(res);
          else if (res && Array.isArray(res.data)) setContacts(res.data);
          else setContacts([]);
        })
        .catch(console.error);
    }
  }, [showNewChat, user]);

  // ─── Send broadcast ───────────────────────────────────────
  const handleBroadcast = async () => {
    if (!broadcastContent.trim()) return;
    try {
      await api.sendBroadcast({
        name: broadcastName || 'Broadcast',
        content: broadcastContent,
        targetRoles: broadcastRoles.length ? broadcastRoles : undefined,
      });
      setShowBroadcast(false);
      setBroadcastName('');
      setBroadcastContent('');
      setBroadcastRoles([]);
      loadConversations();
    } catch (e: any) {
      alert(e.message || 'Failed to send broadcast');
    }
  };

  // ─── Filtered conversations ────────────────────────────────
  const filteredConvs = conversations.filter((c) => {
    if (filter !== 'ALL' && c.type !== filter) return false;
    if (search) {
      const name = getConvName(c, user!.id).toLowerCase();
      return name.includes(search.toLowerCase());
    }
    return true;
  });

  // ─── Typing label ──────────────────────────────────────────
  const getTypingLabel = () => {
    if (!activeConv) return null;
    const typers = typingUsers[activeConv.id]?.filter((id) => id !== user?.id);
    if (!typers?.length) return null;

    const names = typers
      .map((id) => activeConv.participantUsers?.find((u) => u.id === id)?.name?.split(' ')[0] || 'Someone')
      .join(', ');
    return `${names} ${typers.length > 1 ? 'are' : 'is'} typing`;
  };

  const canBroadcast = user && ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR'].includes(user.role);

  // ─── Render messages with date separators ──────────────────
  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let lastDate = '';

    messages.forEach((msg, idx) => {
      const msgDate = getDateLabel(msg.createdAt);
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        items.push(
          <div key={`date-${idx}`} className="chat-date-separator">
            <span>{msgDate}</span>
          </div>
        );
      }

      if (msg.messageType === 'SYSTEM') {
        items.push(
          <div key={msg.id} className="chat-msg-system">{msg.content}</div>
        );
        return;
      }

      const isSent = msg.senderId === user?.id;
      const readCount = msg.readReceipts?.length || 0;
      const totalParticipants = (activeConv?.participants?.length || 2) - 1;

      items.push(
        <div key={msg.id} className={`chat-msg-row ${isSent ? 'sent' : 'received'}`}>
          <div className={`chat-msg-bubble ${isSent ? 'sent' : 'received'}`}>
            {!isSent && activeConv?.type !== 'DIRECT' && (
              <div className="chat-msg-sender">
                {msg.sender?.name || 'Unknown'} · {msg.sender?.role?.replace(/_/g, ' ')}
              </div>
            )}
            {msg.mediaUrl && (
              <div style={{ marginBottom: '0.5rem' }}>
                <img
                  src={msg.mediaUrl}
                  alt="attachment"
                  style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }}
                />
              </div>
            )}
            <div>{msg.content}</div>
            <div className="chat-msg-time">
              {formatMsgTime(msg.createdAt)}
              {isSent && (
                <span className={`read-receipt ${readCount >= totalParticipants ? 'read' : readCount > 0 ? 'delivered' : 'sent'}`}>
                  {readCount > 0 ? <CheckCheck size={12} /> : <Check size={12} />}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });

    return items;
  };

  if (!user) return null;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="chat-container" style={{ position: 'relative' }}>
        {/* ═══ Sidebar ═══ */}
        <div className={`chat-sidebar ${mobileShowChat ? 'hidden' : ''}`}>
          <div className="chat-sidebar-header">
            <h2><MessageSquare size={20} /> Messages</h2>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {canBroadcast && (
                <button
                  onClick={() => setShowBroadcast(true)}
                  className="btn btn-ghost btn-sm"
                  title="Broadcast"
                  style={{ padding: '0.4rem' }}
                >
                  <Megaphone size={16} />
                </button>
              )}
              <button
                onClick={() => setShowNewChat(true)}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <Plus size={14} /> New
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="chat-search">
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'DIRECT', 'GROUP', 'SITE', 'BROADCAST'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                >
                  {f === 'ALL' ? 'All' : TYPE_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="chat-conv-list">
            {loading ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div style={{ fontSize: '0.85rem' }}>No conversations</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start a new chat!</div>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <div
                  key={conv.id}
                  className={`chat-conv-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className={`chat-conv-avatar ${conv.type.toLowerCase()}`}>
                    {getConvAvatar(conv, user.id)}
                  </div>
                  <div className="chat-conv-info">
                    <div className="chat-conv-name">{getConvName(conv, user.id)}</div>
                    <div className="chat-conv-preview">
                      {conv.lastMessage ? (
                        <>
                          {conv.lastMessage.senderId === user.id ? 'You: ' : ''}
                          {conv.lastMessage.content}
                        </>
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>No messages yet</span>
                      )}
                    </div>
                  </div>
                  <div className="chat-conv-meta">
                    {conv.lastMessage && (
                      <span className="chat-conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                    )}
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="chat-conv-unread">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══ Main Chat Panel ═══ */}
        <div className={`chat-main ${!mobileShowChat && activeConv ? '' : mobileShowChat ? '' : ''} ${!activeConv && !mobileShowChat ? '' : ''}`}>
          {activeConv ? (
            <>
              {/* Header */}
              <div className="chat-main-header">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setMobileShowChat(false); }}
                  style={{ display: 'none', padding: '0.3rem' }}
                  id="chat-back-btn"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className={`chat-conv-avatar ${activeConv.type.toLowerCase()}`} style={{ width: '36px', height: '36px', minWidth: '36px', fontSize: '0.8rem' }}>
                  {getConvAvatar(activeConv, user.id)}
                </div>
                <div className="chat-header-info">
                  <div className="chat-header-name">{getConvName(activeConv, user.id)}</div>
                  <div className="chat-header-status">
                    <span className={`badge badge-${activeConv.type === 'BROADCAST' ? 'accent' : 'info'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                      {TYPE_LABELS[activeConv.type]}
                    </span>
                    {activeConv.participantUsers && (
                      <span>{activeConv.participantUsers.length} participants</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {renderMessages()}

                {/* Typing indicator */}
                {getTypingLabel() && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                    {getTypingLabel()}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className="chat-compose">
                <textarea
                  ref={inputRef}
                  className="chat-compose-input"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  disabled={!inputText.trim() || sendingMsg}
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <MessageSquare size={36} color="var(--accent)" />
              </div>
              <h3>Welcome to Messages</h3>
              <p>Select a conversation or start a new one to begin chatting with your team.</p>
              <button className="btn btn-primary" onClick={() => setShowNewChat(true)}>
                <Plus size={16} /> Start New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ New Chat Modal ═══ */}
      {showNewChat && (
        <div className="modal-backdrop" onClick={() => setShowNewChat(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> New Conversation
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewChat(false)}><X size={16} /></button>
            </div>

            <input
              className="input"
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {(contacts || [])
                .filter((c) => c?.name?.toLowerCase().includes(contactSearch?.toLowerCase() || ''))
                .map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => startDirectChat(contact.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                      fontWeight: 800, fontSize: '0.8rem',
                    }}>
                      {contact.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{contact.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{contact.role?.replace(/_/g, ' ')}</div>
                    </div>
                    <MessageSquare size={14} color="var(--text-muted)" />
                  </div>
                ))}
              {contacts.length === 0 && (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>No contacts available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Broadcast Modal ═══ */}
      {showBroadcast && (
        <div className="modal-backdrop" onClick={() => setShowBroadcast(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} /> Send Broadcast
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBroadcast(false)}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Broadcast Name</label>
              <input
                className="input"
                placeholder="e.g., Security Alert"
                value={broadcastName}
                onChange={(e) => setBroadcastName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Target Roles (leave empty for all)</label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {['GUARD', 'SUPERVISOR', 'ADMIN', 'CLIENT', 'HR', 'OPS_MANAGER'].map((role) => (
                  <button
                    key={role}
                    className={`btn btn-sm ${broadcastRoles.includes(role) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setBroadcastRoles((prev) =>
                      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
                    )}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                  >
                    {role.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Message</label>
              <textarea
                className="input"
                placeholder="Type your broadcast message..."
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                rows={4}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowBroadcast(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBroadcast} disabled={!broadcastContent.trim()}>
                <Send size={14} /> Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile responsive styling */}
      <style jsx>{`
        @media (max-width: 768px) {
          #chat-back-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
