'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Package, Truck, ShoppingCart, CheckCircle2, Clock, AlertCircle, Loader2, Plus, Search, Filter } from 'lucide-react';

export default function ProcurementPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'SUPPLIERS' | 'ORDERS'>('REQUESTS');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'REQUESTS') {
        const data = await api.getPurchaseRequests();
        setRequests(data);
      } else if (activeTab === 'SUPPLIERS') {
        const data = await api.getSuppliers();
        setSuppliers(data);
      }
      // Orders tab can be added similarly
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="badge badge-success">Approved</span>;
      case 'REJECTED': return <span className="badge badge-danger">Rejected</span>;
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      case 'ORDERED': return <span className="badge badge-info">Ordered</span>;
      case 'DELIVERED': return <span className="badge" style={{ background: 'var(--success)', color: 'white' }}>Delivered</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingCart size={28} className="text-accent" />
            Procurement Management
          </h1>
          <p className="text-muted">Manage purchase requests, orders, and supplier relationships.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button className={`btn tab-btn ${activeTab === 'REQUESTS' ? 'active' : ''}`} onClick={() => setActiveTab('REQUESTS')}>
          <Clock size={16} /> Purchase Requests
        </button>
        <button className={`btn tab-btn ${activeTab === 'ORDERS' ? 'active' : ''}`} onClick={() => setActiveTab('ORDERS')}>
          <Truck size={16} /> Purchase Orders
        </button>
        <button className={`btn tab-btn ${activeTab === 'SUPPLIERS' ? 'active' : ''}`} onClick={() => setActiveTab('SUPPLIERS')}>
          <Package size={16} /> Suppliers
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><Loader2 className="animate-spin text-muted" /></div>
        ) : activeTab === 'REQUESTS' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Priority</th>
                <th>Item Details</th>
                <th>Department</th>
                <th>Estimated Cost</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td className="font-mono text-xs fw-600">REQ-{req.id.substring(0, 8)}</td>
                  <td>
                    <span className={`badge ${req.priority === 'URGENT' ? 'badge-danger' : req.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td>
                    <div className="fw-600">{req.itemName}</div>
                    <div className="text-xs text-muted">Qty: {req.quantity} {req.unit}</div>
                  </td>
                  <td className="text-sm">{req.department}</td>
                  <td className="font-mono text-sm">UGX {req.estimatedCost?.toLocaleString()}</td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm">Details</button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>No purchase requests found</td></tr>
              )}
            </tbody>
          </table>
        ) : activeTab === 'SUPPLIERS' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Category</th>
                <th>Contact Person</th>
                <th>Email / Phone</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="fw-600">{s.name}</td>
                  <td className="text-sm">{s.category}</td>
                  <td className="text-sm">{s.contactPerson}</td>
                  <td>
                    <div className="text-xs">{s.email}</div>
                    <div className="text-xs text-muted">{s.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} style={{ color: i <= (s.rating || 0) ? 'var(--warning)' : 'var(--border)' }}>★</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>No suppliers found</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-state-icon"><Truck size={48} opacity={0.2} /></div>
            <div className="empty-state-text">No active purchase orders found</div>
          </div>
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
