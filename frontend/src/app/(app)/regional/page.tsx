'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MapPin, Users, Shield, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function RegionalDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Find the region managed by this user
      const regions = await api.getRegions();
      const myRegion = regions.find((r: any) => r.managerId === user?.id);
      
      if (!myRegion) {
        setLoading(false);
        return;
      }

      const dashboard = await api.getRegionDashboard(myRegion.id);
      setData({ region: myRegion, ...dashboard });
    } catch (err) {
      console.error('Failed to load regional data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh' }}><Loader2 className="animate-spin text-muted" /></div>;
  }

  if (!data) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
        <h2>No Region Assigned</h2>
        <p className="text-muted">You are not currently assigned as a manager for any region.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={28} className="text-accent" />
            {data.region.name} Overview
          </h1>
          <p className="text-muted">Regional Operations Dashboard</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-icon"><MapPin size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{data.sites.length}</div>
            <div className="stat-label">Active Sites</div>
          </div>
        </div>

        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="stat-icon" style={{ background: 'var(--accent)', color: 'white' }}><Shield size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{data.activeDeployments}</div>
            <div className="stat-label">Guards On Duty</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><AlertTriangle size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{data.recentIncidents}</div>
            <div className="stat-label">Recent Incidents (24h)</div>
          </div>
        </div>
      </div>

      <h2>Regional Sites</h2>
      <div className="card">
        <div className="table-container">
<table className="table">
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Address</th>
              <th>Guards On Duty</th>
              <th>Post Coverage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.sites.map((site: any) => {
              const active = site.deployments.filter((d: any) => d.status === 'ACTIVE').length;
              const required = site.posts.reduce((sum: number, p: any) => sum + p.guardsRequired, 0);
              const coverage = required > 0 ? Math.round((active / required) * 100) : 0;
              
              return (
                <tr key={site.id}>
                  <td className="fw-500">{site.name}</td>
                  <td className="text-muted">{site.address}</td>
                  <td>
                    <span className="badge badge-success">{active} Active</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, coverage)}%`, background: coverage >= 100 ? 'var(--success)' : coverage >= 70 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{coverage}%</span>
                    </div>
                  </td>
                  <td>
                    <Link href={`/admin/deployments?siteId=${site.id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {data.sites.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sites in this region</td></tr>
            )}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
}
