'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  RefreshCw, CheckCircle2, Circle, Clock, XCircle, 
  MapPin, Check, Minus, CalendarDays, AlertTriangle, ShieldAlert,
  LoaderCircle
} from 'lucide-react';

export default function SupervisorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSupervisorDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    api.getSupervisorDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
        <LoaderCircle size={20} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Loading supervisor view...</span>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Failed to load data</div>;

  const statusColors: Record<string, string> = {
    ON_DUTY: 'badge-success', OFF_DUTY: 'badge-neutral', PENDING: 'badge-warning', UNASSIGNED: 'badge-danger',
  };
  
  const StatusIcon = ({ status }: { status: string }) => {
    switch(status) {
      case 'ON_DUTY': return <CheckCircle2 size={12} />;
      case 'OFF_DUTY': return <Circle size={12} />;
      case 'PENDING': return <Clock size={12} />;
      case 'UNASSIGNED': return <XCircle size={12} />;
      default: return <Circle size={12} />;
    }
  };
  
  const statusLabels: Record<string, string> = {
    ON_DUTY: 'On Duty', OFF_DUTY: 'Off Duty', PENDING: 'Pending', UNASSIGNED: 'Unassigned',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Supervisor Command</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Field operations overview • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid-stats stagger-children" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Total Deployed</div>
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{data.summary.totalDeployed}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">On Duty Now</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{data.summary.onDuty}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Pending Check-in</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{data.summary.pending}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Anomalies</div>
          <div className="stat-value" style={{ color: data.summary.anomalyCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {data.summary.anomalyCount}
          </div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Active Incidents</div>
          <div className="stat-value" style={{ color: data.summary.activeIncidentCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {data.summary.activeIncidentCount}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Guard Status */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Guard Status</h2>
          <div className="table-container">
            <table>
              <thead><tr><th>Guard</th><th>Phone</th><th>Status</th></tr></thead>
              <tbody>
                {data.guardStatuses.map((g: any) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</td>
                    <td style={{ fontSize: '0.8rem' }}>{g.phone || '—'}</td>
                    <td>
                      <span className={`badge ${statusColors[g.status]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <StatusIcon status={g.status} /> {statusLabels[g.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today Deployments */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Today&apos;s Deployments</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.todayDeployments.map((dep: any) => {
              const checkedIn = dep.attendances.some((a: any) => a.type === 'CHECK_IN');
              const checkedOut = dep.attendances.some((a: any) => a.type === 'CHECK_OUT');
              return (
                <div key={dep.id} className="card-flat" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{dep.guard?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <MapPin size={12} /> {dep.site?.name} • {dep.shiftStart}–{dep.shiftEnd}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <span className={`badge ${checkedIn ? 'badge-success' : 'badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {checkedIn ? <><Check size={11} /> In</> : <><Minus size={11} /> In</>}
                      </span>
                      <span className={`badge ${checkedOut ? 'badge-info' : 'badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {checkedOut ? <><Check size={11} /> Out</> : <><Minus size={11} /> Out</>}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {data.todayDeployments.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><CalendarDays size={24} opacity={0.5} /></div>
                <div className="empty-state-text">No deployments today</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {data.anomalies.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={16} /> Geofence Anomalies
          </h2>
          <div className="table-container">
            <table>
              <thead><tr><th>Guard</th><th>Site</th><th>Type</th><th>Time</th></tr></thead>
              <tbody>
                {data.anomalies.map((a: any) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.guard?.name}</td>
                    <td>{a.site?.name}</td>
                    <td><span className="badge badge-danger">{a.type === 'CHECK_IN' ? 'Check-in' : 'Check-out'} outside fence</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(a.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Incidents */}
      {data.activeIncidents.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={16} color="var(--danger)" /> Active Incidents
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.activeIncidents.map((inc: any) => (
              <div key={inc.id} className="card-flat" style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <span className={`badge ${
                      inc.severity === 'CRITICAL' ? 'badge-danger' : inc.severity === 'HIGH' ? 'badge-warning' :
                      inc.severity === 'MEDIUM' ? 'badge-info' : 'badge-neutral'
                    }`}>{inc.severity}</span>
                    <span className={`badge ${inc.status === 'INVESTIGATING' ? 'badge-warning' : 'badge-neutral'}`}>{inc.status}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(inc.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>{inc.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={11} /> {inc.site?.name} • Reported by {inc.reportedBy?.name}
                  {inc.assignedTo && <> • Assigned to {inc.assignedTo.name}</>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
