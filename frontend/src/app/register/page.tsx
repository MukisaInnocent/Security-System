'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Building, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    companyCode: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create tenant and admin user
      const response = await fetch('/api/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to register company');
      }

      // Automatically login
      await api.login(formData.adminEmail, formData.adminPassword);
      setSuccess(true);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-3xl font-extrabold text-white">Welcome to the Platform!</h2>
          <p className="mt-2 text-slate-400">Your security operations center is ready. Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-500">
          <Shield className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Register Your Security Company
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Company Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-700 rounded-md bg-slate-800 text-white py-2"
                    placeholder="Acme Security Services"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Company Short Code</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-700 rounded-md bg-slate-800 text-white py-2 px-3 uppercase"
                    placeholder="ACME"
                    maxLength={10}
                    value={formData.companyCode}
                    onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">A unique identifier (e.g. ACME)</p>
              </div>
            </div>

            <hr className="border-slate-800" />
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Admin Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-700 rounded-md bg-slate-800 text-white py-2"
                    placeholder="John Doe"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Admin Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-700 rounded-md bg-slate-800 text-white py-2"
                    placeholder="john@acmesecurity.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-700 rounded-md bg-slate-800 text-white py-2"
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating workspace...' : 'Start Free Trial'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <a href="/login" className="text-sm text-blue-400 hover:text-blue-300">
                Already have an account? Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
