"use client";

import { ArrowLeft } from "lucide-react";

// Shared sticky footer nav for every Creator Studio step. One Back (ghost) +
// one primary action (blue pill, per the Create design set). When the primary
// is disabled, the `hint` explains what's still needed — a single, consistent
// gating affordance instead of per-step floating buttons.
export default function WizardFooter({
  onBack,
  onNext,
  nextLabel = "Next Step",
  disabled = false,
  hint = "",
  busy = false,
}) {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between gap-4">
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft size={15} strokeWidth={2.4} />
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {disabled && hint && (
          <span className="text-[11px] font-medium text-slate-400 hidden sm:block">{hint}</span>
        )}
        <button
          onClick={onNext}
          disabled={disabled || busy}
          className="inline-flex items-center gap-2 rounded-full px-8 py-2.5 text-sm font-black uppercase tracking-widest bg-blue-600 text-white shadow-md hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all"
        >
          {busy && <span className="loading loading-spinner loading-xs"></span>}
          {nextLabel}
        </button>
      </div>
    </footer>
  );
}
