import React from 'react';
import { Lock, Users, Activity, ShieldAlert } from 'lucide-react';

/**
 * AdminDashboardPage Placeholder Component
 * Protected Route Placeholder (/admin)
 * Note: Administrator dashboard features will be built in Phase 5.
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Administrator Dashboard</h1>
            <p className="text-xs text-slate-400 font-mono">Protected Route: /admin</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
          Phase 1 Placeholder
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Users className="w-4 h-4" />
            User Management
          </div>
          <p className="text-xs text-slate-400">
            Admin tool to inspect registered user records and biometric enrolment statuses.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <Activity className="w-4 h-4" />
            System Authentication Logs
          </div>
          <p className="text-xs text-slate-400">
            Monitor real-time login attempts, verification results, and security alerts.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            Security Audit
          </div>
          <p className="text-xs text-slate-400">
            Review security controls, failed authentication spikes, and system health.
          </p>
        </div>
      </div>
    </div>
  );
}
