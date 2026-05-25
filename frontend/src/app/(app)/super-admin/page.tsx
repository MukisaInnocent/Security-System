'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Building, Users, CreditCard, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
  // Mock data for now since we haven't built the full super-admin backend API
  const [stats, setStats] = useState({
    totalTenants: 5,
    activeGuards: 1250,
    mrr: '$12,500',
    systemHealth: '100%',
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Platform Overview</h1>
        <p className="text-slate-400">Manage all subscribed security companies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Companies</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalTenants}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Building className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-emerald-400 mt-4 flex items-center">
            +2 this month
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Active Guards</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.activeGuards}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">MRR</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.mrr}</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">System Health</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.systemHealth}</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800">
          <h3 className="text-lg font-medium text-slate-100">Recent Registrations</h3>
        </div>
        <div className="p-6">
            <p className="text-slate-400 text-sm text-center py-8">Super Admin API endpoints are pending implementation. Mock interface shown.</p>
        </div>
      </div>
    </div>
  );
}
