'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Crosshair, ShieldAlert, CheckCircle2, AlertTriangle, Package, Loader2 } from 'lucide-react';

export default function ArmouryPage() {
  const [weapons, setWeapons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeapons();
  }, []);

  const loadWeapons = async () => {
    try {
      const data = await api.getWeapons();
      setWeapons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <span className="badge badge-success"><CheckCircle2 size={12}/> Available</span>;
      case 'ISSUED': return <span className="badge badge-warning"><ShieldAlert size={12}/> Issued</span>;
      case 'UNDER_MAINTENANCE': return <span className="badge badge-danger"><AlertTriangle size={12}/> Maintenance</span>;
      case 'DECOMMISSIONED': return <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Decommissioned</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Crosshair size={28} className="text-accent" />
            Armoury Registry
          </h1>
          <p className="text-muted">Manage weapon stock, licences, and issuances.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} /> Add Weapon
          </button>
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
                <th>Serial Number</th>
                <th>Type / Model</th>
                <th>Status</th>
                <th>Licence Number</th>
                <th>Licence Expiry</th>
                <th>Current Issuance</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map(w => {
                const isExpiringSoon = w.licenceExpiry && new Date(w.licenceExpiry).getTime() - Date.now() < 60 * 24 * 60 * 60 * 1000;
                const activeIssuance = w.issuances?.find((i: any) => !i.isReturned);
                
                return (
                  <tr key={w.id}>
                    <td className="fw-600 font-mono text-sm">{w.serialNumber}</td>
                    <td>
                      <div className="fw-500">{w.weaponType}</div>
                      <div className="text-muted text-xs">{w.make} {w.model}</div>
                    </td>
                    <td>{getStatusBadge(w.status)}</td>
                    <td className="font-mono text-xs">{w.licenceNumber || '-'}</td>
                    <td>
                      {w.licenceExpiry ? (
                        <span className={isExpiringSoon ? 'text-danger fw-600' : 'text-default'}>
                          {new Date(w.licenceExpiry).toLocaleDateString('en-GB')}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {activeIssuance ? (
                        <div className="text-sm">
                          <span className="fw-500">{activeIssuance.guard?.name}</span>
                          <div className="text-muted text-xs">{new Date(activeIssuance.issueTimestamp).toLocaleString('en-GB')}</div>
                        </div>
                      ) : <span className="text-muted">-</span>}
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
