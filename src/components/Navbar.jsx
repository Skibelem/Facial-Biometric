import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Lock, LayoutDashboard, UserCheck, KeyRound, LogOut, User } from 'lucide-react';

/**
 * Navbar Component
 * Navigation header with dynamic auth state displays and logout action.
 */
export default function Navbar() {
  const { session, profile, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-cyan-500/10 text-cyan-700 font-semibold border border-cyan-500/30'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'User';
  const isAdmin = Boolean(profile?.is_admin || user?.user_metadata?.is_admin || profile?.role === 'admin');

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block leading-none">
              BioSecur<span className="text-cyan-600">ID</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              Biometric Auth System
            </span>
          </div>
        </NavLink>

        {/* Route Navigation */}
        <nav className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <NavLink to="/" className={getNavClass}>
              Home
            </NavLink>
            {!session && (
              <>
                <NavLink to="/login" className={getNavClass}>
                  <KeyRound className="w-4 h-4" />
                  Login
                </NavLink>
                <NavLink to="/register" className={getNavClass}>
                  <UserCheck className="w-4 h-4" />
                  Create Account
                </NavLink>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden md:block"></div>

          {session ? (
            <div className="flex items-center gap-2">
              <NavLink to="/" className={getNavClass}>
                Home
              </NavLink>
              <NavLink to="/dashboard" className={getNavClass}>
                <LayoutDashboard className="w-4 h-4 text-cyan-600" />
                Dashboard
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin" className={getNavClass}>
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Admin
                </NavLink>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                  <User className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="max-w-[120px] truncate font-semibold">{displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex md:hidden items-center gap-1">
              <NavLink to="/login" className={getNavClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={getNavClass}>
                Create Account
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
