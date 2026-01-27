"use client";

import Simulator from "@/components/Simulator";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState, useMemo } from "react";

export default function SolutionSection({ problem, user, updateProblem, onBack, isPublishing, setIsPublishing }) {
  const [activeTest, setActiveTest] = useState("test1");
  
  const isDigital = useMemo(() => GeneralUtils.isDigitalProblem(problem.topics), [problem.topics]);

  /**
   * Manually update the testbench metadata (resistance or payloads) via sidebar inputs
   */
  const handleBenchChange = (key, value) => {
    updateProblem({
      testConfig: {
        ...problem.testConfig,
        [key]: value
      }
    });
  };

  /**
   * Captures the simulator output. 
   * Validation of resistance is now implicit: if the user's load doesn't match 
   * the creator's, the waveforms simply won't align.
   */
  const handleCaptureSolution = (capturedData) => {
    const dataString = isDigital 
      ? capturedData.table.map(row => row.decimalOutput).join("\n")
      : (capturedData.data?.output || []).join("\n");

    updateProblem({
      solutions: { 
        ...problem.solutions, 
        [activeTest]: dataString 
      }
    });
  };

  /**
   * Publishes the problem using the separate-document sub-collection strategy.
   */
  const finalizeProblem = async () => {
    console.log(problem);
    if (!user) return alert("Sign in required.");
    const { test1, test2, test3 } = problem.solutions;
    
    if (!test1 || !test2 || !test3) return alert("Capture all 3 cases first.");

    setIsPublishing(true);

    try {
      // 1. Prepare Metadata for the main document
      const testbench = isDigital ? {
        payload1: String(problem.testConfig?.payload1 || ""),
        payload2: String(problem.testConfig?.payload2 || ""),
        payload3: String(problem.testConfig?.payload3 || "")
      } : {
        noload: 1e12,
        maxload: Number(problem.testConfig?.rMax || 0),
        minload: Number(problem.testConfig?.rMin || 0)
      };

      const problemData = {
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        topics: problem.topics,
        creatorId: user.uid,
        creatorName: user.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        testbench,
        isDigital,
        timeStep: problem.timeStep,
        sampleCount: problem.sampleCount
      };

      const problemRef = await addDoc(collection(db, "Problems"), problemData);

      // 2. Save Initial Circuit Template
      await setDoc(doc(db, "Problems", problemRef.id, "initialCircuit", "data"), {
        version: 1,
        payload: problem.templateCircuit
      });

      // 3. Save solutions as separate docs to bypass 1MB limit
      const sampleRate = 1 / Number(problem.timeStep);
      const tests = { test1, test2, test3 };

      for (const [key, value] of Object.entries(tests)) {
        await setDoc(doc(db, "Problems", problemRef.id, "solutionWaveform", key), {
          samples: value,
          sampleRate
        });
      }

      alert(`Problem Published Successfully!`);
      window.location.reload();
    } catch (e) {
      console.error("Publishing Error:", e);
      alert(`Publishing failed: ${e.message}`);
      setIsPublishing(false);
    }
  };

  return (
    <section id="section-4" className="relative flex h-screen w-full shrink-0 bg-white">
      {/* SIMULATOR */}
      <div className="w-[70%] h-full bg-base-100">
        <Simulator 
          circuit={problem.templateCircuit} 
          onSubmit={handleCaptureSolution} 
          sampleCount={problem.sampleCount}
          isDigital={isDigital}
        />
      </div>

      {/* SIDEBAR CONTROLS */}
      <div className="w-[30%] h-full p-8 flex flex-col gap-6 border-l bg-base-50 overflow-y-auto text-black">
        <div>
          <h2 className="text-2xl font-black uppercase italic text-blue-600 tracking-tighter">04. Test Suite</h2>
          <p className="text-xs opacity-60">Define test parameters and capture gold standard waveforms.</p>
        </div>

        {/* MANUAL TESTBENCH INPUTS */}
        <div className="grid grid-cols-1 gap-3 p-4 bg-white border rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            {isDigital ? "Data Payloads (SRAM Strings)" : "Testbench Loads (Ohms)"}
          </p>
          
          {isDigital ? (
            <>
              <input type="text" placeholder="Payload A (e.g. 0xFA...)" className="input input-bordered input-sm w-full font-mono" 
                value={problem.testConfig?.payload1 || ""} onChange={(e) => handleBenchChange("payload1", e.target.value)} />
              <input type="text" placeholder="Payload B" className="input input-bordered input-sm w-full font-mono" 
                value={problem.testConfig?.payload2 || ""} onChange={(e) => handleBenchChange("payload2", e.target.value)} />
              <input type="text" placeholder="Payload C" className="input input-bordered input-sm w-full font-mono" 
                value={problem.testConfig?.payload3 || ""} onChange={(e) => handleBenchChange("payload3", e.target.value)} />
            </>
          ) : (
            <>
              <div className="form-control">
                <label className="label py-0"><span className="label-text text-[9px] font-bold uppercase opacity-50">Max Load (Ω)</span></label>
                <input type="number" className="input input-bordered input-sm w-full font-mono" 
                  value={problem.testConfig?.rMax || ""} onChange={(e) => handleBenchChange("rMax", e.target.value)} />
              </div>
              <div className="form-control">
                <label className="label py-0"><span className="label-text text-[9px] font-bold uppercase opacity-50">Min Load (Ω)</span></label>
                <input type="number" className="input input-bordered input-sm w-full font-mono" 
                  value={problem.testConfig?.rMin || ""} onChange={(e) => handleBenchChange("rMin", e.target.value)} />
              </div>
            </>
          )}
        </div>

        {/* TEST SELECTOR */}
        <div className="tabs tabs-boxed bg-base-200 p-1">
          {[
            { id: "test1", label: isDigital ? "Test A" : "No Load" },
            { id: "test2", label: isDigital ? "Test B" : "Max Load" },
            { id: "test3", label: isDigital ? "Test C" : "Min Load" }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTest(t.id)}
              className={`tab flex-1 font-bold transition-all ${activeTest === t.id ? "tab-active bg-blue-600 text-white" : ""}`}>
              {problem.solutions[t.id] ? "✓ " : ""}{t.label}
            </button>
          ))}
        </div>

        {/* STATUS CARD */}
        <div className="p-5 bg-white border rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Awaiting Capture: {activeTest.toUpperCase()}</p>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500 italic">
            {isDigital 
              ? "Update simulator SRAM, reset simulation, then click 'Submit' in the simulator window." 
              : "Manually adjust the Voltmeter resistance property in the simulator to match the values in the fields above."}
          </p>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-auto space-y-3 pt-6 border-t">
          <button onClick={onBack} className="btn btn-ghost w-full btn-sm opacity-50 uppercase">Back to Template</button>
          <button 
            disabled={isPublishing || !problem.solutions.test3} 
            onClick={finalizeProblem} 
            className="btn btn-primary w-full shadow-lg font-black uppercase tracking-widest"
          >
            {isPublishing ? <span className="loading loading-spinner"></span> : "Finalize & Publish"}
          </button>
        </div>
      </div>
    </section>
  );
}