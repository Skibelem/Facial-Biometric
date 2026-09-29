import React from 'react';
import { Shield, Camera, Lock, ArrowRight, UserPlus, UserCheck, FileText, KeyRound, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * LandingPage Component
 * Refined production homepage presenting the Secure Biometric Authentication System.
 */
export default function LandingPage() {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 md:p-14 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Biometric Access Control Platform
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Secure Biometric <br />
            <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Authentication System
            </span>
          </h1>

          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Authenticate securely using facial recognition technology designed to provide reliable and convenient identity verification.
          </p>

          {/* Primary & Secondary Call-To-Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/facial-login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-300 transition-all shadow-sm cursor-pointer"
            >
              <Camera className="w-4 h-4 text-cyan-600" />
              Login With Face
            </Link>
          </div>
        </div>
      </section>

      {/* Section 1: How It Works */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">How It Works</h2>
          <p className="text-sm text-slate-600">Three simple steps to secure facial biometric authentication.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Create Your Account</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register your secure user profile.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <UserPlus className="w-4 h-4 text-cyan-600" />
              <span>User Registration</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Enrol Your Face</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Capture and securely store your facial biometric information.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Biometric Enrolment</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Authenticate Securely</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use facial recognition to access your account.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Facial Authentication</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Security Features */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Security Features</h2>
          <p className="text-sm text-slate-600">Comprehensive protection designed for modern biometric security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-sm">
            <div className="p-2.5 w-fit rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Facial Recognition</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Secure identity verification using facial biometric matching.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-sm">
            <div className="p-2.5 w-fit rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Secure Biometric Storage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Protected storage of biometric templates and user information.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-sm">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Authentication Records</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitoring and recording of authentication activities.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-sm">
            <div className="p-2.5 w-fit rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Controlled Access</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Secure user access through authenticated sessions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
