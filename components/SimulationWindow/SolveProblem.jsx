"use client";

import Simulator from "@/components/Simulator";
import SimulatorEmbed from "@/components/SimulatorEmbed";
import AutoMarker from "@/components/SimulationWindow/AutoMarker/AutoMarker.jsx";
import { EMBED_CONFIG } from "@/lib/embedConfig";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

export default function SolveProblem({ circuit, topics = [], testbench, testType, simulatorType = "circuitjs", starterCode, sampleCount, timeStep }) {
  const { id: problemId } = useParams();
  const [simResults, setSimResults] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isEmbedded = simulatorType !== "circuitjs";

  const [activeTestTab, setActiveTestTab] = useState("test1");
  const [testSuite, setTestSuite] = useState({ test1: null, test2: null, test3: null });
  const [currentCircuit, setCurrentCircuit] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  // Stable ref so AutoMarker's useCallback dep doesn't change on every render.
  const handleCompleted = useCallback(() => setIsCompleted(true), []);

  // Load draft from localStorage on mount. For embedded sims the "circuit" is
  // a code string (starterCode), not a CircuitJS netlist, but the same
  // draft-persistence key works unchanged.
  useEffect(() => {
    const saved = localStorage.getItem(`draft_${problemId}`);
    setCurrentCircuit(saved || (isEmbedded ? starterCode : circuit));
  }, [problemId, circuit, starterCode, isEmbedded]);

  const handleSimSubmit = (data, sim) => {
    if (sim && typeof sim.exportCircuit === "function") {
      const exported = sim.exportCircuit();
      setCurrentCircuit(exported);
      localStorage.setItem(`draft_${problemId}`, exported);
    }
    setSimResults(data);
  };

  // Embedded-sim (fpga/mcu) submit: the sim posts back {code, ok, log, changes,
  // raw}. Persist the code as the draft, then hand the payload straight to
  // AutoMarker — it already knows (via `ok === false`) to show the log instead
  // of grading.
  const handleEmbedResult = useCallback((payload) => {
    if (payload?.code) {
      setCurrentCircuit(payload.code);
      localStorage.setItem(`draft_${problemId}`, payload.code);
    }
    setSimResults(payload);
  }, [problemId]);

  const confirmReset = () => {
    localStorage.removeItem(`draft_${problemId}`);
    setCurrentCircuit(isEmbedded ? starterCode : circuit);
    setTestSuite({ test1: null, test2: null, test3: null });
    setResetKey(prev => prev + 1);
    setIsCompleted(false);
    setShowResetConfirm(false);
  };

  // For load problems, the three testbench resistances drive an automated
  // No-load / Max / Min sweep inside the simulator (one Submit captures all
  // three). null for signal/digital, which capture a single waveform.
  const loads = testType === "load"
    ? {
        test1: testbench?.noload ?? 1e12,
        test2: testbench?.maxload,
        test3: testbench?.minload,
      }
    : null;

  if (currentCircuit === null) return null;

  return (
    <div className="h-screen w-full overflow-y-auto bg-white scroll-smooth relative">

      {/* SUCCESS OVERLAY */}
      {isCompleted && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-green-500/40 flex items-center gap-4 backdrop-blur-md">
            <div className="bg-green-600 p-2 rounded-full shadow-lg shadow-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Problem Solved</p>
              <p className="text-xs font-bold text-slate-200">Challenge Marked as Complete</p>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">Reset to Template?</h3>
            <p className="text-sm text-gray-500">This will discard your current circuit and all captured results. This cannot be undone.</p>
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {simResults && (
        <AutoMarker
          testType={testType}
          simulatorType={simulatorType}
          activeTestTab={activeTestTab}
          setActiveTestTab={setActiveTestTab}
          testSuite={testSuite}
          setTestSuite={setTestSuite}
          onBack={() => setSimResults(null)}
          capturedData={simResults}
          topics={topics}
          testbench={testbench}
          problemId={problemId}
          onCompleted={handleCompleted}
        />
      )}

      {/* The embedded sim stays MOUNTED (just display:none) while results
          show — unmounting would reload the whole cross-origin sim app on
          back-nav and lose the user's editor/waveform state, restorable only
          via a racy re-init. circuitjs runs in-process and restores from the
          exported netlist, so it keeps the cheaper unmount behaviour. */}
      {isEmbedded ? (
        <div className={`relative h-full ${simResults ? "hidden" : ""}`}>
          <SimulatorEmbed
            key={`${problemId}-${resetKey}`}
            {...EMBED_CONFIG[simulatorType]}
            bridge={{
              mode: "solve",
              starterCode: currentCircuit,
              testbench: testbench?.testbench,
              engine: testbench?.engine,
              signal: testbench?.signal,
              duration: testbench?.duration,
              onResult: handleEmbedResult,
            }}
          />
        </div>
      ) : !simResults && (
        <div className="relative h-full">
          <Simulator
            key={`${problemId}-${resetKey}`}
            circuit={currentCircuit}
            onSubmit={handleSimSubmit}
            isDigital={testType === "digital"}
            loads={loads}
            sampleCount={sampleCount}
            timeStep={timeStep}
          />
        </div>
      )}
    </div>
  );
}
