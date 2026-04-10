'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CalendarDays, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Search, Filter } from 'lucide-react';

export default function HRLeavePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaveRequests(statusFilter === 'ALL' ? undefined : statusFilter);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    setProcessingId(id);
    try {
      await api.approveLeaveRequest(id, approved);
      loadRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="badge badge-success"><CheckCircle2 size={12}/> Approved</span>;
      case 'REJECTED': return <span className="badge badge-danger"><XCircle size={12}/> Rejected</span>;
      case 'PENDING': return <span className="badge badge-warning"><Clock size={12}/> Pending</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarDays size={28} className="text-accent" />
            Leave Management
          </h1>
          <p className="text-muted">Review and approve guard leave requests.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Filter size={16} className="text-muted" />
          <span className="text-sm fw-600">Filter Status:</span>
          <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
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
                <th>Leave Type</th>
                <th>Period</th>
                <th>Reason</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>
                    <div className="fw-600">{req.guard?.name}</div>
                    <div className="text-xs text-muted">{req.guard?.staffId}</div>
                  </td>
                  <td>
                    <span className="text-sm fw-500">{req.leaveType}</span>
                  </td>
                  <td>
                    <div className="text-sm">
                      {new Date(req.startDate).toLocaleDateString('en-GB')} - {new Date(req.endDate).toLocaleDateString('en-GB')}
                    </div>
                    <div className="text-xs text-muted">
                      {Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                      {req.reason}
                    </div>
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {req.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-success btn-sm" 
                          onClick={() => handleApprove(req.id, true)}
                          disabled={processingId === req.id}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleApprove(req.id, false)}
                          disabled={processingId === req.id}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted">
                        Processed by {req.approver?.name || 'System'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No leave requests found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
