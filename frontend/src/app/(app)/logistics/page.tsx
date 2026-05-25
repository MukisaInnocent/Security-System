'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Package, Truck, MapPin, Search, AlertCircle, Loader2, Plus, Box, RotateCcw } from 'lucide-react';

export default function LogisticsPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  useEffect(() => {
    api.getSites().then(s => {
      setSites(s);
      if (s.length > 0) setSelectedSiteId(s[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadInventory();
    }
  }, [selectedSiteId]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getSiteInventory(selectedSiteId);
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number, low: number) => {
    if (stock <= 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (stock <= low) return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Box size={28} className="text-accent" />
            Logistics & Inventory
          </h1>
          <p className="text-muted">Monitor site equipment levels and manage distributions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => setShowDistributeModal(true)}>
            <Truck size={16} /> New Distribution
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <label className="label">Current Site View</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select 
              className="input" 
              style={{ paddingLeft: '2.5rem' }}
              value={selectedSiteId} 
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div className="text-center">
            <div className="text-sm text-muted mb-1">Low Stock Items</div>
            <div className="fw-800 text-xl text-danger">{inventory.filter(i => i.currentQuantity <= i.lowStockThreshold).length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted mb-1">Total Assets</div>
            <div className="fw-800 text-xl">{inventory.reduce((sum, item) => sum + item.currentQuantity, 0)}</div>
          </div>
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
                <th>Asset Type</th>
                <th>Current Stock</th>
                <th>Low Threshold</th>
                <th>Status</th>
                <th>Last Refill</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="fw-600">{item.itemType}</div>
                    <div className="text-xs text-muted">Category: Equipment</div>
                  </td>
                  <td className="font-mono">{item.currentQuantity}</td>
                  <td className="text-muted font-mono">{item.lowStockThreshold}</td>
                  <td>{getStockStatus(item.currentQuantity, item.lowStockThreshold)}</td>
                  <td className="text-sm text-muted">
                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" title="Request Refill">
                      <RotateCcw size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>No inventory records for this site</td></tr>
              )}
            </tbody>
          </table>
</div>
        )}
      </div>

      {showDistributeModal && (
        <div className="modal-backdrop" onClick={() => setShowDistributeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Distribute Assets</h2>
            <p className="text-sm text-muted mb-4">Record equipment being sent to a site from HQ.</p>
            <div className="flex flex-col gap-4">
              <div><label className="label">Receiving Site</label><select className="input">{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="label">Item Type</label><select className="input"><option>UNIFORM</option><option>BOOTS</option><option>BATON</option><option>TORCH</option><option>RADIO</option></select></div>
              <div><label className="label">Quantity</label><input type="number" className="input" defaultValue="1" /></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}>Confirm Distribution</button>
                <button className="btn btn-outline" onClick={() => setShowDistributeModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
