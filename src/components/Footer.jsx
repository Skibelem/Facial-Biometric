import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

/**
 * Footer Component
 * Production footer presenting system identity and security overview.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 py-6 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>Secure Biometric Authentication System &copy; {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Lock className="w-3.5 h-3.5 text-cyan-600" />
            Facial Biometric Security
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-slate-500">
            Encrypted Biometric Storage & Audit
          </span>
        </div>
      </div>
    </footer>
  );
}
