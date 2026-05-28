'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { UserCheck, ArrowLeft, Save, Briefcase, Contact, CreditCard, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react';
import Link from 'next/link';

const emptyContact = { name: '', phone: '', relationship: '', type: 'EMERGENCY' };

export default function GuardProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState([emptyContact]);

  const [form, setForm] = useState({
    contractRef: '',
    monthlySalary: 0,
    leaveBalance: 21,
    isPermanent: false,
    weaponAuthorised: false,
    references: '',
    paymentMode: 'CASH',
    bankName: '',
    accountNumber: '',
    mobileMoneyNumber: '',
  });

  const canEditSensitive = useMemo(() => ['ADMIN', 'CEO', 'HR'].includes(user?.role || ''), [user]);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const data = await api.getGuardProfile(id);
      setProfile(data);

      const p = data.guardProfile || {};
      let bank = { bankName: '', accountNumber: '' };
      try { if (p.bankDetails) bank = JSON.parse(p.bankDetails); } catch (e) {}

      let refs = '';
      try { if (p.references) refs = JSON.parse(p.references).map((r: any) => `${r.name} (${r.phone} - ${r.relationship})`).join('\n'); } catch (e) {}

      let parsedContacts: any[] = [];
      if (typeof data.emergencyContact === 'string') {
        try {
          const parsed = JSON.parse(data.emergencyContact);
          parsedContacts = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          parsedContacts = [];
        }
      }

      setEmergencyContacts(parsedContacts.length > 0 ? parsedContacts : [emptyContact]);
      setForm({
        contractRef: p.contractRef || '',
        monthlySalary: p.monthlySalary || 0,
        leaveBalance: p.leaveBalance || 21,
        isPermanent: !!p.isPermanent,
        weaponAuthorised: !!p.weaponAuthorised,
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

  const updateContact = (index: number, field: string, value: string) => {
    setEmergencyContacts((current) => current.map((contact, idx) => idx === index ? { ...contact, [field]: value } : contact));
  };

  const addContact = () => {
    setEmergencyContacts((current) => [...current, { ...emptyContact }]);
  };

  const removeContact = (index: number) => {
    setEmergencyContacts((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const bankDetails = JSON.stringify({
        bankName: form.bankName,
        accountNumber: form.accountNumber,
      });

      const refsArray = form.references.split('\n').filter((row) => row.trim()).map((row) => {
        const name = row.split('(')[0]?.trim();
        return { name, raw: row };
      });
      const references = JSON.stringify(refsArray);

      await api.upsertGuardProfile(id, {
        contractRef: form.contractRef,
        monthlySalary: form.monthlySalary,
        leaveBalance: form.leaveBalance,
        isPermanent: form.isPermanent,
        weaponAuthorised: form.weaponAuthorised,
        nextOfKin: JSON.stringify(emergencyContacts.filter((contact) => contact.name || contact.phone || contact.relationship)),
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
            <input className="input" value={form.contractRef} onChange={(e) => setForm((current) => ({ ...current, contractRef: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="label">Monthly Salary (UGX)</label>
              <input type="number" className="input" value={form.monthlySalary} onChange={(e) => setForm((current) => ({ ...current, monthlySalary: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Leave Balance (Days)</label>
              <input type="number" className="input" value={form.leaveBalance} onChange={(e) => setForm((current) => ({ ...current, leaveBalance: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.isPermanent} onChange={(e) => setForm((current) => ({ ...current, isPermanent: e.target.checked }))} />
              Permanent Employee
            </label>
          </div>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
            <ShieldCheck size={14} color={canEditSensitive ? 'var(--success)' : 'var(--warning)'} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {canEditSensitive ? 'Sensitive controls unlocked for HR/Admin.' : 'Read-only mode for restricted roles.'}
            </span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.weaponAuthorised} onChange={(e) => setForm((current) => ({ ...current, weaponAuthorised: e.target.checked }))} disabled={!canEditSensitive} />
              <span className="badge badge-danger">Weapon Authorised</span>
            </label>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Contact size={16} /> Emergency Contacts
            </h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={addContact}>
              <Plus size={13} /> Add Contact
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {emergencyContacts.map((contact, index) => (
              <div key={index} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Contact {index + 1}</div>
                  {emergencyContacts.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeContact(index)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label className="label">Name</label>
                    <input className="input" placeholder="Contact name" value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Relationship</label>
                    <input className="input" placeholder="Spouse / Parent" value={contact.relationship} onChange={(e) => updateContact(index, 'relationship', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input className="input" placeholder="0700000000" value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>References (one per line)</div>
            <textarea className="input" rows={4} placeholder="John Doe (077XXXX - Uncle)" value={form.references} onChange={(e) => setForm((current) => ({ ...current, references: e.target.value }))} />
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={16} /> Payment Preferences
          </h3>
          <div style={{ marginBottom: '1rem', maxWidth: '300px' }}>
            <label className="label">Payment Mode</label>
            <select className="input" value={form.paymentMode} onChange={(e) => setForm((current) => ({ ...current, paymentMode: e.target.value }))}>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          {form.paymentMode === 'BANK_TRANSFER' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Bank Name</label>
                <input className="input" value={form.bankName} onChange={(e) => setForm((current) => ({ ...current, bankName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Account Number</label>
                <input className="input" value={form.accountNumber} onChange={(e) => setForm((current) => ({ ...current, accountNumber: e.target.value }))} />
              </div>
            </div>
          )}

          {form.paymentMode === 'MOBILE_MONEY' && (
            <div style={{ marginBottom: '1rem', maxWidth: '300px' }}>
              <label className="label">Mobile Money Number</label>
              <input className="input" value={form.mobileMoneyNumber} onChange={(e) => setForm((current) => ({ ...current, mobileMoneyNumber: e.target.value }))} />
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
