'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  RefreshCw, CheckCircle2, Circle, Clock, XCircle,
  MapPin, Check, Minus, CalendarDays, AlertTriangle, ShieldAlert,
  LoaderCircle, Fingerprint, ArrowLeftRight, UserRound, FileText, Plus, CheckCheck
} from 'lucide-react';

const movementTypes = ['TRANSFER', 'REPLACEMENT', 'CROSS_SITE', 'RECALL'];

export default function SupervisorPage() {
  const [data, setData] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [movementForm, setMovementForm] = useState({
    guardId: '', movementType: 'TRANSFER', fromSiteId: '', toSiteId: '', reason: '', effectiveDate: '', notes: '',
  });
  const [movementSubmitting, setMovementSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scannerState, setScannerState] = useState({ connected: false, status: 'Idle', logs: [] as string[], deviceName: '' });
  const [scannerLoading, setScannerLoading] = useState(false);

  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [supervisorData, movementData, guardData, siteData] = await Promise.all([
      api.getSupervisorDashboard(),
      api.getPersonnelMovements(),
      api.getUsers('GUARD'),
      api.getSites(),
    ]);
    setData(supervisorData);
    setMovements(movementData);
    setGuards(guardData);
    setSites(siteData);
  };

  useEffect(() => {
    refresh().catch(console.error);
    return () => {
      disconnectScanner();
    };
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const disconnectScanner = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
      }
    } catch (err) {
      console.error(err);
    }
    try {
      if (portRef.current) {
        await portRef.current.close();
      }
    } catch (err) {
      console.error(err);
    }
    readerRef.current = null;
    portRef.current = null;
    setScannerState({ connected: false, status: 'Idle', logs: [], deviceName: '' });
  };

  const connectScanner = async () => {
    if (!('serial' in navigator)) {
      showMsg('error', 'Fingerprint reader support is not available in this browser.');
      return;
    }

    try {
      setScannerLoading(true);
      await disconnectScanner();
      const serialNav = navigator as Navigator & { serial?: any };
      const port = await serialNav.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const reader = port.readable.getReader();
      portRef.current = port;
      readerRef.current = reader;
      const portInfo = port.getInfo?.() || 'Serial Reader';
      setScannerState({
        connected: true,
        status: 'Connected — waiting for fingerprint scans',
        logs: ['Scanner connected'],
        deviceName: portInfo?.name || 'Fingerprint Reader',
      });

      const decoder = new TextDecoder();
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            if (chunk.trim()) {
              setScannerState((prev) => ({
                ...prev,
                status: 'Fingerprint data received',
                logs: [...prev.logs, chunk.trim()].slice(-8),
              }));
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          await disconnectScanner();
        }
      })();
    } catch (err: any) {
      showMsg('error', err.message || 'Unable to connect fingerprint scanner.');
      setScannerState({ connected: false, status: 'Connection failed', logs: ['Connection failed'], deviceName: '' });
    } finally {
      setScannerLoading(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.guardId || !movementForm.reason || !movementForm.effectiveDate) return;
    setMovementSubmitting(true);
    try {
      await api.createPersonnelMovement(movementForm);
      showMsg('success', 'Movement recorded and queued for approval');
      setMovementForm({ guardId: '', movementType: 'TRANSFER', fromSiteId: '', toSiteId: '', reason: '', effectiveDate: '', notes: '' });
      await refresh();
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setMovementSubmitting(false);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      await api.resolveIncident(incidentId, 'Resolved from supervisor command view');
      showMsg('success', 'Incident resolved');
      await refresh();
    } catch (err: any) {
      showMsg('error', err.message);
    }
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
    switch (status) {
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
        <button className="btn btn-primary btn-sm" onClick={() => refresh()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {message && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

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
          <div className="stat-value" style={{ color: data.summary.anomalyCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{data.summary.anomalyCount}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Active Incidents</div>
          <div className="stat-value" style={{ color: data.summary.activeIncidentCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{data.summary.activeIncidentCount}</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Fingerprint size={16} color="var(--accent-light)" />
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Fingerprint Scan Console</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button className="btn btn-primary btn-sm" onClick={connectScanner} disabled={scannerLoading || scannerState.connected}>
              {scannerLoading ? <LoaderCircle size={14} className="animate-spin" /> : <Fingerprint size={14} />} Connect Reader
            </button>
            <button className="btn btn-outline btn-sm" onClick={disconnectScanner} disabled={!scannerState.connected}>Disconnect</button>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: <span style={{ color: scannerState.connected ? 'var(--success)' : 'var(--warning)' }}>{scannerState.status}</span></div>
          {scannerState.deviceName && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Device: {scannerState.deviceName}</div>}
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {scannerState.logs.length === 0 ? 'No scan activity yet.' : scannerState.logs.map((line, idx) => <div key={idx}>{line}</div>)}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ArrowLeftRight size={16} color="var(--accent-light)" />
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Movement Request</h2>
          </div>
          <form onSubmit={handleRecordMovement} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label className="label">Guard</label>
              <select className="input" value={movementForm.guardId} onChange={(e) => setMovementForm((current) => ({ ...current, guardId: e.target.value }))} required>
                <option value="">Select guard</option>
                {guards.map((guard: any) => <option key={guard.id} value={guard.id}>{guard.name} ({guard.staffId || guard.email})</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Movement Type</label>
                <select className="input" value={movementForm.movementType} onChange={(e) => setMovementForm((current) => ({ ...current, movementType: e.target.value }))}>
                  {movementTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Effective Date</label>
                <input type="date" className="input" value={movementForm.effectiveDate} onChange={(e) => setMovementForm((current) => ({ ...current, effectiveDate: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">From Site</label>
                <select className="input" value={movementForm.fromSiteId} onChange={(e) => setMovementForm((current) => ({ ...current, fromSiteId: e.target.value }))}>
                  <option value="">Select site</option>
                  {sites.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">To Site</label>
                <select className="input" value={movementForm.toSiteId} onChange={(e) => setMovementForm((current) => ({ ...current, toSiteId: e.target.value }))}>
                  <option value="">Select site</option>
                  {sites.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Reason</label>
              <textarea className="input" rows={3} value={movementForm.reason} onChange={(e) => setMovementForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Why is the movement needed?" required />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={movementForm.notes} onChange={(e) => setMovementForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={movementSubmitting}>
              {movementSubmitting ? 'Recording...' : <><Plus size={14} /> Create Movement</>}
            </button>
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Guard Status</h2>
          </div>
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

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Today&apos;s Deployments</h2>
          </div>
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

      <div className="grid-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ArrowLeftRight size={16} /> Recent Movements</h2>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Guard</th><th>Type</th><th>Route</th><th>Status</th></tr></thead>
              <tbody>
                {movements.slice(0, 8).map((movement: any) => (
                  <tr key={movement.id}>
                    <td style={{ fontWeight: 700 }}>{movement.guard?.name}</td>
                    <td><span className="badge badge-info">{movement.movementType}</span></td>
                    <td>{movement.fromSite?.name || '—'} → {movement.toSite?.name || '—'}</td>
                    <td><span className={`badge ${movement.status === 'APPROVED' ? 'badge-success' : movement.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{movement.status}</span></td>
                  </tr>
                ))}
                {movements.length === 0 && <tr><td colSpan={4} className="empty-state" style={{ padding: '2rem' }}>No movement requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldAlert size={16} /> Incident Containment</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.activeIncidents.map((inc: any) => (
              <div key={inc.id} className="card-flat" style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <span className={`badge ${inc.severity === 'CRITICAL' ? 'badge-danger' : inc.severity === 'HIGH' ? 'badge-warning' : inc.severity === 'MEDIUM' ? 'badge-info' : 'badge-neutral'}`}>{inc.severity}</span>
                    <span className={`badge ${inc.status === 'INVESTIGATING' ? 'badge-warning' : 'badge-neutral'}`}>{inc.status}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(inc.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>{inc.description}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <MapPin size={11} /> {inc.site?.name} • Reported by {inc.reportedBy?.name}
                  {inc.assignedTo && <> • Assigned to {inc.assignedTo.name}</>}
                </div>
                <button className="btn btn-success btn-sm" onClick={() => handleResolveIncident(inc.id)}><CheckCheck size={13} /> Resolve</button>
              </div>
            ))}
            {data.activeIncidents.length === 0 && <div className="empty-state" style={{ padding: '2rem' }}>No active incidents in the field.</div>}
          </div>
        </div>
      </div>

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
    </div>
  );
}
