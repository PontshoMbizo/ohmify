"use client";

import React from "react";
import { GeneralUtils } from "@/lib/GeneralUtils";

const PROBLEM_TYPES = GeneralUtils.PROBLEM_TYPES;

export default function TopicSection({ problem, updateProblem, onNext, onBack }) {
  
  const toggleTopic = (type) => {
    let newTopics = [...problem.topics];
    
    if (newTopics.includes(type)) {
      newTopics = newTopics.filter((t) => t !== type);
    } else if (newTopics.length < 2) {
      newTopics.push(type);
    } else {
      return;
    }
    
    updateProblem({ topics: newTopics });
  };

  const handleTypeChange = (type) => {
    // Initialize testConfig based on type to ensure data structure matches the workflow
    let newConfig = {};
    if (type === "digital") {
      newConfig = { payload1: "", payload2: "", payload3: "" };
    } else if (type === "load") {
      newConfig = { noLoad: 1e12, rMax: 100, rMin: 10 };
    } else if (type === "signal") {
      newConfig = { isSignal: true }; // Signal tests only use test1
    }

    updateProblem({ 
      testType: type,
      testConfig: newConfig,
      // Auto-clear solutions if type changes to prevent data mismatch
      solutions: { test1: "", test2: "", test3: "" }
    });
  };

  return (
    <section 
      id="section-2" 
      className="relative flex h-screen w-full flex-col items-center bg-base-100 shrink-0 px-6 transition-colors duration-500"
    >
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="absolute top-8 left-12 btn btn-ghost p-1 text-green-600 hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/>
        </svg>
      </button>
      
      <div className="flex w-full max-w-6xl items-center justify-center gap-6">
        <div className="flex flex-1 flex-col gap-8">
          {/* TOPIC SELECTION */}
          <div className="">
            <div>
              <h2 className="text-3xl mt-12 font-black text-green-600 uppercase tracking-tighter">Problem Type</h2>
              <p className="text-sm opacity-60 font-medium">
                Select up to 2 categories for this challenge.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 max-w-xl">
              {PROBLEM_TYPES.map((type) => {
                const isSelected = problem.topics.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleTopic(type)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected 
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105" 
                      : "bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-40">
              Selected: {problem.topics.length} / 2
            </div>
          </div>

          <div className="w-full h-px bg-base-300"></div>

          {/* TEST TYPE SELECTION */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                Validation Strategy
              </h3>
              <p className="text-xs opacity-50">
                How should circuit be graded?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: "load", label: "Load Test", desc: "Analog / Power" },
                { id: "signal", label: "Signal Test", desc: "Waveshaping / DSP" },
                { id: "digital", label: "Digital Test", desc: "Logic / Gates" }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                    problem.testType === type.id 
                      ? "border-green-600 bg-green-50 shadow-md" 
                      : "border-base-200 hover:border-blue-400 bg-white"
                  }`}
                >
                  <span className={`text-sm font-black uppercase ${problem.testType === type.id ? "text-green-700" : "text-gray-400"}`}>
                    {type.label}
                  </span>
                  <span className="text-[10px] opacity-60 leading-tight mt-1">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Cue */}
        <div className="hidden lg:block relative">
          <div className="absolute -inset-4 bg-blue-500/5 rounded-full blur-3xl"></div>
          <img 
            className="relative h-96 w-auto border-2 border-gray-100 rounded-3xl shadow-2xl transition-transform duration-500" 
            src="/exampleProblem.png" 
            alt="Problem logic example" 
          />
        </div>
      </div>

      {/* Navigation Button */}
      <button 
        onClick={onNext} 
        disabled={problem.topics.length === 0 || !problem.testType}
        className="absolute bottom-44 right-12 btn btn-primary btn-lg rounded-full px-12 shadow-xl disabled:bg-gray-200"
      >
        Next Step
      </button>
    </section>
  );
}