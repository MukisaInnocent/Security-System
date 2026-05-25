'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FileBarChart, RefreshCw, Send, Calendar, Users, MapPin, AlertTriangle, CheckCircle, Clock, BarChart3, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'coverage' | 'callcard' | 'absent' | 'history'>('coverage');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [coverage, setCoverage] = useState<any>(null);
  const [callCard, setCallCard] = useState<any>(null);
  const [absentGuards, setAbsentGuards] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'coverage') {
        const data = await api.getReportCoverage(date);
        setCoverage(data);
      } else if (activeTab === 'callcard') {
        const data = await api.getCallCard(date);
        setCallCard(data);
      } else if (activeTab === 'absent') {
        const data = await api.getAbsentGuards(date);
        setAbsentGuards(data);
      } else {
        const data = await api.getReports();
        setReports(data);
      }
    } catch (e: any) {
      setMsg(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [activeTab, date]);

  const handleGenerateDaily = async () => {
    setLoading(true);
    try {
      await api.generateDailyReport({ date });
      setMsg('✅ Daily coverage report generated (8AM slot)');
      loadData();
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const handleGenerateNightShift = async () => {
    setLoading(true);
    try {
      await api.generateNightShiftReport({ date });
      setMsg('✅ Night shift report generated (1PM slot)');
      loadData();
    } catch (e: any) { setMsg(e.message); }
    setLoading(false);
  };

  const getBadge = (pct: number) => {
    if (pct >= 90) return 'badge-success';
    if (pct >= 70) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileBarChart size={24} /> Deployment Reports
        </h1>
        <div className="page-header-actions" style={{ flexWrap: 'wrap' }}>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ width: '160px' }} />
          <button className="btn btn-primary btn-sm" onClick={handleGenerateDaily} disabled={loading}>
            <Clock size={14} /> 8AM Report
          </button>
          <button className="btn btn-warning btn-sm" onClick={handleGenerateNightShift} disabled={loading}>
            <Clock size={14} /> 1PM Night Report
          </button>
        </div>
      </div>

      {msg && <div className={`message ${msg.startsWith('✅') ? 'message-success' : 'message-error'}`} onClick={() => setMsg('')}>{msg}</div>}

      <div className="tabs">
        {(['coverage', 'callcard', 'absent', 'history'] as const).map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'coverage' ? 'Site Coverage' : tab === 'callcard' ? 'Call Card' : tab === 'absent' ? 'Absent Guards' : 'Report History'}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>}

      {/* Coverage Tab */}
      {!loading && activeTab === 'coverage' && coverage && (
        <div>
          <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Total Guards Required</div>
              <div className="stat-value">{coverage.totalGuards}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Deployed</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{coverage.deployedGuards}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Overall Coverage</div>
              <div className="stat-value">{coverage.coveragePercent}%</div>
              <span className={`badge ${getBadge(coverage.coveragePercent)}`}>{coverage.coveragePercent >= 90 ? 'Good' : coverage.coveragePercent >= 70 ? 'Fair' : 'Low'}</span>
            </div>
            <div className="stat-card">
              <div className="stat-label">Absent Guards</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{coverage.absentGuards?.length || 0}</div>
            </div>
          </div>

          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Coverage per Site</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Required</th>
                  <th>Deployed</th>
                  <th>Coverage</th>
                  <th>Officers</th>
                </tr>
              </thead>
              <tbody>
                {coverage.siteCoverage?.map((sc: any) => (
                  <tr key={sc.siteId}>
                    <td style={{ fontWeight: 600 }}><MapPin size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />{sc.siteName}</td>
                    <td>{sc.required}</td>
                    <td>{sc.deployed}</td>
                    <td><span className={`badge ${getBadge(sc.coveragePercent)}`}>{sc.coveragePercent}%</span></td>
                    <td>
                      {sc.officers?.map((o: any, i: number) => (
                        <span key={i} className="badge badge-info" style={{ marginRight: '0.25rem', marginBottom: '0.15rem' }}>{o.guardName} ({o.shift})</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Call Card Tab */}
      {!loading && activeTab === 'callcard' && callCard && (
        <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--info-glow)' }}><MapPin size={20} color="var(--info)" /></div>
            <div className="stat-label">Total Sites</div>
            <div className="stat-value">{callCard.totalSites}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-glow)' }}><Users size={20} color="var(--accent-light)" /></div>
            <div className="stat-label">Total Posts</div>
            <div className="stat-value">{callCard.totalPosts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-glow)' }}><CheckCircle size={20} color="var(--success)" /></div>
            <div className="stat-label">Posts Filled</div>
            <div className="stat-value">{callCard.filledPosts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-glow)' }}><TrendingUp size={20} color="var(--warning)" /></div>
            <div className="stat-label">Coverage %</div>
            <div className="stat-value">{callCard.coveragePercent}%</div>
            <span className={`badge ${getBadge(callCard.coveragePercent)}`}>{callCard.coveragePercent >= 90 ? 'Excellent' : callCard.coveragePercent >= 70 ? 'Fair' : 'Critical'}</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Day Shift Active</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{callCard.activeDayShift}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Night Shift Active</div>
            <div className="stat-value" style={{ color: 'var(--info)' }}>{callCard.activeNightShift}</div>
          </div>
        </div>
      )}

      {/* Absent Guards Tab */}
      {!loading && activeTab === 'absent' && (
        <div>
          {absentGuards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckCircle size={40} opacity={0.3} /></div>
              <div className="empty-state-text">No absent guards for {date}</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Guard</th>
                    <th>Staff ID</th>
                    <th>Phone</th>
                    <th>Site</th>
                    <th>Shift</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absentGuards.map((g: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{g.guardName}</td>
                      <td>{g.staffId || '—'}</td>
                      <td>{g.phone || '—'}</td>
                      <td>{g.siteName}</td>
                      <td><span className="badge badge-info">{g.shift}</span></td>
                      <td><span className="badge badge-danger">{g.status?.replace(/_/g, ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {!loading && activeTab === 'history' && (
        <div>
          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileBarChart size={40} opacity={0.3} /></div>
              <div className="empty-state-text">No reports generated yet. Use the buttons above.</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Slot</th>
                    <th>Coverage</th>
                    <th>Deployed</th>
                    <th>Status</th>
                    <th>Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r: any) => (
                    <tr key={r.id}>
                      <td>{new Date(r.reportDate).toLocaleDateString()}</td>
                      <td><span className="badge badge-accent">{r.reportType?.replace(/_/g, ' ')}</span></td>
                      <td><span className="badge badge-info">{r.scheduleSlot || '—'}</span></td>
                      <td><span className={`badge ${getBadge(r.coveragePercent)}`}>{r.coveragePercent}%</span></td>
                      <td>{r.deployedGuards}/{r.totalGuards}</td>
                      <td><span className={`badge ${r.status === 'SENT' ? 'badge-success' : 'badge-neutral'}`}>{r.status}</span></td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
