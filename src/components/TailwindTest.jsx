import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';

/**
 * TailwindTest Component
 * Used in Phase 1 to verify that Tailwind CSS styles, gradients, flex/grid layouts,
 * and responsive utilities render correctly across browsers.
 */
export default function TailwindTest() {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-lg">Tailwind CSS v4 Verification</h3>
            <p className="text-xs text-slate-400">Styling system render check</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Styles Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 transition-colors">
          <div className="text-cyan-400 font-mono text-xs mb-1">UTILITY TEST</div>
          <div className="font-medium text-slate-200 text-sm">Responsive Flex & Grid</div>
          <p className="text-xs text-slate-400 mt-1">Grid columns scale from 1 on mobile to 3 on desktop.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 transition-colors">
          <div className="text-emerald-400 font-mono text-xs mb-1">GRADIENT TEST</div>
          <div className="font-medium text-slate-200 text-sm">Color Tokens & Badges</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500 text-slate-950 font-semibold">cyan-500</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500 text-white font-semibold">indigo-500</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 transition-colors">
          <div className="text-indigo-400 font-mono text-xs mb-1">INTERACTION TEST</div>
          <div className="font-medium text-slate-200 text-sm">Hover & Focus States</div>
          <button className="mt-2 w-full py-1.5 px-3 text-xs font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md active:scale-95 cursor-pointer">
            Interactive Element
          </button>
        </div>
      </div>
    </div>
  );
}
