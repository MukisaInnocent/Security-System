'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Wallet, BadgeDollarSign, Filter, Loader2, CheckCircle2, AlertCircle, FileText, TrendingUp, CalendarDays, User } from 'lucide-react';

export default function PayrollPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    loadPayroll();
  }, [month, year]);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await api.getPayrollRecords(month, year);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!confirm(`Generate payroll for ${month}/${year}? This will calculate salaries based on verified shifts.`)) return;
    setGenerating(true);
    try {
      await api.generatePayrollRun({ month, year });
      alert('Payroll calculated successfully for all eligible personnel.');
      loadPayroll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await api.approvePayroll(id);
      loadPayroll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wallet size={28} className="text-accent" />
            Payroll & Disbursements
          </h1>
          <p className="text-muted">Monthly salary calculations and automated payslip generation.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={handleGeneratePayroll} disabled={generating}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            {generating ? 'Processing...' : 'Run Payroll Generation'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <CalendarDays size={16} className="text-muted" />
          <span className="text-sm fw-600">Period:</span>
          <select className="input input-sm" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
          <select className="input input-sm" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem', display: 'flex', gap: '2rem' }}>
          <div className="text-center">
            <div className="text-xs text-muted mb-1">Total Payroll</div>
            <div className="fw-700">UGX {records.reduce((sum, r) => sum + (r.netPay || 0), 0).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted mb-1">Personnel</div>
            <div className="fw-700">{records.length} Guards</div>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><Loader2 className="animate-spin text-muted" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Guard Name</th>
                <th>Monthly Rate</th>
                <th>Shifts Worked</th>
                <th>Overtime</th>
                <th>Total Pay</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="fw-600">{r.guard?.name}</div>
                    <div className="text-xs text-muted">{r.guard?.staffId} • {r.guard?.role}</div>
                  </td>
                  <td className="font-mono text-sm">UGX {r.monthlySalary?.toLocaleString()}</td>
                  <td className="text-center">
                    <div className="fw-700">{r.totalShiftsWorked}</div>
                    <div className="text-xs text-muted">Daily: {Math.round(r.dailyRate || 0).toLocaleString()}</div>
                  </td>
                  <td className="text-center">
                    <div className="fw-700">{r.overtimeShifts}</div>
                  </td>
                  <td className="font-mono fw-700 text-accent">UGX {r.netPay?.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {r.status === 'DRAFT' ? (
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleApprove(r.id)}
                        disabled={approvingId === r.id}
                      >
                        {approvingId === r.id ? <Loader2 size={12} className="animate-spin" /> : 'Approve & Lock'}
                      </button>
                    ) : (
                      <button className="btn btn-ghost btn-sm">
                        <FileText size={14} /> Payslip
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No payroll records for this period</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
