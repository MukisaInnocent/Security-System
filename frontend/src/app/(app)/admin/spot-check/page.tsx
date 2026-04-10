'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Eye, ShieldCheck, AlertTriangle, Search, Loader2, MapPin, User, CheckCircle2, XCircle } from 'lucide-react';

export default function SpotCheckPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [activeGuards, setActiveGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<any>(null);
  const [chargeReason, setChargeReason] = useState('');

  useEffect(() => {
    api.getSites().then(setSites).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadActiveGuards();
    }
  }, [selectedSiteId]);

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

  const handleVerify = async (deployment: any, status: 'PRESENT' | 'ABSENT' | 'NOT_AT_POST') => {
    setChecking(deployment.id);
    try {
      await api.recordSpotCheck({
        deploymentId: deployment.id,
        status,
        notes: `Spot check performed manually. Result: ${status}`,
        locationVerified: status === 'PRESENT'
      });
      loadActiveGuards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setChecking(null);
    }
  };

  const openChargeModal = (guard: any) => {
    setSelectedGuard(guard);
    setShowChargeModal(true);
  };

  const handleRaiseCharge = async () => {
    if (!chargeReason) return;
    try {
      await api.raiseCharge({
        userId: selectedGuard.id,
        type: 'MISSING_AT_POST',
        severity: 'MAJOR',
        description: chargeReason
      });
      setShowChargeModal(false);
      setChargeReason('');
      alert('Charge raised and HR notified.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={28} className="text-accent" />
            Spot Check Management
          </h1>
          <p className="text-muted">Real-time presence verification of on-duty guards.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="label">Select Site to Check</label>
            <select 
              className="input" 
              value={selectedSiteId} 
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              <option value="">-- Choose a Site --</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn btn-outline" onClick={loadActiveGuards} disabled={!selectedSiteId || loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Refresh List'}
          </button>
        </div>
      </div>

      {!selectedSiteId ? (
        <div className="empty-state card" style={{ padding: '4rem' }}>
          <div className="empty-state-icon"><MapPin size={48} opacity={0.2} /></div>
          <div className="empty-state-text">Select a site to view active deployments</div>
        </div>
      ) : loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}><Loader2 size={32} className="animate-spin text-muted" /></div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {activeGuards.map((d: any) => (d.guard && (
            <div key={d.id} className="card hover-lift" style={{ borderLeft: d.isBiometricVerified ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} className="text-muted" />
                  </div>
                  <div>
                    <div className="fw-700">{d.guard.name}</div>
                    <div className="text-xs text-muted">Post: {d.post?.name || 'Main Entrance'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xs fw-600 text-accent">ID: {d.guard.staffId}</div>
                  <div className="text-xs text-muted">{new Date(d.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} On Duty</div>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Biometric Sign-in:</span>
                  <span className={d.biometricVerified ? 'text-success' : 'text-danger'}>{d.biometricVerified ? 'Verified' : 'Bypassed'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-success btn-sm" 
                  style={{ flex: 1 }}
                  onClick={() => handleVerify(d, 'PRESENT')}
                  disabled={checking === d.id}
                >
                  <CheckCircle2 size={14} /> At Post
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ flex: 1, borderColor: 'var(--warning)', color: 'var(--warning)' }}
                  onClick={() => handleVerify(d, 'NOT_AT_POST')}
                  disabled={checking === d.id}
                >
                  Away
                </button>
                <button 
                  className="btn btn-danger btn-sm" 
                  style={{ flex: 0.5 }}
                  title="Raise Disciplinary Charge"
                  onClick={() => openChargeModal(d.guard)}
                >
                  <AlertTriangle size={14} />
                </button>
              </div>
            </div>
          )))}
          {activeGuards.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
              <div className="empty-state-text">No active guards found at this site</div>
            </div>
          )}
        </div>
      )}

      {showChargeModal && (
        <div className="modal-backdrop" onClick={() => setShowChargeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Raise Disciplinary Charge</h2>
            <p className="text-sm text-muted mb-4">You are raising a MAJOR charge against <b>{selectedGuard?.name}</b>.</p>
            <textarea 
              className="input" 
              style={{ minHeight: '120px', width: '100%', marginBottom: '1rem' }}
              placeholder="Describe the incident or reason for the charge..."
              value={chargeReason}
              onChange={(e) => setChargeReason(e.target.value)}
            />
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
