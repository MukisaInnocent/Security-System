'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { UserCheck, ArrowLeft, Save, Briefcase, MapPin, Contact, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function GuardProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [msg, setMsg] = useState('');
  
  const [form, setForm] = useState({
    contractRef: '',
    monthlySalary: 0,
    leaveBalance: 21,
    isPermanent: false,
    weaponAuthorised: false,
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRel: '',
    references: '',
    paymentMode: 'CASH',
    bankName: '',
    accountNumber: '',
    mobileMoneyNumber: '',
  });

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const data = await api.getGuardProfile(id);
      setProfile(data);
      
      const p = data.guardProfile || {};
      let nok = { name: '', phone: '', relationship: '' };
      try { if (p.nextOfKin) nok = JSON.parse(p.nextOfKin); } catch (e) {}
      
      let bank = { bankName: '', accountNumber: '' };
      try { if (p.bankDetails) bank = JSON.parse(p.bankDetails); } catch (e) {}
      
      let refs = '';
      try { if (p.references) refs = JSON.parse(p.references).map((r: any) => `${r.name} (${r.phone} - ${r.relationship})`).join('\n'); } catch (e) {}

      setForm({
        contractRef: p.contractRef || '',
        monthlySalary: p.monthlySalary || 0,
        leaveBalance: p.leaveBalance || 21,
        isPermanent: !!p.isPermanent,
        weaponAuthorised: !!p.weaponAuthorised,
        nextOfKinName: nok.name || '',
        nextOfKinPhone: nok.phone || '',
        nextOfKinRel: nok.relationship || '',
        references: refs,
        paymentMode: p.paymentMode || 'CASH',
        bankName: bank.bankName || '',
        accountNumber: bank.accountNumber || '',
        mobileMoneyNumber: p.mobileMoneyNumber || '',
      });
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const nextOfKin = JSON.stringify({
        name: form.nextOfKinName,
        phone: form.nextOfKinPhone,
        relationship: form.nextOfKinRel,
      });
      
      const bankDetails = JSON.stringify({
        bankName: form.bankName,
        accountNumber: form.accountNumber,
      });
      
      // Parse simple multiline references
      const refsArray = form.references.split('\n').filter(r => r.trim()).map(r => {
        // Very basic parsing for demo
        const parts = r.split('(');
        const name = parts[0]?.trim();
        return { name, raw: r };
      });
      const references = JSON.stringify(refsArray);

      await api.upsertGuardProfile(id, {
        contractRef: form.contractRef,
        monthlySalary: form.monthlySalary,
        leaveBalance: form.leaveBalance,
        isPermanent: form.isPermanent,
        weaponAuthorised: form.weaponAuthorised,
        nextOfKin,
        references,
        paymentMode: form.paymentMode,
        bankDetails,
        mobileMoneyNumber: form.mobileMoneyNumber,
      });
      
      setMsg('✅ Guard profile updated successfully');
      loadProfile();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}/></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <Link href="/hr/guards" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to guards
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={24} /> Edit Guard Profile: {profile?.name}
          </h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Staff ID: {profile?.staffId || 'Not assigned'}</div>
        </div>
      </div>

      {msg && <div className={`message ${msg.startsWith('✅') ? 'message-success' : 'message-error'}`} onClick={() => setMsg('')}>{msg}</div>}

      <form onSubmit={handleSave} className="grid-2">
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={16} /> Employment Details
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Contract Ref</label>
            <input className="input" value={form.contractRef} onChange={e => setForm(f => ({ ...f, contractRef: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="label">Monthly Salary (UGX)</label>
              <input type="number" className="input" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Leave Balance (Days)</label>
              <input type="number" className="input" value={form.leaveBalance} onChange={e => setForm(f => ({ ...f, leaveBalance: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.isPermanent} onChange={e => setForm(f => ({ ...f, isPermanent: e.target.checked }))} />
              Permanent Employee
            </label>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'CEO' || user?.role === 'ARMOURY_OFFICER') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.weaponAuthorised} onChange={e => setForm(f => ({ ...f, weaponAuthorised: e.target.checked }))} />
                <span className="badge badge-danger">Weapon Authorised</span>
              </label>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Contact size={16} /> URSB BRAP / Personal Details
          </h3>
          <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Next of Kin</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input className="input" placeholder="Name" value={form.nextOfKinName} onChange={e => setForm(f => ({ ...f, nextOfKinName: e.target.value }))} />
            <input className="input" placeholder="Relationship" value={form.nextOfKinRel} onChange={e => setForm(f => ({ ...f, nextOfKinRel: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input className="input" placeholder="Phone Number" value={form.nextOfKinPhone} onChange={e => setForm(f => ({ ...f, nextOfKinPhone: e.target.value }))} />
          </div>
          
          <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>References (one per line)</div>
          <textarea className="input" rows={3} placeholder="John Doe (077XXXX - Uncle)" value={form.references} onChange={e => setForm(f => ({ ...f, references: e.target.value }))} />
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={16} /> Payment Preferences
          </h3>
          <div style={{ marginBottom: '1rem', maxWidth: '300px' }}>
            <label className="label">Payment Mode</label>
            <select className="input" value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          
          {form.paymentMode === 'BANK_TRANSFER' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Bank Name</label>
                <input className="input" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Account Number</label>
                <input className="input" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
              </div>
            </div>
          )}
          
          {form.paymentMode === 'MOBILE_MONEY' && (
            <div style={{ marginBottom: '1rem', maxWidth: '300px' }}>
              <label className="label">Mobile Money Number</label>
              <input className="input" value={form.mobileMoneyNumber} onChange={e => setForm(f => ({ ...f, mobileMoneyNumber: e.target.value }))} />
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => router.push('/hr/guards')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
