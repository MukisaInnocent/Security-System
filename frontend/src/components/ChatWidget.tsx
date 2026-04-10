'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ChatWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      try {
        const { count } = await api.getChatUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        // Silently fail
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000); // Check every 15s fallback

    // Try to hook into real-time updates if possible
    // (In a full implementation, you'd listen to the chat socket here or via context)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'chat_unread_update') {
        fetchCount();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user]);

  // Don't show widget on the main chat page
  if (!user || pathname === '/chat') return null;

  return (
    <div className="chat-widget">
      <button
        className="chat-widget-btn"
        onClick={() => router.push('/chat')}
        title="Open Messages"
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="chat-widget-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
