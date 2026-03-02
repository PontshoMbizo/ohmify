"use client";

import Simulator from "@/components/Simulator";
import AutoMarker from "@/components/SimulationWindow/AutoMarker/AutoMarker.jsx";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SolveProblem({ circuit, solution, topics = [], testbench, testType, sampleCount }) {
  const { id: problemId } = useParams();
  const [simResults, setSimResults] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // --- LIFTED STATE ---
  // Tracks the active tab and the grades for the current session
  const [activeTestTab, setActiveTestTab] = useState("test1"); 
  const [testSuite, setTestSuite] = useState({
    test1: null,
    test2: null,
    test3: null,
  });

  const [currentCircuit, setCurrentCircuit] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  // 1. Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`draft_${problemId}`);
    if (savedProgress) {
      setCurrentCircuit(savedProgress);
    } else {
      setCurrentCircuit(circuit);
    }
  }, [problemId, circuit]);

  // 2. MONITOR TEST SUITE FOR COMPLETION
  // Completion depends on testType: Signal requires 1 pass, others require 3
  useEffect(() => {
    const checkCompletion = async () => {
      const multiTestPassed = testSuite.test1?.passed && testSuite.test2?.passed && testSuite.test3?.passed;
      const signalPassed = testType === "signal" && testSuite.test1?.passed;

      if ((multiTestPassed || signalPassed) && !isCompleted) {
        setIsCompleted(true);
        await handleMarkAsComplete();
      }
    };
    checkCompletion();
  }, [testSuite, testType, isCompleted]);

  // 3. PERSISTENCE LOGIC
  const handleMarkAsComplete = async () => {
    // Replace with your actual Auth context/state
    const userId = "placeholder_user_id"; 
    
    try {
      const progressRef = doc(db, "UserProgress", `${userId}_${problemId}`);
      await setDoc(progressRef, {
        userId,
        problemId,
        status: "completed",
        completedAt: serverTimestamp(),
        score: 100
      }, { merge: true });
      
      console.log("Persistence: Problem marked as complete in Firestore.");
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  // 4. HANDLERS
  const handleBack = () => {
    setSimResults(null);
  };

  const handleSimSubmit = (data, sim) => {
    if (sim && typeof sim.exportCircuit === 'function') {
      const exported = sim.exportCircuit();
      setCurrentCircuit(exported);
      localStorage.setItem(`draft_${problemId}`, exported);
    }
    setSimResults(data);
  };

  const resetToTemplate = () => {
    if (confirm("Reset circuit to original template? This will delete your progress.")) {
      localStorage.removeItem(`draft_${problemId}`);
      setCurrentCircuit(circuit);
      setTestSuite({ test1: null, test2: null, test3: null });
      setResetKey(prev => prev + 1);
      setIsCompleted(false);
    }
  };

  if (currentCircuit === null) return null;

  return (
    <div className="h-screen w-full overflow-y-auto bg-white scroll-smooth relative">
      
      {/* SUCCESS OVERLAY - Obsidian Aesthetic */}
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

      {simResults ? (
        <AutoMarker
          testType={testType}
          activeTestTab={activeTestTab}
          setActiveTestTab={setActiveTestTab} 
          testSuite={testSuite}
          setTestSuite={setTestSuite}
          onBack={handleBack} 
          solution={solution} 
          capturedData={simResults} 
          topics={topics}
          testbench={testbench}
        />
      ) : (
        <div className="relative h-full">
          <button 
            onClick={resetToTemplate}
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