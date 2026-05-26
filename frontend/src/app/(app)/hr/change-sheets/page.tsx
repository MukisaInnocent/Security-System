'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FilePenLine, Plus, Check, X, Filter } from 'lucide-react';

const CHANGE_TYPES = ['SALARY', 'SITE', 'SHIFT', 'EQUIPMENT', 'DISCIPLINARY', 'RANK', 'CONTRACT'];

export default function ChangeSheetsPage() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [guards, setGuards] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    guardId: '', changeType: 'SALARY', reason: '', amount: '',
    previousValue: '', newValue: '', serialOrBiometric: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getChangeSheets(undefined, filterStatus || undefined, filterType || undefined);
      setSheets(data);
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, filterType]);

  useEffect(() => {
    api.getUsers('GUARD').then(setGuards).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createChangeSheet({
        ...form,
        amount: form.amount ? parseFloat(form.amount) : undefined,
      });
      setMsg('✅ Change sheet created');
      setShowCreate(false);
      setForm({ guardId: '', changeType: 'SALARY', reason: '', amount: '', previousValue: '', newValue: '', serialOrBiometric: '' });
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await api.approveChangeSheet(id, approved);
      setMsg(approved ? '✅ Change sheet approved' : '✅ Change sheet rejected');
      load();
    } catch (e: any) { setMsg(e.message); }
  };

  const statusBadge = (s: string) => s === 'APPROVED' ? 'badge-success' : s === 'REJECTED' ? 'badge-danger' : 'badge-warning';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FilePenLine size={22} /> Change Sheets
        </h1>
        <div className="page-header-actions" style={{ flexWrap: 'wrap' }}>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '130px' }}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '130px' }}>
            <option value="">All Types</option>
            {CHANGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Change Sheet
          </button>
        </div>
      </div>

      {msg && <div className={`message ${msg.startsWith('✅') ? 'message-success' : 'message-error'}`} onClick={() => setMsg('')}>{msg}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
      ) : sheets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FilePenLine size={40} opacity={0.3} /></div>
          <div className="empty-state-text">No change sheets found</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Guard</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Previous → New</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.guard?.name || '—'}<br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.guard?.staffId || ''}</span></td>
                  <td><span className="badge badge-accent">{s.changeType}</span></td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.reason}</td>
                  <td>{s.amount ? `UGX ${s.amount.toLocaleString()}` : '—'}</td>
                  <td>{s.previousValue || '—'} → {s.newValue || '—'}</td>
                  <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    {s.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'CEO' || user?.role === 'HR') && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(s.id, true)} title="Approve"><Check size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleApprove(s.id, false)} title="Reject"><X size={13} /></button>
                      </div>
                    )}
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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FilePenLine size={18} /> New Change Sheet</h2>
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
                  <label className="label">Change Type</label>
                  <select className="input" value={form.changeType} onChange={e => setForm(f => ({ ...f, changeType: e.target.value }))}>
                    {CHANGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (if applicable)</label>
                  <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Reason</label>
                <textarea className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Previous Value</label>
                  <input className="input" value={form.previousValue} onChange={e => setForm(f => ({ ...f, previousValue: e.target.value }))} />
                </div>
                <div>
                  <label className="label">New Value</label>
                  <input className="input" value={form.newValue} onChange={e => setForm(f => ({ ...f, newValue: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Serial / Biometric Reference</label>
                <input className="input" value={form.serialOrBiometric} onChange={e => setForm(f => ({ ...f, serialOrBiometric: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Change Sheet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
