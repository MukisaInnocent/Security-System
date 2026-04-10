'use client';

import { api } from './api';
import { getUnsynced, markSynced, clearSynced } from './db';

let syncInProgress = false;

export async function syncOfflineData(): Promise<{ attendance: number; incidents: number }> {
  if (syncInProgress) return { attendance: 0, incidents: 0 };
  if (!navigator.onLine) return { attendance: 0, incidents: 0 };

  syncInProgress = true;
  let attendanceSynced = 0;
  let incidentsSynced = 0;

  try {
    // Sync attendance records
    const attendanceRecords = await getUnsynced('attendance');
    if (attendanceRecords.length > 0) {
      const records = attendanceRecords.map((r) => ({
        offlineId: r.id,
        ...r.data,
      }));

      try {
        const result = await api.syncAttendance(records);
        attendanceSynced = result.synced || 0;

        // Mark all as synced
        for (const record of attendanceRecords) {
          await markSynced(record.id);
        }
      } catch (err) {
        console.error('Failed to sync attendance:', err);
      }
    }

    // Sync incident records
    const incidentRecords = await getUnsynced('incident');
    if (incidentRecords.length > 0) {
      const records = incidentRecords.map((r) => ({
        offlineId: r.id,
        ...r.data,
      }));

      try {
        const result = await api.syncIncidents(records);
        incidentsSynced = result.synced || 0;

        for (const record of incidentRecords) {
          await markSynced(record.id);
        }
      } catch (err) {
        console.error('Failed to sync incidents:', err);
      }
    }

    // Clean up synced records
    await clearSynced();
  } finally {
    syncInProgress = false;
  }

  return { attendance: attendanceSynced, incidents: incidentsSynced };
}

export function setupOnlineSync() {
  if (typeof window === 'undefined') return;

  // Sync when coming back online
  window.addEventListener('online', async () => {
    console.log('📡 Back online — syncing offline data...');
    const result = await syncOfflineData();
    if (result.attendance > 0 || result.incidents > 0) {
      console.log(`✅ Synced: ${result.attendance} attendance, ${result.incidents} incidents`);
    }
  });

  // Register for background sync if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data?.type === 'SYNC_ATTENDANCE' || event.data?.type === 'SYNC_INCIDENTS') {
        await syncOfflineData();
      }
    });
  }

  // Periodic sync attempt (every 30 seconds when online)
  setInterval(async () => {
    if (navigator.onLine) {
      await syncOfflineData();
    }
  }, 30000);
}
