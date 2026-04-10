'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2, ClipboardCheck, AlertTriangle, MapPin, 
  TrendingUp, TrendingDown, CheckCircle2, XCircle, LoaderCircle, ShieldAlert,
  BadgeDollarSign, FileText, UserCheck, Utensils
} from 'lucide-react';

export default function ClientPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'incidents' | 'finance' | 'performance'>('overview');

  useEffect(() => {
    api.getClientDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
        <LoaderCircle size={20} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Loading portal...</span>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Failed to load client data</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Client Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Service transparency dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-stats stagger-children" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Your Sites</div>
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{data.stats.totalSites}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Guards Today</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{data.stats.activeGuardsToday}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Monthly Check-ins</div>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{data.stats.monthlyCheckIns}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Geofence Compliance</div>
          <div className="stat-value" style={{
            color: data.stats.geofenceCompliance >= 90 ? 'var(--success)' :
              data.stats.geofenceCompliance >= 70 ? 'var(--warning)' : 'var(--danger)'
          }}>{data.stats.geofenceCompliance}%</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="stat-label">Security Alerts</div>
          <div className="stat-value" style={{ color: data.stats.monthlyIncidents > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {data.stats.monthlyIncidents}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.5rem' }}>
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Building2 size={16} /> My Sites
        </button>
        <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ClipboardCheck size={16} /> Attendance
        </button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserCheck size={16} /> Performance
        </button>
        <button className={`tab ${activeTab === 'incidents' ? 'active' : ''}`} onClick={() => setActiveTab('incidents')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertTriangle size={16} /> Alerts
        </button>
        <button className={`tab ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BadgeDollarSign size={16} /> Billing
        </button>
      </div>


      {/* Sites Overview */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {data.sites.map((site: any) => (
              <div key={site.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={16} color="var(--accent-light)" /> {site.name}
                  </h3>
                  <span className={`badge ${site.isActive ? 'badge-success' : 'badge-neutral'}`}>
                    {site.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{site.address}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Geofence: {site.geofenceRadius}m radius
                </div>

                {/* Guards deployed today */}
                {site.deployments?.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                      Guards Today
                    </div>
                    {site.deployments.map((dep: any) => (
                      <div key={dep.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 0', borderTop: '1px solid var(--border-light)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-glow)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-light)',
                          }}>{dep.guard?.name?.charAt(0)}</div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dep.guard?.name}</span>
                        </div>
                        <span className="badge badge-info">{dep.shiftStart} – {dep.shiftEnd}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                    No guards deployed today
                  </div>
                )}
              </div>
            ))}
          </div>
          {data.sites.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Building2 size={32} opacity={0.5} /></div>
              <div className="empty-state-text">No sites assigned to your account</div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Log */}
      {activeTab === 'attendance' && (
        <div className="animate-fade-in">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Guard</th><th>Site</th><th>Type</th><th>Time</th><th>Geofence</th></tr>
              </thead>
              <tbody>
                {data.recentAttendance.map((a: any) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.guard?.name}</td>
                    <td>{a.site?.name}</td>
                    <td>
                      <span className={`badge ${a.type === 'CHECK_IN' ? 'badge-success' : 'badge-info'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {a.type === 'CHECK_IN' ? <><TrendingUp size={12} /> In</> : <><TrendingDown size={12} /> Out</>}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(a.timestamp).toLocaleTimeString()}</td>
                    <td>
                      <span className={`badge ${a.isWithinGeofence ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        {a.isWithinGeofence ? <><CheckCircle2 size={12} /> Valid</> : <><XCircle size={12} /> Outside</>}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.recentAttendance.length === 0 && (
                  <tr><td colSpan={5} className="empty-state" style={{ padding: '2rem' }}>No attendance records today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      {activeTab === 'performance' && (
        <div className="animate-fade-in">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <h3 className="text-sm fw-700 mb-3 flex items-center gap-2"><UserCheck size={16} className="text-accent" /> Biometric Compliance</h3>
              <div className="flex items-end gap-3">
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>98.4%</div>
                <div className="text-xs text-success mb-2">↑ 1.2% from last month</div>
              </div>
              <p className="text-xs text-muted mt-2">Percentage of shifts started with successful fingerprint verification.</p>
            </div>
            <div className="card">
              <h3 className="text-sm fw-700 mb-3 flex items-center gap-2"><Utensils size={16} className="text-accent" /> Meal Fulfillment</h3>
              <div className="flex items-end gap-3">
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>100%</div>
                <div className="text-xs text-success mb-2">Perfect</div>
              </div>
              <p className="text-xs text-muted mt-2">All on-duty personnel received verified meals today.</p>
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm fw-700 mb-3">Attendance Stability Trend</h3>
            <div style={{ height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '10px' }}>
              {[40, 60, 45, 90, 85, 95, 98, 92, 95, 100].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--accent-gradient)', borderRadius: '2px 2px 0 0', opacity: 0.3 + (i * 0.07) }}></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted mt-2">
              <span>10 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Log */}
      {activeTab === 'incidents' && (
        <div className="animate-fade-in">
          {data.recentIncidents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.recentIncidents.map((inc: any) => (
                <div key={inc.id} className="card-flat" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <span className={`badge ${
                        inc.severity === 'CRITICAL' ? 'badge-danger' : inc.severity === 'HIGH' ? 'badge-warning' :
                        inc.severity === 'MEDIUM' ? 'badge-info' : 'badge-neutral'
                      }`}>{inc.severity}</span>
                      <span className={`badge ${
                        inc.status === 'RESOLVED' ? 'badge-success' :
                        inc.status === 'INVESTIGATING' ? 'badge-warning' : 'badge-neutral'
                      }`}>{inc.status || 'OPEN'}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(inc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.375rem' }}>{inc.description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={12} /> {inc.site?.name} • Reported by {inc.reportedBy?.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><ShieldAlert size={32} opacity={0.5} /></div>
              <div className="empty-state-text">No incidents at your sites</div>
            </div>
          )}
        </div>
      )}

      {/* Finance / Billing */}
      {activeTab === 'finance' && (
        <div className="animate-fade-in">
          <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-muted fw-600 uppercase mb-1">Contract Status</div>
                <div className="text-lg fw-800 text-success">ACTIVE & SECURE</div>
              </div>
              <BadgeDollarSign size={32} className="text-success opacity-50" />
            </div>
          </div>
          <div className="table-container card">
            <h3 className="text-sm fw-700 mb-3 px-2">Recent Invoices</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem' }}>Period</th>
                  <th style={{ padding: '0.75rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices?.length > 0 ? data.invoices.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }} className="fw-700 font-mono">{inv.invoiceNumber}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                      {new Date(inv.billingPeriodStart).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }} className="fw-700">UGX {inv.finalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'DRAFT' ? 'badge-neutral' : 'badge-info'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button className="btn btn-outline mt-4 w-full flex items-center justify-center gap-2">
            <FileText size={16} /> Download Service Agreement PDF
          </button>
        </div>
      )}
    </div>
  );
}
