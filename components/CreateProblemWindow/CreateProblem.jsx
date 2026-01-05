"use client";

import React, { useState, useEffect } from "react";
import Simulator from "@/components/Simulator";
import Navbar from "@/components/Navbar";
import {GeneralUtils} from "@/lib/GeneralUtils";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const PROBLEM_TYPES = GeneralUtils.PROBLEM_TYPES;

export default function CreateProblem() {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [problem, setProblem] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    topic: [], 
    sampleCount: 30720,
    templateCircuit: "", 
    solutionData: null,
  });

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = "auto"; };
  }, []);

  const scrollToSection = (index) => {
    const element = document.getElementById(`section-${index}`);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const toggleTopic = (type) => {
    setProblem(prev => {
      if (prev.topic.includes(type)) {
        return { ...prev, topic: prev.topic.filter(t => t !== type) };
      }
      if (prev.topic.length < 2) {
        return { ...prev, topic: [...prev.topic, type] };
      }
      return prev;
    });
  };

  /* -------------------- FIREBASE LOGIC -------------------- */
  const finalizeProblem = async () => {
    if (!problem.templateCircuit || !problem.solutionData || !problem.title) {
      alert("Please ensure Title is set, Template is saved (Sec 3), and Solution is sampled (Sec 4).");
      return;
    }

    if (problem.topic.length === 0) {
      alert("Please select at least one problem type.");
      return;
    }

    setIsPublishing(true);

    try {
      const problemDoc = {
        title: problem.title,
        creator: "Admin",
        description: problem.description,
        difficulty: problem.difficulty,
        initialCircuit: problem.templateCircuit,
        solutionWaveform: problem.solutionData, // This will be raw text (analog) or JSON (digital)
        topic: problem.topic,
        isDigital: GeneralUtils.isDigitalProblem(problem.topic),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "problems"), problemDoc);
      alert(`🚀 Problem "${problem.title}" published successfully!`);
    } catch (error) {
      console.error("Firestore Error:", error);
      alert("Error publishing to Firebase.");
    } finally {
      setIsPublishing(false);
    }
  };

  /* -------------------- SIMULATOR HANDLERS -------------------- */
  const captureTemplate = (data, sim) => {
    if (!sim) return;
    setProblem(prev => ({ ...prev, templateCircuit: sim.exportCircuit() }));
  };

const captureSolution = (capturedData) => {
    // If captureDigital was used, capturedData.type will be "digital"
    if (capturedData.type === "digital") {
      /**
       * Map the table to just the decimalOutput values 
       * and join them with newlines (\n)
       */
      const digitalList = capturedData.table
        .map(row => row.decimalOutput)
        .join("\n");

      setProblem(prev => ({ 
        ...prev, 
        solutionData: digitalList,
      }));
    } else {
      // Analog mode: already stores Vout array as newline-separated text
      const vout = capturedData.data.output;
      setProblem(prev => ({ 
        ...prev, 
        solutionData: vout.join("\n"),
      }));
    }
  };

  const SECTION_HEIGHT = "h-[calc(100vh-3rem)]";

  return (
    <div className="h-screen w-full overflow-hidden bg-base-200">
      <div className="fixed top-0 left-0 z-[100] w-full h-12 bg-white shadow-sm">
        <Navbar />
      </div>

      <div className="mt-12 h-[calc(100vh-3rem)] w-full overflow-hidden">
        
        {/* Section 1: Metadata */}
        <section id="section-1" className={`relative flex ${SECTION_HEIGHT} w-full flex-col items-center justify-center shrink-0 px-4`}>
          <div className="flex w-full max-w-3xl flex-col gap-4">
            <h2 className="text-3xl font-black text-blue-600 uppercase tracking-tighter">01. Problem Description</h2>
            <input type="text" placeholder="Challenge Title" className="input input-bordered input-lg w-full font-bold shadow-sm" onChange={(e) => setProblem({...problem, title: e.target.value})} />
            <textarea placeholder="detailed problem description..." className="h-48 w-full rounded-2xl border border-base-300 p-6 text-lg shadow-inner bg-white outline-none focus:ring-2 focus:ring-blue-500/20" onChange={(e) => setProblem({...problem, description: e.target.value})} />
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="label text-xs font-bold opacity-50 uppercase">Difficulty</label>
                    <select className="select select-bordered w-full" defaultValue={problem.difficulty} onChange={(e) => setProblem({...problem, difficulty: e.target.value})}>
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="label text-xs font-bold opacity-50 uppercase">Samples / Cycles</label>
                    <input type="number" className="input input-bordered w-full" placeholder={problem.sampleCount} onChange={(e) => setProblem({...problem, sampleCount: e.target.value})} />
                </div>
            </div>
          </div>
          <button onClick={() => scrollToSection(2)} className="absolute bottom-12 right-12 btn btn-primary btn-lg rounded-full px-10 shadow-xl">Next</button>
        </section>

        {/* Section 2: Problem Type Selection */}
        <section id="section-2" className={`relative flex ${SECTION_HEIGHT} w-full flex-col items-center justify-center bg-base-100 shrink-0 px-6`}>
          <button onClick={() => scrollToSection(1)} className="absolute top-8 left-12 btn btn-ghost p-2 opacity-50 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/></svg>
          </button>
          
          <div className="flex w-full max-w-6xl items-center justify-center gap-12">
            <div className="flex flex-1 flex-col gap-6">
              <div>
                <h2 className="text-3xl font-black text-blue-600 mb-1 uppercase tracking-tighter">02. Problem Type</h2>
                <p className="text-sm opacity-60">Digital types trigger bit-vector bus discovery.</p>
              </div>

              <div className="flex flex-wrap gap-2 max-w-xl">
                {PROBLEM_TYPES.map((type) => {
                  const isSelected = problem.topic.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleTopic(type)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                        isSelected 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-96 w-80 rounded-xl border bg-base-200 flex items-center justify-center p-8 text-center">
                <p className="text-xs opacity-50">Circuit preview or documentation placeholder</p>
            </div>
          </div>
          <button onClick={() => scrollToSection(3)} className="absolute bottom-12 right-12 btn btn-primary btn-lg rounded-full px-10 shadow-xl">Next</button>
        </section>

        {/* Section 3: Template */}
        <section id="section-3" className={`relative flex ${SECTION_HEIGHT} w-full shrink-0 bg-white`}>
          <div className="w-[70%] h-full">
            <Simulator mode="export" onSubmit={captureTemplate} />
          </div>
          <div className="w-[30%] h-full p-10 flex flex-col gap-6 bg-base-50 border-l">
            <button onClick={() => scrollToSection(2)} className="btn btn-ghost p-0 w-fit opacity-50 hover:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/></svg>
            </button>
            <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">03. Template</h2>
            <p className="text-sm opacity-70">Design the starting state for the student here.</p>
            <div className={`p-6 rounded-2xl border-2 transition-all ${problem.templateCircuit ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-dashed border-gray-300"}`}>
                <p className="text-sm font-bold">{problem.templateCircuit ? "✅ Template Exported" : "⏳ Click 'Submit' to capture circuit"}</p>
            </div>
            <button onClick={() => scrollToSection(4)} className="absolute bottom-12 right-12 btn bg-blue-600 text-white btn-lg rounded-full px-10 shadow-xl">Next</button>
          </div>
        </section>

        {/* Section 4: Solution */}
        <section id="section-4" className={`relative flex ${SECTION_HEIGHT} w-full shrink-0 bg-white`}>
          <div className="w-[70%] h-full">
            <Simulator 
              nodes={["input", "output"]}
              circuit={problem.templateCircuit} 
              onSubmit={captureSolution} 
              timestep={GeneralUtils.getTimestepForProblem(problem)}
              isDigital={GeneralUtils.isDigitalProblem(problem)}
             />
          </div>
          <div className="w-[30%] h-full p-10 flex flex-col gap-6 bg-base-50 border-l">
            <button onClick={() => scrollToSection(3)} className="btn btn-ghost p-0 w-fit opacity-50 hover:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/></svg>
            </button>
            <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">04. Gold Standard</h2>
            <p className="text-sm opacity-70">
                {isDigitalProblem() 
                  ? "Ensure 'clk' and 'Output' labels exist." 
                  : "Ensure 'input' and 'output' labels exist."}
            </p>
            <div className={`p-6 rounded-2xl border-2 transition-all ${problem.solutionData ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-dashed border-gray-300"}`}>
                <p className="text-sm font-bold">
                    {problem.solutionData ? "✅ Solution Captured" : "⏳ Awaiting sampling..."}
                </p>
            </div>
            <button disabled={isPublishing} onClick={finalizeProblem} className="mt-auto btn bg-blue-600 btn-lg rounded-2xl text-white font-black uppercase shadow-2xl disabled:bg-gray-400">
                {isPublishing ? "Publishing..." : "Finalize & Publish"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}