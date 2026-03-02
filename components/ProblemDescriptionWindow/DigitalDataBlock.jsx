"use client";

import { useState } from 'react';

const TechnicalPayloadBlock = ({ label, payload }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!payload) return;
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </span>
        {copied && (
          <span className="text-[10px] font-bold text-green-500 uppercase animate-in fade-in zoom-in duration-300">
            Copied
          </span>
        )}
      </div>
      
      <div 
        onClick={copyToClipboard}
        className="relative group cursor-pointer active:scale-[0.98] transition-all"
      >
        {/* Hover Icon */}
        <div className="absolute inset-y-0 right-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2v-2" />
           </svg>
        </div>
        
        <pre className="bg-slate-900 text-blue-300 p-3 rounded-lg font-mono text-xs border border-slate-800 overflow-hidden text-ellipsis whitespace-nowrap group-hover:border-blue-500/50 transition-colors shadow-sm">
          {payload || "No data provided"}
        </pre>
      </div>
    </div>
  );
};

export default function DigitalDataBlock({ problem }) {
  // Guard clause: only show if the test type is explicitly digital
  if (problem.testType !== "digital") return null;

  // Accessing the payload data from the testbench object defined in SolutionSection
  const { payload1, payload2, payload3 } = problem.testbench || {};

  return (
    <div 
      className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500"
      id="payload-section" // Matches the jump link ID in ProblemDescription
    > 
      <TechnicalPayloadBlock label="Test Case A" payload={payload1} />
      <TechnicalPayloadBlock label="Test Case B" payload={payload2} />
      <TechnicalPayloadBlock label="Test Case C" payload={payload3} />
      
      <div className="mt-4 flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
         </svg>
         <p className="text-[10px] text-amber-900 font-semibold leading-tight">
            INSTRUCTIONS: Paste payload into your SRAM component and click <b className="uppercase">Reset</b> in the simulator before each submission.
         </p>
      </div>
    </div>
  );
}

