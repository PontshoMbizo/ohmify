"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider.jsx";
import MetadataSection from "./Sections/MetadataSection";
import TopicSection from "./Sections/TopicSection";
import TemplateSection from "./Sections/TemplateSection";
import SolutionSection from "./Sections/SolutionSection";

const STEPS = [
  { id: 0, label: "Details",  desc: "Title & description" },
  { id: 1, label: "Topics",   desc: "Category & validation" },
  { id: 2, label: "Template", desc: "Starter circuit" },
  { id: 3, label: "Solution", desc: "Gold standard capture" },
];

export default function CreateProblem() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const [problem, setProblem] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    topics: [],
    testType: "load",
    sampleCount: 30720,
    timeStep: "5e-6",
    testConfig: { noLoad: 1e12, rMax: 10000, rMin: 100 },
    solutions: {},
    templateCircuit: "",
  });

  const updateProblem = (patch) =>
    setProblem((prev) => ({ ...prev, ...patch }));


  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f8f9fa] font-sans">

      {/* ── SIDEBAR ── */}
      <aside className="w-56 shrink-0 h-full bg-white border-r border-gray-100 flex flex-col">

        {/* Step nav */}
        <nav className="flex-1 px-4 py-8 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 mb-5">
            New Challenge
          </p>
          {STEPS.map((s) => {
            const isDone = s.id < step;
            const isActive = s.id === step;
            const isLocked = s.id > step;
            return (
              <button
                key={s.id}
                onClick={() => !isLocked && setStep(s.id)}
                disabled={isLocked}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                  ${isActive ? "bg-green-50" : ""}
                  ${isDone   ? "hover:bg-gray-50 cursor-pointer" : ""}
                  ${isLocked ? "cursor-default" : ""}
                `}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black transition-all
                  ${isActive ? "bg-green-600 text-white" : ""}
                  ${isDone   ? "bg-green-100 text-green-600" : ""}
                  ${isLocked ? "bg-gray-100 text-gray-300" : ""}
                `}>
                  {isDone ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : s.id + 1}
                </div>
                <div>
                  <p className={`text-sm font-bold leading-none ${isActive ? "text-green-700" : isDone ? "text-gray-500" : "text-gray-300"}`}>
                    {s.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isLocked ? "text-gray-200" : "text-gray-400"}`}>{s.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Progress bar */}
        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
            <span className="text-[10px] font-black text-green-600">{step + 1}/{STEPS.length}</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top bar */}
        <header className="h-12 shrink-0 bg-white border-b border-gray-100 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-800 uppercase tracking-tight">
              {STEPS[step].label}
            </span>
            <span className="text-gray-200 text-sm">·</span>
            <span className="text-xs text-gray-400">{STEPS[step].desc}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 border border-gray-100 rounded px-2 py-1">
              Draft
            </span>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
              Cancel
            </a>
          </div>
        </header>

        {/* Section content — fills remaining height exactly */}
        <main className="flex-1 overflow-hidden">
          {step === 0 && <MetadataSection problem={problem} updateProblem={updateProblem} onNext={() => setStep(1)} />}
          {step === 1 && <TopicSection problem={problem} updateProblem={updateProblem} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <TemplateSection problem={problem} updateProblem={updateProblem} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && (
            <SolutionSection
              problem={problem}
              user={user}
              updateProblem={updateProblem}
              onBack={() => setStep(2)}
              isPublishing={isPublishing}
              setIsPublishing={setIsPublishing}
            />
          )}
        </main>
      </div>
    </div>
  );
}