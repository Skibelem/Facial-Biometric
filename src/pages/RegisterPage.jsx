import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserCheck, AlertCircle, CheckCircle2, Loader2, Mail, Lock, User } from 'lucide-react';

/**
 * RegisterPage Component
 * Provides interactive registration form with form validation, email confirmation handling,
 * and integration with Supabase Auth & public.users table.
 */
export default function RegisterPage() {
  const { register, session } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');
  const [serverError, setServerError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  if (session) {
    navigate('/dashboard', { replace: true });
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setServerError('');
    setSuccessNotice('');

    const { fullName, email, password, confirmPassword } = formData;

    // Client-side validation
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });

      if (!res.success) {
        setServerError(res.error?.message || 'Registration failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Check if session was issued immediately or email confirmation is required
      if (res.session) {
        navigate('/dashboard');
      } else {
        setSuccessNotice(
          'Registration successful! Please check your email to confirm your account before logging in.'
        );
        setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      setServerError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Create Account</h2>
          <p className="text-xs text-slate-500">User Registration Module</p>
        </div>
      </div>

      {/* Error Alert */}
      {(validationError || serverError) && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Registration Notice</div>
            <p className="mt-0.5">{validationError || serverError}</p>
          </div>
        </div>
      )}

      {/* Email Confirmation Success Alert */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-700 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Registration Pending Confirmation</div>
            <p className="mt-0.5">{successNotice}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-1 focus:ring-cyan-600 text-sm text-slate-900 placeholder-slate-400 transition-colors"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-1 focus:ring-cyan-600 text-sm text-slate-900 placeholder-slate-400 transition-colors"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-1 focus:ring-cyan-600 text-sm text-slate-900 placeholder-slate-400 transition-colors"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-1 focus:ring-cyan-600 text-sm text-slate-900 placeholder-slate-400 transition-colors"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Registration...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-200 text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-600 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
