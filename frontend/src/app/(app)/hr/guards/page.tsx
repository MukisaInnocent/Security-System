'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { UserCheck, Shield, ChevronRight, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function HRGuardsPage() {
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadGuards();
  }, []);

  const loadGuards = async () => {
    try {
      const data = await api.getGuardProfiles();
      setGuards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = guards.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.staffId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserCheck size={28} className="text-accent" />
            Guard Personnel
          </h1>
          <p className="text-muted">Manage guard profiles, biometrics, and authorisations.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or staff ID..."
            className="input"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><Loader2 className="animate-spin text-muted" /></div>
        ) : (
          <div className="table-container">
<table className="table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name / Contact</th>
                <th>Biometric Status</th>
                <th>Weapon Auth</th>
                <th>Salary Rate</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(guard => {
                const profile = guard.guardProfile;
                return (
                  <tr key={guard.id}>
                    <td className="fw-600 font-mono text-sm">{guard.staffId || '-'}</td>
                    <td>
                      <div className="fw-500">{guard.name}</div>
                      <div className="text-muted text-xs">{guard.phone}</div>
                    </td>
                    <td>
                      {profile?.biometricEnrolled ? (
                        <span className="badge badge-success"><CheckCircle2 size={12} /> Enrolled</span>
                      ) : (
                        <span className="badge badge-warning"><XCircle size={12} /> Pending</span>
                      )}
                    </td>
                    <td>
                      {profile?.weaponAuthorised ? (
                        <span className="badge badge-danger"><Shield size={12} /> Authorised</span>
                      ) : (
                        <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>None</span>
                      )}
                    </td>
                    <td className="font-mono text-sm">
                      {profile?.monthlySalary ? `UGX ${profile.monthlySalary.toLocaleString()}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/hr/guards/${guard.id}`} className="btn btn-ghost btn-sm">
                        Profile <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
</div>
        )}
      </div>
    </div>
  );
}
