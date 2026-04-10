'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MapPin, Search, Plus, Pencil, LoaderCircle } from 'lucide-react';

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSite, setEditSite] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '', geofenceRadius: '100' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getSites().then(setSites).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name: form.name, address: form.address,
        latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
        geofenceRadius: parseFloat(form.geofenceRadius),
      };
      if (editSite) await api.updateSite(editSite.id, data);
      else await api.createSite(data);
      setShowModal(false); setEditSite(null);
      setForm({ name: '', address: '', latitude: '', longitude: '', geofenceRadius: '100' });
      load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (s: any) => {
    setEditSite(s);
    setForm({ name: s.name, address: s.address, latitude: String(s.latitude), longitude: String(s.longitude), geofenceRadius: String(s.geofenceRadius) });
    setShowModal(true);
  };

  const filtered = sites.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={24} /> Site Management
        </h1>
        <div className="page-header-actions">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search sites..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '200px', paddingLeft: '2.25rem' }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditSite(null); setForm({ name: '', address: '', latitude: '', longitude: '', geofenceRadius: '100' }); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Plus size={14} /> Add Site
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <LoaderCircle size={24} color="var(--accent-light)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map(s => (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{s.name}</h3>
                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={12} /> {s.address}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="card-flat" style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)' }}>{s.latitude.toFixed(4)}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Latitude</div>
                </div>
                <div className="card-flat" style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)' }}>{s.longitude.toFixed(4)}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Longitude</div>
                </div>
                <div className="card-flat" style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--info)' }}>{s.geofenceRadius}m</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Radius</div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }} onClick={() => handleEdit(s)}>
                <Pencil size={12} /> Edit
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon"><MapPin size={32} opacity={0.5} /></div>
              <div className="empty-state-text">No sites found</div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
              <MapPin size={20} /> {editSite ? 'Edit Site' : 'Create Site'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><label className="label">Site Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Address</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><label className="label">Latitude</label><input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></div>
                <div><label className="label">Longitude</label><input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></div>
              </div>
              <div><label className="label">Geofence Radius (meters)</label><input className="input" type="number" value={form.geofenceRadius} onChange={e => setForm({ ...form, geofenceRadius: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }} onClick={handleSave} disabled={saving}>
                  {saving && <LoaderCircle size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'Saving...' : editSite ? 'Update' : 'Create'}
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
