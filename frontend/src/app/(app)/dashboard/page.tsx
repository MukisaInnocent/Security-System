'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users, ClipboardList, CalendarDays, TriangleAlert, MapPin,
  TrendingUp, TrendingDown, Minus, CheckCircle2, LoaderCircle,
} from 'lucide-react';

interface Stats {
  activeGuards: number;
  totalGuards: number;
  totalSites: number;
  todayDeployments: number;
  todayAttendance: number;
  todayIncidents: number;
  criticalIncidents: number;
  openIncidents: number;
  geofenceCompliance: number;
  recentAttendance: any[];
  recentIncidents: any[];
  weeklyTrend: { date: string; count: number }[];
}

const SeverityBadge = ({ s }: { s: string }) => {
  const cls = s === 'CRITICAL' ? 'badge-danger' : s === 'HIGH' ? 'badge-warning' : s === 'MEDIUM' ? 'badge-info' : 'badge-neutral';
  return <span className={`badge ${cls}`}>{s}</span>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
        <LoaderCircle size={20} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span>
      </div>
    );
  }

  if (!stats) {
    return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Failed to load dashboard data</div>;
  }

  const maxTrend = Math.max(...stats.weeklyTrend.map(t => t.count), 1);

  const kpis = [
    {
      label: 'Active Guards',
      value: stats.activeGuards,
      sub: `of ${stats.totalGuards} total`,
      color: 'var(--success)',
      icon: <Users size={18} />,
      iconBg: 'var(--success-glow)',
    },
    {
      label: "Today's Attendance",
      value: stats.todayAttendance,
      sub: 'check-ins/outs',
      color: 'var(--info)',
      icon: <ClipboardList size={18} />,
      iconBg: 'var(--info-glow)',
    },
    {
      label: 'Deployments',
      value: stats.todayDeployments,
      sub: `across ${stats.totalSites} sites`,
      color: 'var(--accent-light)',
      icon: <CalendarDays size={18} />,
      iconBg: 'var(--accent-glow)',
    },
    {
      label: 'Incidents Today',
      value: stats.todayIncidents,
      sub: stats.criticalIncidents > 0 ? `${stats.criticalIncidents} critical` : 'none critical',
      color: stats.todayIncidents > 0 ? 'var(--danger)' : 'var(--text-primary)',
      icon: <TriangleAlert size={18} />,
      iconBg: stats.todayIncidents > 0 ? 'var(--danger-glow)' : 'rgba(148,163,184,0.1)',
    },
    {
      label: 'Geofence Compliance',
      value: `${stats.geofenceCompliance}%`,
      sub: '',
      color: stats.geofenceCompliance >= 90 ? 'var(--success)' : stats.geofenceCompliance >= 70 ? 'var(--warning)' : 'var(--danger)',
      icon: <MapPin size={18} />,
      iconBg: stats.geofenceCompliance >= 90 ? 'var(--success-glow)' : stats.geofenceCompliance >= 70 ? 'var(--warning-glow)' : 'var(--danger-glow)',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Command Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Real-time operational overview • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats stagger-children" style={{ marginBottom: '1.5rem' }}>
        {kpis.map((k, i) => (
          <div key={i} className="stat-card animate-fade-in">
            <div className="stat-icon" style={{ background: k.iconBg }}>{k.icon}</div>
            <div className="stat-label">{k.label}</div>
            <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
            {k.sub && <div className="stat-sub" style={{ color: k.label === 'Incidents Today' && stats.criticalIncidents > 0 ? 'var(--danger)' : undefined }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Weekly Sparkline */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={14} color="var(--accent-light)" /> 7-Day Check-in Trend
          </span>
          <span className="badge badge-info">{stats.weeklyTrend.reduce((s, t) => s + t.count, 0)} total</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '48px' }}>
          {stats.weeklyTrend.map((t, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '100%', borderRadius: '3px 3px 0 0',
                height: `${Math.max((t.count / maxTrend) * 40, 3)}px`,
                background: i === 6 ? 'var(--accent-gradient)' : 'rgba(99,102,241,0.25)',
                transition: 'height 0.5s ease',
              }} />
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                {new Date(t.date).toLocaleDateString('en', { weekday: 'short' }).charAt(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid-2">
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ClipboardList size={16} color="var(--accent-light)" /> Recent Attendance
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Guard</th><th>Site</th><th>Type</th><th>Time</th><th>GPS</th></tr>
              </thead>
              <tbody>
                {stats.recentAttendance.map((a: any) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.guard?.name}</td>
                    <td>{a.site?.name}</td>
                    <td>
                      <span className={a.type === 'CHECK_IN' ? 'badge badge-success' : 'badge badge-info'}>
                        {a.type === 'CHECK_IN' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><TrendingUp size={11} /> In</span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><TrendingDown size={11} /> Out</span>
                        )}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(a.timestamp).toLocaleTimeString()}</td>
                    <td>
                      <span className={a.isWithinGeofence ? 'badge badge-success' : 'badge badge-danger'}>
                        {a.isWithinGeofence
                          ? <CheckCircle2 size={12} />
                          : <Minus size={12} />
                        }
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.recentAttendance.length === 0 && (
                  <tr><td colSpan={5} className="empty-state" style={{ padding: '2rem' }}>No records today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TriangleAlert size={16} color="var(--warning)" /> Recent Incidents
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Reporter</th><th>Site</th><th>Severity</th><th>Description</th></tr>
              </thead>
              <tbody>
                {stats.recentIncidents.map((i: any) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.reportedBy?.name}</td>
                    <td>{i.site?.name}</td>
                    <td><SeverityBadge s={i.severity} /></td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i.description}
                    </td>
                  </tr>
                ))}
                {stats.recentIncidents.length === 0 && (
                  <tr><td colSpan={4} className="empty-state" style={{ padding: '2rem' }}>No incidents today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
