'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, ArrowRight, LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const routes: Record<string, string> = {
        CEO: '/dashboard', REGIONAL_MANAGER: '/regional',
        HR: '/hr/guards', FINANCE: '/finance', ARMOURY_OFFICER: '/armoury',
        PROCUREMENT_OFFICER: '/procurement', LOGISTICS_OFFICER: '/logistics',
        FOOD_SUPPLIER: '/food-supplier',
        GUARD: '/guard', CLIENT: '/client', SUPERVISOR: '/supervisor',
        M_AND_E: '/analytics', ADMIN: '/dashboard', OPS_MANAGER: '/dashboard',
      };
      router.push(routes[user.role] || '/dashboard');
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '0.75rem' }}>
        <LoaderCircle size={20} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #060a14 0%, #0c1222 40%, #111827 70%, #0f172a 100%)',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="animate-float" style={{
            width: '72px', height: '72px', background: 'var(--accent-gradient)', borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
            boxShadow: '0 8px 30px var(--accent-glow)',
          }}><Shield size={34} color="white" strokeWidth={1.5} /></div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span className="gradient-text">SecureGuard</span>{' '}
            <span style={{ color: 'var(--text-primary)' }}>Pro</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
            Enterprise Security Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="message message-error">{error}</div>}

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label" htmlFor="login-email" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Mail size={13} /> Email Address
              </label>
              <input
                id="login-email" type="email" className="input"
                placeholder="you@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" htmlFor="login-password" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Lock size={13} /> Password
              </label>
              <input
                id="login-password" type="password" className="input"
                placeholder="Enter your password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password"
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}
              style={{ width: '100%', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isLoading ? (
                <><LoaderCircle size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
