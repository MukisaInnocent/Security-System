'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ShieldCheck, AlertTriangle, Loader2, MapPin, User, CheckCircle2, XCircle, Fingerprint, ClipboardList, Search, CalendarClock, BadgeDollarSign } from 'lucide-react';

const chargeCategories = ['ABSENT', 'MISBEHAVIOR', 'UNIFORM', 'MISSING_EQUIPMENT'];
const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function SpotCheckPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [activeGuards, setActiveGuards] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<any>(null);
  const [chargeForm, setChargeForm] = useState({ chargeCategory: 'ABSENT', severityLevel: 'HIGH', chargeDescription: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [manualPin, setManualPin] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [scannerState, setScannerState] = useState({ connected: false, status: 'Idle', deviceName: '', logs: [] as string[] });
  const [scannerLoading, setScannerLoading] = useState(false);

  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);

  useEffect(() => {
    api.getSites().then(setSites).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadActiveGuards();
      loadAttendance();
      loadCharges();
    }
  }, [selectedSiteId]);

  useEffect(() => () => {
    disconnectScanner();
  }, []);

  const loadActiveGuards = async () => {
    setLoading(true);
    try {
      const data = await api.getActiveGuardsForSpotCheck(selectedSiteId);
      setActiveGuards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const data = await api.getAttendance({ siteId: selectedSiteId, type: 'CHECK_IN' });
      setAttendanceRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadCharges = async () => {
    try {
      const data = await api.getAllCharges(undefined, 'OPEN');
      setCharges(data);
    } catch (err) {
      console.error(err);
    }
  };

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
    setScannerState({ connected: false, status: 'Idle', deviceName: '', logs: [] });
  };

  const connectScanner = async () => {
    if (!('serial' in navigator)) {
      showMsg('error', 'Fingerprint reader support is not available in this browser. Use manual verification instead.');
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
      const portInfo = port.getInfo?.() || 'Serial reader';
      setScannerState({
        connected: true,
        status: 'Connected — waiting for fingerprint scan',
        deviceName: portInfo?.name || 'Fingerprint Reader',
        logs: ['Fingerprint reader connected.'],
      });

      const decoder = new TextDecoder();
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            if (chunk.trim()) {
              setScannerState(prev => ({
                ...prev,
                status: 'Scan received',
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
      showMsg('error', err.message || 'Unable to connect fingerprint reader.');
      setScannerState({ connected: false, status: 'Connection failed', deviceName: '', logs: ['Connection failed.'] });
    } finally {
      setScannerLoading(false);
    }
  };

  const handleVerify = async (deployment: any, status: 'PRESENT' | 'ABSENT' | 'NOT_AT_POST') => {
    setChecking(deployment.id);
    try {
      await api.recordSpotCheck({
        deploymentId: deployment.id,
        status,
        biometricPin: manualPin || undefined,
        resultNotes: manualNotes || `Spot check performed manually. Result: ${status}`,
        gpsLat: null,
        gpsLng: null,
      });
      showMsg('success', `${deployment.guard.name} marked ${status.replace('_', ' ')}`);
      loadActiveGuards();
      loadAttendance();
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setChecking(null);
    }
  };

  const openChargeModal = (guard: any) => {
    setSelectedGuard(guard);
    setChargeForm({ chargeCategory: 'ABSENT', severityLevel: 'HIGH', chargeDescription: '' });
    setShowChargeModal(true);
  };

  const handleRaiseCharge = async () => {
    if (!selectedGuard || !chargeForm.chargeDescription.trim()) return;
    try {
      await api.raiseCharge({
        guardId: selectedGuard.id,
        chargeCategory: chargeForm.chargeCategory,
        severityLevel: chargeForm.severityLevel,
        chargeDescription: chargeForm.chargeDescription,
      });
      setShowChargeModal(false);
      setChargeForm({ chargeCategory: 'ABSENT', severityLevel: 'HIGH', chargeDescription: '' });
      showMsg('success', `Charge raised against ${selectedGuard.name}`);
      loadCharges();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const attendanceCount = attendanceRecords.filter((item: any) => item.type === 'CHECK_IN').length;
  const activeCount = activeGuards.length;
  const openCharges = charges.length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={28} className="text-accent" />
            Spot Check Management
          </h1>
          <p className="text-muted">Biometric verification, disciplinary charges, and attendance review in one workflow.</p>
        </div>
        <div className="badge badge-info">Live Checkpoint</div>
      </div>

      {message && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Active Guards</div>
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Attendance Logs</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{attendanceCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Charges</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{openCharges}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="label">Select Site to Check</label>
            <select className="input" value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)}>
              <option value="">-- Choose a Site --</option>
              {sites.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </div>
          <button className="btn btn-outline" onClick={() => { loadActiveGuards(); loadAttendance(); loadCharges(); }} disabled={!selectedSiteId || loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Refresh List'}
          </button>
        </div>

        <div className="grid-2" style={{ gap: '1rem' }}>
          <div className="card" style={{ marginBottom: 0, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Fingerprint size={16} color="var(--accent-light)" />
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Fingerprint Reader</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button className="btn btn-primary btn-sm" onClick={connectScanner} disabled={scannerLoading || scannerState.connected}>
                {scannerLoading ? <Loader2 size={14} className="animate-spin" /> : <Fingerprint size={14} />} Connect Reader
              </button>
              <button className="btn btn-outline btn-sm" onClick={disconnectScanner} disabled={!scannerState.connected}>Disconnect</button>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: <span style={{ color: scannerState.connected ? 'var(--success)' : 'var(--warning)' }}>{scannerState.status}</span></div>
            {scannerState.deviceName && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Device: {scannerState.deviceName}</div>}
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {scannerState.logs.length === 0 ? 'No scan data yet.' : scannerState.logs.map((line, idx) => <div key={idx}>{line}</div>)}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 0, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Search size={16} color="var(--accent-light)" />
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Manual Verification</h3>
            </div>
            <label className="label">Biometric PIN / Override</label>
            <input className="input" value={manualPin} onChange={(e) => setManualPin(e.target.value)} placeholder="Optional PIN" />
            <label className="label" style={{ marginTop: '0.75rem' }}>Result Notes</label>
            <textarea className="input" rows={4} value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder="Record any irregularities, observations, or verification notes" />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} /> Active Guard Checks
            </h2>
            <span className="badge badge-neutral">{activeGuards.length} guards</span>
          </div>

          {!selectedSiteId ? (
            <div className="empty-state card" style={{ padding: '3rem' }}>
              <div className="empty-state-icon"><MapPin size={40} opacity={0.2} /></div>
              <div className="empty-state-text">Select a site to view active deployments</div>
            </div>
          ) : loading ? (
            <div className="flex-center card" style={{ padding: '3rem' }}><Loader2 size={28} className="animate-spin text-muted" /></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Guard</th><th>Post</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {activeGuards.map((deployment: any) => (
                    <tr key={deployment.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{deployment.guard?.name}</div>
                        <div className="text-xs text-muted">{deployment.guard?.staffId}</div>
                      </td>
                      <td>{deployment.post?.name || 'Main Entrance'}</td>
                      <td>
                        <span className={`badge ${deployment.biometricVerified ? 'badge-success' : 'badge-warning'}`}>
                          {deployment.biometricVerified ? 'Biometric Verified' : 'Manual Review'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleVerify(deployment, 'PRESENT')} disabled={checking === deployment.id}>
                            <CheckCircle2 size={13} /> Present
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleVerify(deployment, 'NOT_AT_POST')} disabled={checking === deployment.id}>
                            <XCircle size={13} /> Away
                          </button>
                          <button className="btn btn-danger btn-sm" title="Raise charge" onClick={() => openChargeModal(deployment.guard)}>
                            <AlertTriangle size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeGuards.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-state" style={{ padding: '2rem' }}>No active guards found at this site</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ClipboardList size={16} /> Recent Attendance & Actions
            </h2>
            <span className="badge badge-neutral">{attendanceRecords.length} records</span>
          </div>

          {attendanceLoading ? (
            <div className="card flex-center" style={{ padding: '2rem' }}><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : (
            <div className="card" style={{ padding: '0.5rem' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Guard</th><th>Type</th><th>Time</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.slice(0, 10).map((record: any) => (
                      <tr key={record.id}>
                        <td style={{ fontWeight: 700 }}>{record.guard?.name}</td>
                        <td><span className={`badge ${record.type === 'CHECK_IN' ? 'badge-success' : 'badge-info'}`}>{record.type.replace('_', ' ')}</span></td>
                        <td>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <span className={`badge ${record.isWithinGeofence ? 'badge-success' : 'badge-danger'}`}>{record.isWithinGeofence ? 'In Fence' : 'Outside'}</span>
                        </td>
                      </tr>
                    ))}
                    {attendanceRecords.length === 0 && (
                      <tr><td colSpan={4} className="empty-state" style={{ padding: '2rem' }}>No attendance records found for this site</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertTriangle size={15} /> Open Disciplinary Charges</h3>
              <span className="badge badge-warning">{charges.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {charges.slice(0, 5).map((charge: any) => (
                <div key={charge.id} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{charge.guard?.name}</div>
                      <div className="text-xs text-muted">{charge.chargeCategory} • {charge.severityLevel}</div>
                    </div>
                    <span className="badge badge-warning">Open</span>
                  </div>
                  <div className="text-sm" style={{ marginTop: '0.35rem' }}>{charge.chargeDescription}</div>
                </div>
              ))}
              {charges.length === 0 && <div className="empty-state" style={{ padding: '1rem' }}>No open charges to review.</div>}
            </div>
          </div>
        </div>
      </div>

      {showChargeModal && (
        <div className="modal-backdrop" onClick={() => setShowChargeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={18} /> Raise Disciplinary Charge</h2>
            <p className="text-sm text-muted mb-4">You are raising a charge against <b>{selectedGuard?.name}</b>.</p>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Charge Category</label>
                <select className="input" value={chargeForm.chargeCategory} onChange={(e) => setChargeForm((current) => ({ ...current, chargeCategory: e.target.value }))}>
                  {chargeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Severity</label>
                <select className="input" value={chargeForm.severityLevel} onChange={(e) => setChargeForm((current) => ({ ...current, severityLevel: e.target.value }))}>
                  {severityLevels.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={5} value={chargeForm.chargeDescription} onChange={(e) => setChargeForm((current) => ({ ...current, chargeDescription: e.target.value }))} placeholder="Describe the incident or breach in detail." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleRaiseCharge}>Raise Formal Charge</button>
              <button className="btn btn-outline" onClick={() => setShowChargeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
