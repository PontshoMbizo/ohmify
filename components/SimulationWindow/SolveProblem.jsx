"use client";

import Simulator from "@/components/Simulator";
import AutoMarker from "@/components/SimulationWindow/AutoMarker/AutoMarker.jsx";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SolveProblem({ circuit, solution, topics = [], testbench, testType, sampleCount }) {
  const { id: problemId } = useParams();
  const { user } = useAuth();
  const [simResults, setSimResults] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [activeTestTab, setActiveTestTab] = useState("test1");
  const [testSuite, setTestSuite] = useState({ test1: null, test2: null, test3: null });
  const [currentCircuit, setCurrentCircuit] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`draft_${problemId}`);
    setCurrentCircuit(saved || circuit);
  }, [problemId, circuit]);

  // Monitor test suite for completion and persist when all tests pass
  useEffect(() => {
    if (isCompleted) return;

    const multiTestPassed =
      testSuite.test1?.verdict?.passed &&
      testSuite.test2?.verdict?.passed &&
      testSuite.test3?.verdict?.passed;
    const signalPassed = testType === "signal" && testSuite.test1?.verdict?.passed;

    if (!multiTestPassed && !signalPassed) return;

    let active = true;
    setIsCompleted(true);

    if (user?.uid) {
      const progressRef = doc(db, "UserProgress", `${user.uid}_${problemId}`);
      setDoc(progressRef, {
        userId: user.uid,
        problemId,
        status: "completed",
        completedAt: serverTimestamp(),
        score: 100
      }, { merge: true }).catch(err => {
        if (active) console.error("Failed to save progress:", err);
      });
    }

    return () => { active = false; };
  }, [testSuite, testType, isCompleted, user?.uid, problemId]);

  const handleSimSubmit = (data, sim) => {
    if (sim && typeof sim.exportCircuit === "function") {
      const exported = sim.exportCircuit();
      setCurrentCircuit(exported);
      localStorage.setItem(`draft_${problemId}`, exported);
    }
    setSimResults(data);
  };

  const confirmReset = () => {
    localStorage.removeItem(`draft_${problemId}`);
    setCurrentCircuit(circuit);
    setTestSuite({ test1: null, test2: null, test3: null });
    setResetKey(prev => prev + 1);
    setIsCompleted(false);
    setShowResetConfirm(false);
  };

  if (currentCircuit === null) return null;

  return (
    <div className="h-screen w-full overflow-y-auto bg-white scroll-smooth relative">

      {/* SUCCESS OVERLAY */}
      {isCompleted && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-4 backdrop-blur-md">
            <div className="bg-blue-600 p-2 rounded-full animate-bounce shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Mission Accomplished</p>
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

      {simResults ? (
        <AutoMarker
          testType={testType}
          activeTestTab={activeTestTab}
          setActiveTestTab={setActiveTestTab}
          testSuite={testSuite}
          setTestSuite={setTestSuite}
          onBack={() => setSimResults(null)}
          solution={solution}
          capturedData={simResults}
          topics={topics}
          testbench={testbench}
        />
      ) : (
        <div className="relative h-full">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="absolute bottom-20 right-4 z-10 text-slate-400 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest bg-white/80 py-1 px-2 rounded-full border border-slate-200"
          >
            Reset Template
          </button>
          <Simulator
            key={`${problemId}-${resetKey}`}
            circuit={currentCircuit}
            onSubmit={handleSimSubmit}
            isDigital={GeneralUtils.isDigitalProblem(topics)}
            sampleCount={sampleCount}
          />
        </div>
      )}
    </div>
  );
}
