'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeftRight, Plus, Check, X, MapPin, ArrowRight } from 'lucide-react';

const MOVEMENT_TYPES = ['TRANSFER', 'REPLACEMENT', 'CROSS_SITE', 'SUSPENSION', 'RECALL'];

export default function PersonnelMovementsPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [guards, setGuards] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    guardId: '', movementType: 'TRANSFER', fromSiteId: '', toSiteId: '',
    reason: '', effectiveDate: '', notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPersonnelMovements(undefined, filterStatus || undefined);
      setMovements(data);
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  useEffect(() => {
    Promise.all([api.getUsers('GUARD'), api.getSites()]).then(([g, s]) => {
      setGuards(g); setSites(s);
    }).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPersonnelMovement(form);
      setMsg('✅ Personnel movement recorded');
      setShowCreate(false);
      setForm({ guardId: '', movementType: 'TRANSFER', fromSiteId: '', toSiteId: '', reason: '', effectiveDate: '', notes: '' });
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await api.approvePersonnelMovement(id, approved);
      setMsg(approved ? '✅ Movement approved' : '✅ Movement rejected');
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.completePersonnelMovement(id);
      setMsg('✅ Movement completed — guard site updated');
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const statusBadge = (s: string) => {
    if (s === 'APPROVED') return 'badge-info';
    if (s === 'REJECTED') return 'badge-danger';
    if (s === 'COMPLETED') return 'badge-success';
    return 'badge-warning';
  };

  const typeColor = (t: string) => {
    if (t === 'TRANSFER') return 'badge-info';
    if (t === 'REPLACEMENT') return 'badge-accent';
    if (t === 'SUSPENSION') return 'badge-danger';
    if (t === 'RECALL') return 'badge-warning';
    return 'badge-neutral';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeftRight size={22} /> Personnel Movements
        </h1>
        <div className="page-header-actions" style={{ flexWrap: 'wrap' }}>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '130px' }}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Record Movement
          </button>
        </div>
      </div>

      {msg && <div className={`message ${msg.startsWith('✅') ? 'message-success' : 'message-error'}`} onClick={() => setMsg('')}>{msg}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
      ) : movements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ArrowLeftRight size={40} opacity={0.3} /></div>
          <div className="empty-state-text">No personnel movements recorded</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Guard</th>
                <th>Type</th>
                <th>From → To</th>
                <th>Reason</th>
                <th>Effective Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m: any) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.guard?.name || '—'}<br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.guard?.staffId || ''}</span></td>
                  <td><span className={`badge ${typeColor(m.movementType)}`}>{m.movementType}</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <MapPin size={12} />{m.fromSite?.name || '—'}
                      <ArrowRight size={12} />
                      <MapPin size={12} />{m.toSite?.name || '—'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.reason}</td>
                  <td>{new Date(m.effectiveDate).toLocaleDateString()}</td>
                  <td><span className={`badge ${statusBadge(m.status)}`}>{m.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {m.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'CEO' || user?.role === 'HR' || user?.role === 'OPS_MANAGER') && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(m.id, true)} title="Approve"><Check size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleApprove(m.id, false)} title="Reject"><X size={13} /></button>
                        </>
                      )}
                      {m.status === 'APPROVED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleComplete(m.id)}>Complete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ArrowLeftRight size={18} /> Record Movement</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Guard</label>
                <select className="input" value={form.guardId} onChange={e => setForm(f => ({ ...f, guardId: e.target.value }))} required>
                  <option value="">Select guard...</option>
                  {guards.map((g: any) => <option key={g.id} value={g.id}>{g.name} ({g.staffId || g.email})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Movement Type</label>
                  <select className="input" value={form.movementType} onChange={e => setForm(f => ({ ...f, movementType: e.target.value }))}>
                    {MOVEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Effective Date</label>
                  <input className="input" type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">From Site</label>
                  <select className="input" value={form.fromSiteId} onChange={e => setForm(f => ({ ...f, fromSiteId: e.target.value }))}>
                    <option value="">Select site...</option>
                    {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">To Site</label>
                  <select className="input" value={form.toSiteId} onChange={e => setForm(f => ({ ...f, toSiteId: e.target.value }))}>
                    <option value="">Select site...</option>
                    {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Reason</label>
                <textarea className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required rows={2} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
