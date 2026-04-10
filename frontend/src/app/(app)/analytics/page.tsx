'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  BarChart3, Users, MapPin, Download, TrendingUp,
  ShieldCheck, TriangleAlert, LoaderCircle,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

const chartTheme = {
  gridColor: 'rgba(51, 65, 85, 0.3)',
  tickColor: '#64748b',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export default function AnalyticsPage() {
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [incidentTrend, setIncidentTrend] = useState<any[]>([]);
  const [guardPerformance, setGuardPerformance] = useState<any[]>([]);
  const [siteSummary, setSiteSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'guards' | 'sites'>('overview');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAttendanceTrend(30).then(setAttendanceTrend).catch(() => {}),
      api.getIncidentTrend(30).then(setIncidentTrend).catch(() => {}),
      api.getGuardPerformance().then(setGuardPerformance).catch(() => {}),
      api.getSiteSummary().then(setSiteSummary).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      const data = await api.exportData(type);
      const csv = convertToCSV(data);
      downloadCSV(csv, `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (e) { console.error('Export failed:', e); }
    finally { setExporting(false); }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    const flatten = (obj: any, prefix = ''): Record<string, any> => {
      const result: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
          Object.assign(result, flatten(val, newKey));
        } else { result[newKey] = val; }
      }
      return result;
    };
    const flatData = data.map(d => flatten(d));
    const headers = Object.keys(flatData[0]);
    return [headers.join(','), ...flatData.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
        <LoaderCircle size={20} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Loading analytics...</span>
      </div>
    );
  }

  const chartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: chartTheme.gridColor }, ticks: { color: chartTheme.tickColor, font: { size: 10, family: chartTheme.fontFamily } } },
      y: { grid: { color: chartTheme.gridColor }, ticks: { color: chartTheme.tickColor, font: { size: 10, family: chartTheme.fontFamily } }, beginAtZero: true },
    },
  };

  const labels = attendanceTrend.map(d => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  });

  const attendanceChartData = {
    labels,
    datasets: [
      { label: 'Check-ins', data: attendanceTrend.map(d => d.checkIns), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4, pointRadius: 1.5, borderWidth: 2 },
      { label: 'Check-outs', data: attendanceTrend.map(d => d.checkOuts), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)', fill: true, tension: 0.4, pointRadius: 1.5, borderWidth: 2 },
    ],
  };

  const complianceChartData = {
    labels,
    datasets: [{ label: 'Compliance %', data: attendanceTrend.map(d => d.compliance), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3, pointRadius: 1.5, borderWidth: 2 }],
  };

  const incidentLabels = incidentTrend.map(d => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  });

  const incidentChartData = {
    labels: incidentLabels,
    datasets: [
      { label: 'Critical', data: incidentTrend.map(d => d.critical), backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 3 },
      { label: 'High', data: incidentTrend.map(d => d.high), backgroundColor: 'rgba(245, 158, 11, 0.8)', borderRadius: 3 },
      { label: 'Medium', data: incidentTrend.map(d => d.medium), backgroundColor: 'rgba(59, 130, 246, 0.8)', borderRadius: 3 },
      { label: 'Low', data: incidentTrend.map(d => d.low), backgroundColor: 'rgba(148, 163, 184, 0.6)', borderRadius: 3 },
    ],
  };

  const incidentBarOpts = {
    ...chartOpts,
    plugins: { legend: { display: true, position: 'top' as const, labels: { color: chartTheme.tickColor, font: { size: 10 }, boxWidth: 12, padding: 12 } } },
    scales: { ...chartOpts.scales, x: { ...chartOpts.scales.x, stacked: true }, y: { ...chartOpts.scales.y, stacked: true } },
  };

  const totalCheckIns = attendanceTrend.reduce((s, d) => s + d.checkIns, 0);
  const totalIncidents = incidentTrend.reduce((s, d) => s + d.total, 0);
  const avgCompliance = attendanceTrend.length > 0
    ? Math.round(attendanceTrend.reduce((s, d) => s + d.compliance, 0) / attendanceTrend.length) : 100;

  const summaryCards = [
    { label: '30-Day Check-ins', value: totalCheckIns, color: 'var(--accent-light)', icon: <TrendingUp size={18} /> },
    { label: '30-Day Incidents', value: totalIncidents, color: totalIncidents > 20 ? 'var(--danger)' : 'var(--warning)', icon: <TriangleAlert size={18} /> },
    { label: 'Avg Compliance', value: `${avgCompliance}%`, color: avgCompliance >= 85 ? 'var(--success)' : 'var(--warning)', icon: <ShieldCheck size={18} /> },
    { label: 'Active Guards', value: guardPerformance.length, color: 'var(--info)', icon: <Users size={18} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>M&E Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            30-day performance & operational trends
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => handleExport('attendance')} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Download size={13} /> Attendance CSV
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport('incidents')} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Download size={13} /> Incidents CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-stats stagger-children" style={{ marginBottom: '1.5rem' }}>
        {summaryCards.map((c, i) => (
          <div key={i} className="stat-card animate-fade-in">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <BarChart3 size={14} /> Trends
        </button>
        <button className={`tab ${activeTab === 'guards' ? 'active' : ''}`} onClick={() => setActiveTab('guards')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Users size={14} /> Guard Performance
        </button>
        <button className={`tab ${activeTab === 'sites' ? 'active' : ''}`} onClick={() => setActiveTab('sites')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <MapPin size={14} /> Site Summary
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="stagger-children">
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-container animate-fade-in">
              <h3>Attendance Trend (30 Days)</h3>
              <div style={{ height: '250px' }}><Line data={attendanceChartData} options={chartOpts} /></div>
            </div>
            <div className="chart-container animate-fade-in">
              <h3>Geofence Compliance (%)</h3>
              <div style={{ height: '250px' }}><Line data={complianceChartData} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 100 } } }} /></div>
            </div>
          </div>
          <div className="chart-container animate-fade-in">
            <h3>Incident Frequency by Severity</h3>
            <div style={{ height: '280px' }}><Bar data={incidentChartData} options={incidentBarOpts} /></div>
          </div>
        </div>
      )}

      {activeTab === 'guards' && (
        <div className="animate-fade-in">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Guard</th><th>Shifts</th><th>Check-ins</th><th>Attendance %</th><th>Geofence %</th><th>Incidents</th></tr>
              </thead>
              <tbody>
                {guardPerformance.map((g: any) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</td>
                    <td>{g.totalDeployments}</td>
                    <td>{g.totalCheckIns}</td>
                    <td>
                      <span className={`badge ${g.attendanceRate >= 90 ? 'badge-success' : g.attendanceRate >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                        {g.attendanceRate}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${g.geofenceCompliance >= 90 ? 'badge-success' : g.geofenceCompliance >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                        {g.geofenceCompliance}%
                      </span>
                    </td>
                    <td>{g.incidentsReported}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sites' && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {siteSummary.map((s: any) => (
              <div key={s.id} className="card">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} color="var(--accent-light)" /> {s.name}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{s.address}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[
                    { label: 'Deployments', value: s.totalDeployments, color: 'var(--accent-light)' },
                    { label: 'Attendance', value: s.totalAttendance, color: 'var(--info)' },
                    { label: 'Incidents', value: s.totalIncidents, color: 'var(--warning)' },
                    { label: 'Unresolved', value: s.unresolvedIncidents, color: s.unresolvedIncidents > 0 ? 'var(--danger)' : 'var(--success)' },
                  ].map((m, i) => (
                    <div key={i} className="card-flat" style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
