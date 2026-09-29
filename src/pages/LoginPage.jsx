import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { KeyRound, AlertCircle, Loader2, Mail, Lock, Camera, ArrowRight } from 'lucide-react';

/**
 * LoginPage Component
 * Provides Email + Password Login and a prominent Facial Biometric Login option.
 */
export default function LoginPage() {
  const { login, session } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationError, setValidationError] = useState('');
  const [serverError, setServerError] = useState('');
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

    const { email, password } = formData;

    if (!email.trim() || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login({
        email: email.trim(),
        password,
      });

      if (!res.success) {
        setServerError(res.error?.message || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* Facial Biometric Login Shortcut Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white border border-white/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Facial Biometric Login</h3>
              <p className="text-[11px] text-cyan-100">Enrolled user? Sign in instantly with your face</p>
            </div>
          </div>
        </div>

        <Link
          to="/facial-login"
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-cyan-600" />
          Authenticate With Face
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-300"></div>
        <span className="flex-shrink mx-4 text-xs font-mono text-slate-500 uppercase">OR USE PASSWORD</span>
        <div className="flex-grow border-t border-slate-300"></div>
      </div>

      {/* Email + Password Login Form */}
      <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Password Login</h2>
            <p className="text-xs text-slate-500">Sign in with registered credentials</p>
          </div>
        </div>

        {/* Error Notice */}
        {(validationError || serverError) && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Authentication Error</div>
              <p className="mt-0.5">{validationError || serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign In With Password'
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-200 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-600 font-semibold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
