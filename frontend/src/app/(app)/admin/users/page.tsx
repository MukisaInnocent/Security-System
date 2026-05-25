'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Search, Pencil, Trash2, Plus, LoaderCircle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'GUARD' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getUsers(filter || undefined).then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        const { password, ...rest } = form;
        await api.updateUser(editUser.id, password ? form : rest);
      } else {
        await api.createUser(form);
      }
      setShowModal(false);
      setEditUser(null);
      setForm({ name: '', email: '', password: '', phone: '', role: 'GUARD' });
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', role: u.role });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try { await api.deleteUser(id); load(); } catch (e: any) { alert(e.message); }
  };

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'badge-danger', OPS_MANAGER: 'badge-accent', SUPERVISOR: 'badge-warning',
      GUARD: 'badge-success', CLIENT: 'badge-info', M_AND_E: 'badge-neutral',
    };
    return map[role] || 'badge-neutral';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={24} /> User Management
        </h1>
        <div className="page-header-actions">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '200px', paddingLeft: '2.25rem' }} />
          </div>
          <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: '140px' }}>
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="OPS_MANAGER">Ops Manager</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="GUARD">Guard</option>
            <option value="CLIENT">Client</option>
            <option value="M_AND_E">M&E Analyst</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditUser(null); setForm({ name: '', email: '', password: '', phone: '', role: 'GUARD' }); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Plus size={14} /> Add User
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
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-light)',
                      }}>{u.name.charAt(0)}</div>
                      {u.name}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${roleBadge(u.role)}`}>{u.role.replace(/_/g, ' ')}</span></td>
                  <td>{u.phone || '—'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(u)} title="Edit user">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(u.id)} title="Delete user" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state" style={{ padding: '2rem' }}>
                    <Users size={32} opacity={0.5} style={{ marginBottom: '0.5rem', display: 'block', margin: '0 auto' }} />
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
              <Users size={20} /> {editUser ? 'Edit User' : 'Create User'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="label">{editUser ? 'New Password (optional)' : 'Password'}</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="ADMIN">Admin</option>
                  <option value="OPS_MANAGER">Ops Manager</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="GUARD">Guard</option>
                  <option value="CLIENT">Client</option>
                  <option value="M_AND_E">M&E Analyst</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }} onClick={handleSave} disabled={saving}>
                  {saving && <LoaderCircle size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'Saving...' : editUser ? 'Update' : 'Create'}
                </button>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
