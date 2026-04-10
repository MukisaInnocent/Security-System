'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClipboardCheck, TrendingUp, TrendingDown, CheckCircle2, XCircle, CloudOff, Wifi, LoaderCircle } from 'lucide-react';

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const filters: Record<string, string> = {};
    if (typeFilter) filters.type = typeFilter;
    api.getAttendance(filters).then(setRecords).catch(console.error).finally(() => setLoading(false));
  }, [typeFilter]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ClipboardCheck size={24} /> Attendance Records
        </h1>
        <div className="page-header-actions">
          <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: '140px' }}>
            <option value="">All Types</option>
            <option value="CHECK_IN">Check-ins</option>
            <option value="CHECK_OUT">Check-outs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <LoaderCircle size={24} color="var(--accent-light)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Guard</th><th>Site</th><th>Type</th><th>Timestamp</th><th>Geofence</th><th>Source</th></tr>
            </thead>
            <tbody>
              {records.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.guard?.name}</td>
                  <td>{a.site?.name}</td>
                  <td>
                    <span className={`badge ${a.type === 'CHECK_IN' ? 'badge-success' : 'badge-info'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      {a.type === 'CHECK_IN' ? <><TrendingUp size={12} /> Check In</> : <><TrendingDown size={12} /> Check Out</>}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <div>{new Date(a.timestamp).toLocaleDateString()}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(a.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <span className={`badge ${a.isWithinGeofence ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      {a.isWithinGeofence ? <><CheckCircle2 size={12} /> Within</> : <><XCircle size={12} /> Outside</>}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.syncedFromOffline ? 'badge-warning' : 'badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      {a.syncedFromOffline ? <><CloudOff size={12} /> Offline</> : <><Wifi size={12} /> Online</>}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state" style={{ padding: '2rem' }}>
                    <ClipboardCheck size={32} opacity={0.5} style={{ marginBottom: '0.5rem', display: 'block', margin: '0 auto' }} />
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
