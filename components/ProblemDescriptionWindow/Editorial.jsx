"use client";

import React from 'react';

export default function Editorial({ problem }) {
  // Logic: If problem.Editorial exists and is not an empty string, 
  // you can render the actual content here. 
  // Otherwise, display the "Coming Soon" UI.
  if (problem?.editorial && problem.editorial.trim() !== "") {
    return (
      <div className="prose max-w-none animate-in h-[calc(100vh-20px)] fade-in duration-500">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-6">
          Engineering Breakdown
        </h2>
        <div className="text-gray-700 leading-relaxed">
          {/* This renders the content stored in your database */}
          {problem.editorial}
        </div>
      </div>
    );
  }

  // Placeholder UI displays ONLY if problem.editorial is null, undefined, or empty
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-90px)] text-center space-y-4 p-8 animate-in fade-in zoom-in duration-500">
      <div className="bg-green-50 p-4 rounded-full animate-bounce">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#16a34a" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="lucide lucide-construction"
        >
          <rect x="2" y="6" width="20" height="8" rx="1"/>
          <path d="M17 14v7"/>
          <path d="M7 14v7"/>
          <path d="M17 3v3"/>
          <path d="M7 3v3"/>
          <path d="M10 14 2.3 6.3"/>
          <path d="m14 6 7.7 7.7"/>
          <path d="m8 6 8 8"/>
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
          Editorial Under Construction
        </h2>
        <p className="text-gray-500 max-w-sm mx-auto">
          We are currently drafting a detailed walkthrough for the 
          <span className="font-bold text-green-600"> {problem?.title || "this problem"} </span> 
          challenge. Check back soon for the full engineering breakdown!
        </p>
      </div>

      <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-green-600 h-full w-2/3 animate-pulse rounded-full"></div>
      </div>
      
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Estimated Release: Q1 2026
      </span>
    </div>
  ) 
}