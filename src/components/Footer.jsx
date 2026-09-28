import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

/**
 * Footer Component
 * Production footer presenting system identity and security overview.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Secure Biometric Authentication System &copy; {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            Facial Biometric Security
          </span>
          <span className="text-slate-700">&bull;</span>
          <span className="text-slate-400">
            Encrypted Biometric Storage & Audit
          </span>
        </div>
      </div>
    </footer>
  );
}
