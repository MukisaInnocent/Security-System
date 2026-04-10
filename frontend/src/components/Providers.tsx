'use client';

import { AuthProvider } from '@/lib/auth';
import { useEffect } from 'react';
import { setupOnlineSync } from '@/lib/sync';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('✅ Service Worker registered');

        // Register for background sync
        if ('sync' in reg) {
          (reg as any).sync.register('sync-attendance').catch(() => {});
          (reg as any).sync.register('sync-incidents').catch(() => {});
        }
      }).catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
    }

    // Setup online/offline sync
    setupOnlineSync();
  }, []);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
