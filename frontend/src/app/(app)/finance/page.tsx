'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BadgeDollarSign, FileCheck, FileText, Plus, Search, Loader2, CheckCircle2, AlertCircle, TrendingUp, Wallet } from 'lucide-react';

export default function FinancePage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CONTRACTS' | 'INVOICES'>('CONTRACTS');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'CONTRACTS') {
        const data = await api.getContracts();
        setContracts(data);
      } else {
        const data = await api.getInvoices();
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const resp = await api.generateInvoices();
      alert(`Successfully generated ${resp.generated} invoices for the previous period.`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success">Active</span>;
      case 'EXPIRED': return <span className="badge badge-danger">Expired</span>;
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      case 'PAID': return <span className="badge badge-success">Paid</span>;
      case 'DRAFT': return <span className="badge badge-info">Draft</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wallet size={28} className="text-accent" />
            Financial Operations
          </h1>
          <p className="text-muted">Manage client contracts, automated invoicing, and revenue tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'INVOICES' && (
            <button className="btn btn-outline" onClick={handleGenerateInvoices} disabled={generating}>
              {generating ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />} 
              {generating ? 'Generating...' : 'Auto-Generate Invoices'}
            </button>
          )}
          <button className="btn btn-primary">
            <Plus size={16} /> {activeTab === 'CONTRACTS' ? 'New Contract' : 'New Invoice'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button className={`btn tab-btn ${activeTab === 'CONTRACTS' ? 'active' : ''}`} onClick={() => setActiveTab('CONTRACTS')}>
          <FileCheck size={16} /> Client Contracts
        </button>
        <button className={`btn tab-btn ${activeTab === 'INVOICES' ? 'active' : ''}`} onClick={() => setActiveTab('INVOICES')}>
          <BadgeDollarSign size={16} /> Automated Invoices
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><Loader2 className="animate-spin text-muted" /></div>
        ) : activeTab === 'CONTRACTS' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Contract ID</th>
                <th>Billing Rate (Per Day)</th>
                <th>Start Date</th>
                <th>Expiry</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id}>
                  <td className="fw-700">{c.clientName}</td>
                  <td className="font-mono text-xs">{c.id.substring(0, 8)}</td>
                  <td className="font-mono">UGX {c.billingRatePerDay?.toLocaleString()}</td>
                  <td className="text-sm">{new Date(c.startDate).toLocaleDateString()}</td>
                  <td className="text-sm">
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Continuous'}
                  </td>
                  <td>{getStatusBadge(c.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>No contracts found</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(i => (
                <tr key={i.id}>
                  <td className="font-mono fw-700">INV-{i.invoiceNumber}</td>
                  <td>{i.clientName}</td>
                  <td className="text-sm">{new Date(i.billingPeriodStart).toLocaleDateString()} - {new Date(i.billingPeriodEnd).toLocaleDateString()}</td>
                  <td className="font-mono fw-600">UGX {i.totalAmount?.toLocaleString()}</td>
                  <td className="text-sm">{new Date(i.dueDate).toLocaleDateString()}</td>
                  <td>{getStatusBadge(i.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm">View PDF</button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>No invoices found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .tab-btn {
          padding: 1rem 1.5rem;
          border-radius: 0;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .tab-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.03); }
        .tab-btn.active { 
          color: var(--accent); 
          border-bottom: 2px solid var(--accent);
          background: rgba(99,102,241,0.05);
        }
      `}</style>
    </div>
  );
}
