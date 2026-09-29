import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFacialTemplate } from '../services/biometricService';
import { getUserAuthLogs } from '../services/logService';
import { LayoutDashboard, User, Mail, Calendar, ShieldCheck, LogOut, CheckCircle2, Camera, KeyRound, Clock, AlertCircle } from 'lucide-react';

/**
 * UserDashboardPage Component
 * Authenticated user dashboard displaying profile details, facial enrolment status,
 * verification options, and recent authentication audit logs.
 */
export default function UserDashboardPage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [hasEnrolled, setHasEnrolled] = useState(false);
  const [enrolmentDate, setEnrolmentDate] = useState(null);
  const [authLogs, setAuthLogs] = useState([]);
  const [loadingBiometrics, setLoadingBiometrics] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchBiometricsAndLogs = async () => {
      if (!user?.id) return;

      try {
        const { record } = await getFacialTemplate(user.id);
        if (mounted && record && record.facial_template) {
          setHasEnrolled(true);
          setEnrolmentDate(record.capture_date);
        }

        const { logs } = await getUserAuthLogs(user.id, 5);
        if (mounted) {
          setAuthLogs(logs || []);
        }
      } catch (err) {
        console.error('[UserDashboardPage] Error fetching biometrics/logs:', err);
      } finally {
        if (mounted) setLoadingBiometrics(false);
      }
    };

    fetchBiometricsAndLogs();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Registered User';
  const email = profile?.email || user?.email || 'N/A';
  const rawDate = profile?.date_registered || user?.created_at;
  const registrationDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently Registered';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Dashboard</h1>
            <p className="text-xs text-slate-500">Manage your biometric security settings, enrolment status, and audit logs.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Session Active
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* User Profile Identity Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            User Profile Information
          </h2>
          <span className="text-xs font-mono text-slate-400">ID: {user?.id}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 font-semibold">
              <User className="w-4 h-4" />
              FULL NAME
            </div>
            <div className="font-bold text-slate-900 text-base">{fullName}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 font-semibold">
              <Mail className="w-4 h-4" />
              EMAIL ADDRESS
            </div>
            <div className="font-bold text-slate-900 text-base break-all">{email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 font-semibold">
              <Calendar className="w-4 h-4" />
              REGISTRATION DATE
            </div>
            <div className="font-bold text-slate-900 text-base">{registrationDate}</div>
          </div>
        </div>
      </div>

      {/* Biometric Enrolment & Verification Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enrolment Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Facial Enrolment</h3>
            </div>

            {hasEnrolled ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Enrolled
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Not Enrolled
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {hasEnrolled
              ? `Facial enrolment complete. Last capture: ${new Date(enrolmentDate).toLocaleDateString()}`
              : 'Enrol your face to extract 128D descriptors using pre-trained face-api.js models.'}
          </p>

          <Link
            to="/enrolment"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            {hasEnrolled ? 'Re-Enrol Face' : 'Start Facial Enrolment'}
          </Link>
        </div>

        {/* Verification Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">Facial Verification</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Layer 2 Auth
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Perform secondary facial biometric verification (Email + Password $\rightarrow$ Facial Verification).
          </p>

          <Link
            to="/verification"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
              hasEnrolled
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Perform Facial Verification
          </Link>
        </div>
      </div>

      {/* Authentication Audit Logs */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-md">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-cyan-600" />
          Recent Authentication Audit Logs
        </div>

        {authLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 px-3">Log ID</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">{log.log_id.substring(0, 8)}...</td>
                    <td className="py-2.5 px-3 text-slate-700">{log.login_date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{log.login_time}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/90 text-xs font-mono text-slate-400 text-center">
            {loadingBiometrics ? 'Loading audit logs...' : 'No authentication logs recorded yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
