'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Briefcase, Users, CalendarDays, Loader2, Plus, Search, MapPin, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SpecialDutyPage() {
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="badge badge-info">Open</span>;
      case 'FULL': return <span className="badge badge-warning">Full Capacity</span>;
      case 'COMPLETED': return <span className="badge badge-success">Completed</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={28} className="text-accent" />
            Special Duty Assignments
          </h1>
          <p className="text-muted">Ad-hoc assignments for VIP protection, events, and emergency cash transit.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Special Duty
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem', gridColumn: '1 / -1' }}><Loader2 className="animate-spin text-muted" /></div>
        ) : duties.map((duty: any) => (
          <div key={duty.id} className="card hover-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{duty.title}</h2>
              {getStatusBadge(duty.status)}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CalendarDays size={14} className="text-accent" />
                {new Date(duty.date).toLocaleDateString('en-GB')} {duty.startTime}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <MapPin size={14} className="text-accent" />
                {duty.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Users size={14} className="text-accent" />
                {duty.personnelRequired} Personnel
              </div>
              <div className="flex items-center gap-2 text-sm font-mono fw-600 text-success">
                UGX {duty.paymentPerPerson?.toLocaleString()}
              </div>
            </div>

            <p className="text-sm text-muted mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {duty.description}
            </p>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex -space-x-2">
                {duty.personnel?.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="avatar-sm" title={p.user?.name} style={{ border: '2px solid' }}>
                    {p.user?.name.charAt(0)}
                  </div>
                ))}
                {duty.personnel?.length > 3 && (
                  <div className="avatar-sm" style={{ border: '2px solid' }}>+{duty.personnel.length - 3}</div>
                )}
              </div>
              <button className="btn btn-ghost btn-sm">Manage Personnel</button>
            </div>
          </div>
        ))}
        {!loading && duties.length === 0 && (
          <div className="empty-state card" style={{ gridColumn: '1 / -1', padding: '4rem' }}>
            <div className="empty-state-icon"><Briefcase size={48} opacity={0.2} /></div>
            <div className="empty-state-text">No ad-hoc duties scheduled</div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>New Special Duty Assignment</h2>
            <div className="grid grid-2 gap-4 mt-4">
              <div className="col-span-2"><label className="label">Assignment Title</label><input className="input" placeholder="e.g. VIP Escort - Sheraton Hotel" /></div>
              <div><label className="label">Duty Date</label><input type="date" className="input" /></div>
              <div><label className="label">Start Time</label><input type="time" className="input" /></div>
              <div><label className="label">Personnel Required</label><input type="number" className="input" defaultValue="1" /></div>
              <div><label className="label">Payment Per Guard (UGX)</label><input type="number" className="input" placeholder="e.g. 50000" /></div>
              <div className="col-span-2"><label className="label">Location</label><input className="input" placeholder="Event location or route" /></div>
              <div className="col-span-2"><label className="label">Description</label><textarea className="input" style={{ minHeight: '80px' }}></textarea></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>Publish Invitation</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .avatar-sm {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .-space-x-2 > * { margin-left: -0.5rem; }
        .-space-x-2 > *:first-child { margin-left: 0; }
      `}</style>
    </div>
  );
}
