import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

/**
 * NotFoundPage Placeholder Component
 * Fallback route for unmatched URL paths.
 */
export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto text-cyan-600">
        <HelpCircle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">404 - Page Not Found</h1>
        <p className="text-sm text-slate-600">
          The route you are trying to access does not exist in the system navigation.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Landing Page
      </Link>
    </div>
  );
}
