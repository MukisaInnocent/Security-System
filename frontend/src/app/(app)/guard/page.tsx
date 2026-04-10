'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import {
  LogIn, LogOut, TriangleAlert, Clock, MapPin, Fingerprint,
  CheckCircle2, XCircle, Circle, CloudOff, Loader2,
  ListVideo, CalendarDays, ShieldAlert, Briefcase
} from 'lucide-react';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
const SEVERITY_MAP: Record<Severity, string> = {
  LOW: 'badge-neutral', MEDIUM: 'badge-info', HIGH: 'badge-warning', CRITICAL: 'badge-danger',
};

export default function GuardPage() {
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gLocation, setGLocation] = useState<GeolocationCoordinates | null>(null);
  const [checking, setChecking] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ description: '', severity: 'MEDIUM' as Severity, siteId: '' });
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [incidentFile, setIncidentFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('DUTY');
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = () => {
    api.getGuardDashboard().then(setDashData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => setGLocation(pos.coords), () => {});
    }
  }, []);

  const handleCheckIn = async () => {
    if (!gLocation) { showMsg('error', 'Location access required for check-in.'); return; }
    if (!dashData?.todayDeployment) { showMsg('error', 'No active deployment found for today.'); return; }
    setChecking(true);
    try {
      await api.checkIn({ siteId: dashData.todayDeployment.siteId, deploymentId: dashData.todayDeployment.id, latitude: gLocation.latitude, longitude: gLocation.longitude });
      showMsg('success', 'Checked in successfully!');
      load();
    } catch (e: any) { showMsg('error', e.message); }
    finally { setChecking(false); }
  };

  const handleCheckOut = async () => {
    if (!gLocation) { showMsg('error', 'Location access required for check-out.'); return; }
    if (!dashData?.todayDeployment) { showMsg('error', 'No active deployment found for today.'); return; }
    setChecking(true);
    try {
      await api.checkOut({ siteId: dashData.todayDeployment.siteId, deploymentId: dashData.todayDeployment.id, latitude: gLocation.latitude, longitude: gLocation.longitude });
      showMsg('success', 'Checked out successfully!');
      load();
    } catch (e: any) { showMsg('error', e.message); }
    finally { setChecking(false); }
  };

  const handleReportIncident = async () => {
    if (!incidentForm.description.trim()) { showMsg('error', 'Description required.'); return; }
    setSubmittingIncident(true);
    try {
      if (incidentFile) {
        const fd = new FormData();
        fd.append('description', incidentForm.description);
        fd.append('severity', incidentForm.severity);
        fd.append('siteId', incidentForm.siteId || dashData?.todayDeployment?.siteId || '');
        if (gLocation) { fd.append('latitude', String(gLocation.latitude)); fd.append('longitude', String(gLocation.longitude)); }
        fd.append('media', incidentFile);
        await api.createIncident(fd);
      } else {
        await api.createIncident({ ...incidentForm, siteId: incidentForm.siteId || dashData?.todayDeployment?.siteId || '', latitude: gLocation?.latitude, longitude: gLocation?.longitude });
      }
      showMsg('success', 'Incident reported successfully!');
      setShowIncidentModal(false);
      setIncidentForm({ description: '', severity: 'MEDIUM', siteId: '' });
      setIncidentFile(null);
      load();
    } catch (e: any) { showMsg('error', e.message); }
    finally { setSubmittingIncident(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
        <Loader2 size={20} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Loading guard panel...</span>
      </div>
    );
  }

  const dep = dashData?.todayDeployment;
  const hasCheckedIn = dashData?.todayAttendance?.some((a: any) => a.type === 'CHECK_IN');
  const hasCheckedOut = dashData?.todayAttendance?.some((a: any) => a.type === 'CHECK_OUT');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>Guard Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={12} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {message && <div className={`message message-${message.type}`}>{message.text}</div>}

      {/* GPS Status */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <MapPin size={16} color={gLocation ? 'var(--success)' : 'var(--danger)'} />
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: gLocation ? 'var(--success)' : 'var(--danger)' }}>
            {gLocation ? 'GPS Active' : 'GPS Unavailable'}
          </div>
          {gLocation && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {gLocation.latitude.toFixed(5)}, {gLocation.longitude.toFixed(5)}
            </div>
          )}
        </div>
        {!gLocation && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Enable location to check in
          </span>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
        {['DUTY', 'LEAVE', 'PAYROLL', 'SPECIAL'].map(tab => (
          <button 
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: '0.7rem' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'DUTY' && (
        <div className="fade-in">
          {/* Today's Deployment */}
          {dep ? (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CalendarDays size={14} color="var(--accent-light)" /> Today's Assignment
                </h3>
                <span className={`badge ${dep.status === 'ACTIVE' ? 'badge-success' : dep.status === 'COMPLETED' ? 'badge-neutral' : 'badge-info'}`}>
                  {dep.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <MapPin size={13} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dep.site?.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Clock size={13} color="var(--text-muted)" />
                  {dep.shiftStart} – {dep.shiftEnd}
                </div>
                {dep.site?.address && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={11} /> {dep.site.address}
                  </div>
                )}
              </div>

              {/* Attendance status indicators */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: hasCheckedIn ? 'var(--success)' : 'var(--text-muted)' }}>
                  {hasCheckedIn ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                  Checked In
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: hasCheckedOut ? 'var(--success)' : 'var(--text-muted)' }}>
                  {hasCheckedOut ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                  Checked Out
                </div>
              </div>

              {/* Check-in / Check-out buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button className="btn btn-success" onClick={handleCheckIn} disabled={checking || hasCheckedIn}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.65rem' }}>
                  {checking ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={14} />}
                  {hasCheckedIn ? 'Checked In' : 'Check In'}
                </button>
                <button className="btn btn-outline" onClick={handleCheckOut} disabled={checking || !hasCheckedIn || hasCheckedOut}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.65rem' }}>
                  {checking ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={14} />}
                  {hasCheckedOut ? 'Checked Out' : 'Check Out'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem', marginBottom: '1rem' }}>
              <CalendarDays size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>No deployment scheduled today</div>
            </div>
          )}

          {/* Report Incident button */}
          <button className="btn btn-danger" style={{ width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}
            onClick={() => setShowIncidentModal(true)}>
            <ShieldAlert size={16} /> Report Incident
          </button>

          {/* Recent Attendance */}
          {dashData?.todayAttendance?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ListVideo size={14} color="var(--accent-light)" /> Activity Log
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {dashData.todayAttendance.map((a: any) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      {a.type === 'CHECK_IN' ? <LogIn size={13} color="var(--success)" /> : <LogOut size={13} color="var(--info)" />}
                      {a.type === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'LEAVE' && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Apply for Leave</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="label">Leave Type</label>
                <select className="input" value={leaveForm.leaveType} onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
                  <option value="ANNUAL">Annual</option><option value="SICK">Sick</option><option value="EMERGENCY">Emergency</option><option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><label className="label">Start Date</label><input type="date" className="input" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} /></div>
                <div><label className="label">End Date</label><input type="date" className="input" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} /></div>
              </div>
              <div><label className="label">Reason</label><textarea className="input" rows={2} placeholder="Brief reason for leave..." value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} /></div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submittingLeave || !leaveForm.startDate || !leaveForm.endDate}
                onClick={async () => {
                  setSubmittingLeave(true);
                  try {
                    await api.createLeaveRequest({ leaveType: leaveForm.leaveType, startDate: leaveForm.startDate, endDate: leaveForm.endDate, reason: leaveForm.reason });
                    showMsg('success', 'Leave request submitted!');
                    setLeaveForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
                    load();
                  } catch (e: any) { showMsg('error', e.message); }
                  finally { setSubmittingLeave(false); }
                }}>
                {submittingLeave ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
          <div className="card">
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Past Requests</h4>
            {dashData?.leaveRequests?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {dashData.leaveRequests.map((lr: any) => (
                  <div key={lr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{lr.leaveType}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(lr.startDate).toLocaleDateString()} – {new Date(lr.endDate).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge ${lr.status === 'APPROVED' ? 'badge-success' : lr.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{lr.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No recent leave history</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'PAYROLL' && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: '1rem', background: 'var(--accent-gradient)', color: 'white' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Current Month Running Total</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.5rem 0' }}>UGX {dashData?.payrollSummary?.runningTotal?.toLocaleString() || '0'}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.8, paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <span>Shifts Verified: {dashData?.payrollSummary?.shiftsWorked || 0}</span>
              <span>Daily Rate: {Math.round(dashData?.payrollSummary?.dailyRate || 0).toLocaleString()}</span>
            </div>
          </div>
          {dashData?.payrollSummary?.specialDutyTotal > 0 && (
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Special Duty Earnings</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)' }}>UGX {dashData.payrollSummary.specialDutyTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Payroll Status</h3>
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {dashData?.payrollSummary?.status === 'DRAFT' ? 'Payroll is being prepared for this month.' : dashData?.payrollSummary?.status === 'APPROVED' ? 'Payroll approved and awaiting payment.' : dashData?.payrollSummary?.status === 'PAID' ? 'This month payroll has been processed.' : 'No payroll record for this month yet.'}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SPECIAL' && (
        <div className="fade-in">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Duty Invitations</h3>
          {dashData?.specialDuties?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dashData.specialDuties.map((sp: any) => (
                <div key={sp.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sp.specialDuty?.title}</div>
                    <span className={`badge ${sp.confirmStatus === 'CONFIRMED' ? 'badge-success' : sp.confirmStatus === 'DECLINED' ? 'badge-danger' : 'badge-warning'}`}>{sp.confirmStatus}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {sp.specialDuty?.location} — {new Date(sp.specialDuty?.date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {sp.specialDuty?.startTime} – {sp.specialDuty?.endTime} — UGX {sp.specialDuty?.paymentPerPerson?.toLocaleString()}
                  </div>
                  {sp.confirmStatus === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={async () => {
                        try { await api.respondToSpecialDuty(sp.specialDutyId, true); showMsg('success', 'Confirmed!'); load(); } catch (e: any) { showMsg('error', e.message); }
                      }}>Accept</button>
                      <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={async () => {
                        try { await api.respondToSpecialDuty(sp.specialDutyId, false, 'Not available'); showMsg('success', 'Declined'); load(); } catch (e: any) { showMsg('error', e.message); }
                      }}>Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Briefcase size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No special duty invitations at this time</div>
            </div>
          )}
        </div>
      )}


      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="modal-backdrop" onClick={() => setShowIncidentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <TriangleAlert size={18} color="var(--warning)" /> Report Incident
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <TriangleAlert size={12} /> Severity
                </label>
                <select className="input" value={incidentForm.severity}
                  onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value as Severity })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={4} value={incidentForm.description} placeholder="Describe the incident..."
                  onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} />
              </div>
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Fingerprint size={12} /> Evidence (Photo/Video)
                </label>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                  onChange={e => setIncidentFile(e.target.files?.[0] || null)} />
                <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                  {incidentFile ? incidentFile.name : 'Attach File'}
                </button>
              </div>
              {gLocation && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={11} color="var(--success)" /> GPS attached: {gLocation.latitude.toFixed(5)}, {gLocation.longitude.toFixed(5)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleReportIncident} disabled={submittingIncident}>
                  {submittingIncident ? 'Submitting...' : 'Submit Report'}
                </button>
                <button className="btn btn-outline" onClick={() => setShowIncidentModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
