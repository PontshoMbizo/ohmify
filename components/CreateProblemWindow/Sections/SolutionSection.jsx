"use client";

import Simulator from "@/components/Simulator";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

export default function SolutionSection({ problem, user, updateProblem, onBack, isPublishing, setIsPublishing }) {
  // activeTest only relevant for 'load' and 'digital' types
  const [activeTest, setActiveTest] = useState("test1");
  const problemType = problem.testType || "load";

  /**
   * Manually update the testbench metadata
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
   */
  const handleCaptureSolution = (capturedData) => {
    const dataString = problemType === "digital" 
      ? capturedData.table.map(row => row.decimalOutput).join("\n")
      : (capturedData.data?.output || []).join("\n");

    // For 'signal' type, we always save to test1 and treat it as the only solution
    const targetKey = problemType === "signal" ? "test1" : activeTest;

    updateProblem({
      solutions: { 
        ...problem.solutions, 
        [targetKey]: dataString 
      }
    });
  };

  /**
   * Publishes the problem using the separate-document strategy.
   */
  const finalizeProblem = async () => {
    if (!user) return alert("Sign in required.");
    
    // Validation logic based on type
    const { test1, test2, test3 } = problem.solutions;
    if (problemType === "signal" && !test1) return alert("Capture the signal waveform first.");
    if (problemType !== "signal" && (!test1 || !test2 || !test3)) return alert("Capture all 3 cases first.");

    setIsPublishing(true);

    try {
      // 1. Prepare Metadata
      let testbench = {};
      if (problemType === "digital") {
        testbench = {
          payload1: String(problem.testConfig?.payload1 || ""),
          payload2: String(problem.testConfig?.payload2 || ""),
          payload3: String(problem.testConfig?.payload3 || "")
        };
      } else if (problemType === "load") {
        testbench = {
          noload: 1e12,
          maxload: Number(problem.testConfig?.rMax || 0),
          minload: Number(problem.testConfig?.rMin || 0)
        };
      } else {
        // Signal Test type metadata
        testbench = { isSignal: true };
      }

      const problemData = {
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        topics: problem.topics,
        creatorId: user.uid,
        creatorName: user.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        testbench,
        testType: problemType, // Storing the new tri-state type
        timeStep: problem.timeStep,
        sampleCount: problem.sampleCount
      };

      const problemRef = await addDoc(collection(db, "Problems"), problemData);

      // 2. Save Initial Circuit Template
      await setDoc(doc(db, "Problems", problemRef.id, "initialCircuit", "data"), {
        version: 1,
        payload: problem.templateCircuit
      });

      // 3. Save solutions
      const sampleRate = 1 / Number(problem.timeStep);
      const tests = problemType === "signal" ? { test1 } : { test1, test2, test3 };

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
          isDigital={problemType === "digital"}
        />
      </div>

      {/* SIDEBAR CONTROLS */}
      <div className="w-[30%] h-full p-8 flex flex-col gap-6 border-l bg-base-50 overflow-y-auto text-black">
        <div>
          <h2 className="text-2xl font-black uppercase italic text-blue-600 tracking-tighter">04. Solution Suite</h2>
          <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest text-gray-400">
            {problemType} mode
          </p>
        </div>

        {/* DYNAMIC METADATA INPUTS */}
        {problemType !== "signal" && (
          <div className="grid grid-cols-1 gap-3 p-4 bg-white border rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              {problemType === "digital" ? "Data Payloads" : "Testbench Loads (Ohms)"}
            </p>
            
            {problemType === "digital" ? (
              <>
                <input type="text" placeholder="Payload A" className="input input-bordered input-sm w-full font-mono" 
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
        )}

        {/* TEST SELECTOR - ONLY FOR MULTI-TEST MODES */}
        {problemType !== "signal" ? (
          <div className="tabs tabs-boxed bg-base-200 p-1">
            {[
              { id: "test1", label: problemType === "digital" ? "Test A" : "No Load" },
              { id: "test2", label: problemType === "digital" ? "Test B" : "Max Load" },
              { id: "test3", label: problemType === "digital" ? "Test C" : "Min Load" }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTest(t.id)}
                className={`tab flex-1 font-bold transition-all ${activeTest === t.id ? "tab-active bg-blue-600 text-white" : ""}`}>
                {problem.solutions[t.id] ? "✓ " : ""}{t.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg">
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Signal Capture Mode</p>
            <p className="text-sm font-bold">{problem.solutions.test1 ? "Waveform Captured ✓" : "Awaiting Capture..."}</p>
          </div>
        )}

        {/* INSTRUCTION CARD */}
        <div className="p-5 bg-white border rounded-2xl shadow-sm">
          <p className="text-[11px] leading-relaxed text-gray-500 italic">
            {problemType === "digital" && "Update simulator SRAM, then click 'Submit' in the simulator window."}
            {problemType === "load" && "Match the Voltmeter resistance in the simulator to the values above, then click 'Submit'."}
            {problemType === "signal" && "Ensure the circuit is configured for its primary function (clipping, filtering, etc.) and click 'Submit' to capture the gold standard."}
          </p>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-auto space-y-3 pt-6 border-t">
          <button onClick={onBack} className="btn btn-ghost w-full btn-sm opacity-50 uppercase">Back</button>
          <button 
            disabled={isPublishing || (problemType === "signal" ? !problem.solutions.test1 : !problem.solutions.test3)} 
            onClick={finalizeProblem} 
            className="btn btn-primary w-full shadow-lg font-black uppercase tracking-widest"
          >
            {isPublishing ? <span className="loading loading-spinner"></span> : "Publish Problem"}
          </button>
        </div>
      </div>
    </section>
  );
}