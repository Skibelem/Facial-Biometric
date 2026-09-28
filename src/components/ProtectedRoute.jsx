import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Loader2 } from 'lucide-react';

/**
 * ProtectedRoute Component
 * Restricts access to authenticated users. Displays loading indicator during session check
 * and redirects unauthenticated users to /login.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          Verifying security session...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
