'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Briefcase, Users, CalendarDays, Loader2, Plus, MapPin, CheckCircle2, XCircle, Clock, AlertCircle, Eye, Trash2, Edit2, TrendingUp } from 'lucide-react';

export default function SpecialDutyPage() {
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    title: '', location: '', date: '', startTime: '', endTime: '',
    personnelRequired: '1', paymentPerPerson: '', description: '', assignmentType: 'EVENT'
  });

  useEffect(() => {
    loadDuties();
    api.getGuardProfiles().then(setAvailableGuards).catch(console.error);
  }, []);

  const loadDuties = async () => {
    setLoading(true);
    try {
      const data = await api.getSpecialDuties();
      setDuties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDuty = async () => {
    if (!formData.title || !formData.location || !formData.date) return;
    try {
      await api.createSpecialDuty(formData);
      setShowModal(false);
      setFormData({ title: '', location: '', date: '', startTime: '', endTime: '', personnelRequired: '1', paymentPerPerson: '', description: '', assignmentType: 'EVENT' });
      await loadDuties();
    } catch (err) {
      console.error('Failed to create duty:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { badge: string, icon: any }> = {
      'PENDING_CONFIRMATION': { badge: 'badge-warning', icon: <Clock size={13} /> },
      'CONFIRMED': { badge: 'badge-info', icon: <CheckCircle2 size={13} /> },
      'IN_PROGRESS': { badge: 'badge-info', icon: <TrendingUp size={13} /> },
      'COMPLETED': { badge: 'badge-success', icon: <CheckCircle2 size={13} /> },
      'CANCELLED': { badge: 'badge-danger', icon: <XCircle size={13} /> },
    };
    const config = statusMap[status] || { badge: 'badge-neutral', icon: <AlertCircle size={13} /> };
    return <span className={`badge ${config.badge}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>{config.icon} {status}</span>;
  };

  const getAssignmentTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'EVENT': '#8b5cf6', 'VIP_PROTECTION': '#dc2626', 'EMERGENCY_COVER': '#ea580c',
      'CLIENT_REQUEST': '#2563eb', 'OTHER': '#6b7280'
    };
    return colorMap[type] || '#6b7280';
  };

  const filteredDuties = duties.filter(duty => {
    const matchSearch = duty.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        duty.location.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || duty.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const dutyStats = {
    total: duties.length,
    pending: duties.filter((d: any) => d.status === 'PENDING_CONFIRMATION').length,
    confirmed: duties.filter((d: any) => d.status === 'CONFIRMED').length,
    completed: duties.filter((d: any) => d.status === 'COMPLETED').length,
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={28} className="text-accent" />
            Special Duty Management
          </h1>
          <p className="text-muted">Manage ad-hoc assignments for VIP protection, events, and emergency operations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Create Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Assignments</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{dutyStats.total}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending Confirmation</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{dutyStats.pending}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Confirmed</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{dutyStats.confirmed}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{dutyStats.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by title or location..."
          className="input"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_CONFIRMATION">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Duties List */}
      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}>
          <Loader2 className="animate-spin text-muted" size={32} />
        </div>
      ) : filteredDuties.length === 0 ? (
        <div className="empty-state card" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="empty-state-icon"><Briefcase size={48} opacity={0.2} /></div>
          <div className="empty-state-text">{searchFilter || statusFilter !== 'ALL' ? 'No matching assignments' : 'No assignments scheduled'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filteredDuties.map((duty: any) => (
            <div key={duty.id} className="card hover-lift" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, flex: 1 }}>{duty.title}</h2>
                      <div
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'white',
                          backgroundColor: getAssignmentTypeColor(duty.assignmentType),
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {duty.assignmentType?.replace(/_/g, ' ')}
                      </div>
                    </div>
                    {duty.briefingNotes && (
                      <p className="text-sm text-muted" style={{ margin: '0.5rem 0 0 0' }}>
                        {duty.briefingNotes.substring(0, 100)}{duty.briefingNotes.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    {getStatusBadge(duty.status)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays size={14} className="text-accent" style={{ flexShrink: 0 }} />
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Date & Time</div>
                      <div style={{ fontWeight: 600 }}>{new Date(duty.date).toLocaleDateString('en-GB')} {duty.startTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-accent" style={{ flexShrink: 0 }} />
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Location</div>
                      <div style={{ fontWeight: 600 }}>{duty.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={14} className="text-accent" style={{ flexShrink: 0 }} />
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Personnel</div>
                      <div style={{ fontWeight: 600 }}>{duty.personnel?.length || 0} Assigned</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Payment</div>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>UGX {duty.paymentPerPerson?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personnel & Actions */}
              <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="flex -space-x-2">
                  {duty.personnel?.slice(0, 5).map((p: any) => (
                    <div
                      key={p.id}
                      className="avatar-sm"
                      title={p.user?.name}
                      style={{
                        border: '2px solid var(--surface-secondary)',
                        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                      }}
                    >
                      {p.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {duty.personnel?.length > 5 && (
                    <div className="avatar-sm" style={{ border: '2px solid var(--surface-secondary)', backgroundColor: 'var(--text-muted)' }}>
                      +{duty.personnel.length - 5}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Eye size={14} /> View
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} /> Manage
                  </button>
                  {duty.status !== 'COMPLETED' && duty.status !== 'CANCELLED' && (
                    <>
                      <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444' }}>
                        <Trash2 size={14} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Create Special Duty Assignment</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowModal(false)}
                style={{ fontSize: '1.2rem', padding: '0.25rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            <div className="grid" style={{ gap: '1rem' }}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Assignment Type</label>
                  <select
                    className="input"
                    value={formData.assignmentType}
                    onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                  >
                    <option value="EVENT">Event Security</option>
                    <option value="VIP_PROTECTION">VIP Protection</option>
                    <option value="EMERGENCY_COVER">Emergency Cover</option>
                    <option value="CLIENT_REQUEST">Client Request</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Personnel Required</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={formData.personnelRequired}
                    onChange={(e) => setFormData({ ...formData, personnelRequired: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Assignment Title *</label>
                <input
                  className="input"
                  placeholder="e.g. VIP Escort - Sheraton Hotel"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Location *</label>
                <input
                  className="input"
                  placeholder="Event location or route"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Payment Per Guard (UGX) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 50000"
                  value={formData.paymentPerPerson}
                  onChange={(e) => setFormData({ ...formData, paymentPerPerson: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Briefing Notes</label>
                <textarea
                  className="input"
                  placeholder="Special instructions for personnel..."
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleCreateDuty}
                style={{ flex: 1 }}
                disabled={!formData.title || !formData.location || !formData.date}
              >
                Create Assignment
              </button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .-space-x-2 > * { margin-left: -0.5rem; }
        .-space-x-2 > *:first-child { margin-left: 0; }
      `}</style>
    </div>
  );
}
