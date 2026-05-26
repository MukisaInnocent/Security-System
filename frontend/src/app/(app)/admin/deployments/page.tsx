'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CalendarDays, Plus, LoaderCircle, MessageSquare, X } from 'lucide-react';
import ContextualChat from '@/components/ContextualChat';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ guardId: '', siteId: '', shiftStart: '06:00', shiftEnd: '18:00', date: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const filters: Record<string, string> = {};
    if (statusFilter) filters.status = statusFilter;
    api.getDeployments(filters).then(setDeployments).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => {
    api.getUsers('GUARD').then(setGuards).catch(() => {});
    api.getSites().then(setSites).catch(() => {});
    setForm(f => ({ ...f, date: new Date().toISOString().split('T')[0] }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.createDeployment({ ...form, date: new Date(form.date).toISOString() });
      setShowModal(false);
      setForm({ guardId: '', siteId: '', shiftStart: '06:00', shiftEnd: '18:00', date: new Date().toISOString().split('T')[0], notes: '' });
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { SCHEDULED: 'badge-info', ACTIVE: 'badge-success', COMPLETED: 'badge-neutral', CANCELLED: 'badge-danger' };
    return map[status] || 'badge-neutral';
  };

  return (
    <>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarDays size={24} /> Deployment Management
          </h1>
          <div className="page-header-actions">
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '140px' }}>
              <option value="">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={14} /> Create Deployment
            </button>
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
                <tr><th>Guard</th><th>Site</th><th>Date</th><th>Shift</th><th>Status</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {(deployments || []).map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.guard?.name}</td>
                    <td>{d.site?.name}</td>
                    <td style={{ fontSize: '0.8rem' }}>{d.date ? new Date(d.date).toLocaleDateString() : '—'}</td>
                    <td><span className="badge badge-accent">{d.shiftStart} – {d.shiftEnd}</span></td>
                    <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                    <td>{d.notes || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDeployment(d)} title="Discussion">
                        <MessageSquare size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!deployments || deployments.length === 0) && (
                  <tr>
                    <td colSpan={6} className="empty-state" style={{ padding: '2rem' }}>
                      <CalendarDays size={32} opacity={0.5} style={{ marginBottom: '0.5rem', display: 'block', margin: '0 auto' }} />
                      No deployments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
              <CalendarDays size={20} /> Create Deployment
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="label">Guard</label>
                <select className="input" value={form.guardId} onChange={e => setForm({ ...form, guardId: e.target.value })}>
                  <option value="">Select guard</option>
                  {(guards || []).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Site</label>
                <select className="input" value={form.siteId} onChange={e => setForm({ ...form, siteId: e.target.value })}>
                  <option value="">Select site</option>
                  {(sites || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="label">Date</label><input className="input" type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><label className="label">Shift Start</label><input className="input" type="time" value={form.shiftStart} onChange={e => setForm({ ...form, shiftStart: e.target.value })} /></div>
                <div><label className="label">Shift End</label><input className="input" type="time" value={form.shiftEnd} onChange={e => setForm({ ...form, shiftEnd: e.target.value })} /></div>
              </div>
              <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }} onClick={handleSave} disabled={saving}>
                  {saving && <LoaderCircle size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'Creating...' : 'Create'}
                </button>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDeployment && (
        <div className="modal-backdrop" onClick={() => setSelectedDeployment(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem' }}>
                <CalendarDays size={18} /> Deployment Discussion
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDeployment(null)}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600 }}>{selectedDeployment.site?.name}</div>
              <div style={{ color: 'var(--text-muted)' }}>{selectedDeployment.guard?.name} • {selectedDeployment.date ? new Date(selectedDeployment.date).toLocaleDateString() : '—'}</div>
            </div>
            <ContextualChat type="DEPLOYMENT" contextId={selectedDeployment.id} />
          </div>
        </div>
      )}
    </>
  );
}
