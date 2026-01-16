import React from "react";
import { GeneralUtils } from "@/lib/GeneralUtils";

const PROBLEM_TYPES = GeneralUtils.PROBLEM_TYPES;

export default function TopicSection({ problem, updateProblem, onNext, onBack }) {
  
  const toggleTopic = (type) => {
    let newTopics = [...problem.topics];
    
    if (newTopics.includes(type)) {
      // Remove if already selected
      newTopics = newTopics.filter((t) => t !== type);
    } else if (newTopics.length < 2) {
      // Add if under the limit of 2
      newTopics.push(type);
    } else {
      // Optional: Visual feedback for limit reached
      return;
    }
    
    updateProblem({ topics: newTopics });
  };

  return (
    <section 
      id="section-2" 
      className="relative flex h-screen w-full flex-col items-center justify-center bg-base-100 shrink-0 px-6 transition-colors duration-500"
    >
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="absolute top-8 left-12 btn btn-ghost p-2 opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/>
        </svg>
      </button>
      
      <div className="flex w-full max-w-6xl items-center justify-center gap-12">
        <div className="flex flex-1 flex-col gap-6">
          <div>
            <h2 className="text-3xl font-black text-blue-600 mb-1 uppercase tracking-tighter">
              02. Engineering Domain
            </h2>
            <p className="text-sm opacity-60 font-medium">
              Select up to 2 categories.
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

          {/* Selection Counter UI */}
          <div className="mt-4 text-[10px] uppercase tracking-widest font-bold opacity-40">
            Selected: {problem.topics.length} / 2
          </div>
        </div>

        {/* Visual Cue for the Domain */}
        <div className="hidden lg:block relative">
          <div className="absolute -inset-4 bg-blue-500/5 rounded-full blur-3xl"></div>
          
          <img 
            className="relative h-96 w-auto border-2 border-gray-100 rounded-3xl shadow-2xl hover:rotate-0 transition-transform duration-500" 
            src="/exampleProblem.png" 
            alt="Problem logic example" 
          />
        </div>
      </div>

      {/* Navigation Button */}
      <button 
        onClick={onNext} 
        disabled={problem.topics.length === 0}
        className="absolute bottom-12 right-12 btn btn-primary btn-lg rounded-full px-12 shadow-xl disabled:bg-gray-200"
      >
        Next Step
      </button>
    </section>
  );
}