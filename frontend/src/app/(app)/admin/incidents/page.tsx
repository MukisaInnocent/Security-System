'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, MapPin, User, Target, CheckCircle2, Check, LoaderCircle, AlertTriangle } from 'lucide-react';
import ContextualChat from '@/components/ContextualChat';

export default function IncidentsPage() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('id');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const filters: Record<string, string> = {};
    if (severityFilter) filters.severity = severityFilter;
    if (statusFilter) filters.status = statusFilter;
    api.getIncidents(filters).then(setIncidents).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [severityFilter, statusFilter]);

  useEffect(() => {
    if (deepLinkId && incidents.length > 0) {
      const inc = incidents.find(i => i.id === deepLinkId);
      if (inc) setSelectedIncident(inc);
    }
  }, [deepLinkId, incidents]);

  const handleResolve = async (id: string) => {
    if (!resolutionNote.trim()) { alert('Please enter a resolution note'); return; }
    setSaving(true);
    try {
      await api.resolveIncident(id, resolutionNote);
      setSelectedIncident(null);
      setResolutionNote('');
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const severityBadge = (severity: string) => {
    const map: Record<string, string> = { CRITICAL: 'badge-danger', HIGH: 'badge-warning', MEDIUM: 'badge-info', LOW: 'badge-neutral' };
    return map[severity] || 'badge-neutral';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { OPEN: 'badge-neutral', INVESTIGATING: 'badge-warning', RESOLVED: 'badge-success', CLOSED: 'badge-info' };
    return map[status] || 'badge-neutral';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertTriangle size={24} /> Incident Management
        </h1>
        <div className="page-header-actions">
          <select className="input" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ width: '120px' }}>
            <option value="">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '140px' }}>
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <LoaderCircle size={24} color="var(--accent-light)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {incidents.map(inc => (
            <div key={inc.id} className="card" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => setSelectedIncident(inc)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  <span className={`badge ${severityBadge(inc.severity)}`}>{inc.severity}</span>
                  <span className={`badge ${statusBadge(inc.status || 'OPEN')}`}>{inc.status || 'OPEN'}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(inc.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-primary)' }}>{inc.description}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={12} /> {inc.site?.name} • <User size={12} /> {inc.reportedBy?.name}
                {inc.assignedTo && <> • <Target size={12} /> {inc.assignedTo.name}</>}
              </div>
            </div>
          ))}
          {incidents.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><ShieldAlert size={32} opacity={0.5} /></div>
              <div className="empty-state-text">No incidents match your filters</div>
            </div>
          )}
        </div>
      )}

      {/* Incident detail modal */}
      {selectedIncident && (
        <div className="modal-backdrop" onClick={() => setSelectedIncident(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
              <AlertTriangle size={20} /> Incident Details
            </h2>

            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
              <span className={`badge ${severityBadge(selectedIncident.severity)}`}>{selectedIncident.severity}</span>
              <span className={`badge ${statusBadge(selectedIncident.status || 'OPEN')}`}>{selectedIncident.status || 'OPEN'}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div className="label">Description</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{selectedIncident.description}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div><div className="label">Site</div><div style={{ fontSize: '0.85rem' }}>{selectedIncident.site?.name}</div></div>
              <div><div className="label">Reporter</div><div style={{ fontSize: '0.85rem' }}>{selectedIncident.reportedBy?.name}</div></div>
              <div><div className="label">Date</div><div style={{ fontSize: '0.85rem' }}>{new Date(selectedIncident.createdAt).toLocaleString()}</div></div>
              <div><div className="label">Assigned To</div><div style={{ fontSize: '0.85rem' }}>{selectedIncident.assignedTo?.name || '—'}</div></div>
            </div>

            {selectedIncident.resolutionNote && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="label">Resolution</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>{selectedIncident.resolutionNote}</div>
              </div>
            )}

            {/* Resolve action */}
            {(selectedIncident.status === 'OPEN' || selectedIncident.status === 'INVESTIGATING') && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div className="label">Resolve Incident</div>
                <textarea className="input" rows={3} placeholder="Enter resolution notes..." value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)} style={{ marginBottom: '0.5rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-success" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={() => handleResolve(selectedIncident.id)} disabled={saving}>
                    {saving ? <LoaderCircle size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                    {saving ? 'Resolving...' : 'Resolve'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setSelectedIncident(null)}>Close</button>
                </div>
              </div>
            )}

            {(selectedIncident.status === 'RESOLVED' || selectedIncident.status === 'CLOSED') && (
              <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setSelectedIncident(null)}>Close</button>
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div className="label" style={{ marginBottom: '0.5rem' }}>Incident Discussion</div>
              <ContextualChat type="INCIDENT" contextId={selectedIncident.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
