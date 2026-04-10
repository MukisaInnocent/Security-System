'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Utensils, Users, CheckCircle2, QrCode, Loader2, MapPin, Search, ShieldCheck } from 'lucide-react';

export default function FoodSupplierPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [headcount, setHeadcount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    // Supplier's sites are linked in backend; fetch all allowed sites
    api.getSites().then(setSites).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadHeadcount();
    }
  }, [selectedSiteId]);

  const loadHeadcount = async () => {
    setLoading(true);
    try {
      const data = await api.getFoodSupplierHeadcount(selectedSiteId);
      setHeadcount(data.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !selectedSiteId) return;
    
    setVerifying(true);
    try {
      const result = await api.verifyMeal({
        siteId: selectedSiteId,
        staffId,
        mealType: 'LUNCH' // Default for demo
      });
      setVerificationResult(result);
      setStaffId('');
      loadHeadcount();
      setTimeout(() => setVerificationResult(null), 5000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Utensils size={28} className="text-accent" />
            Food Supplier Portal
          </h1>
          <p className="text-muted">Headcount-based meal delivery and biometric verification.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div className="text-sm text-muted mb-2">Live On-Duty Headcount</div>
          <div className="flex justify-center items-center gap-4">
            <Users size={48} className="text-accent" />
            <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1 }}>{loading ? '...' : headcount}</div>
          </div>
          <div className="text-xs text-muted mt-4">Authorized guards signed in at site</div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={18} /> Biometric Verification
          </h2>
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="label">Delivery Site</label>
              <select 
                className="input" 
                value={selectedSiteId} 
                onChange={(e) => setSelectedSiteId(e.target.value)}
                required
              >
                <option value="">-- Choose Site --</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Guard Staff ID (SIMULATED SCAN)</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input" 
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Scan or enter Staff ID..."
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  disabled={!selectedSiteId || verifying}
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={!selectedSiteId || verifying}>
              {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {verifying ? 'Verifying...' : 'Confirm Meal Pick-up'}
            </button>
          </form>

          {verificationResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 fade-in ${verificationResult.success ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`} 
              style={{ border: '1px solid', background: verificationResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              <div style={{ color: verificationResult.success ? 'var(--success)' : 'var(--danger)' }}>
                {verificationResult.success ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{verificationResult.message}</div>
                {verificationResult.guardName && <div className="text-xs">{verificationResult.guardName}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Recent Deliveries</h2>
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div className="text-muted">No completed delivery sessions found today</div>
        </div>
      </div>
    </div>
  );
}
