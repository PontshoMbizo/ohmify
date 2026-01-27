"use client";

import Simulator from "@/components/Simulator";
import AutoMarker from "@/components/SimulationWindow/AutoMarker/AutoMarker.jsx";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function SolveProblem({ circuit, solution, topics = [], testbench,sampleCount }) {
  const { id: problemId } = useParams();
  const [simResults, setSimResults] = useState(null);
  
  // --- LIFTED STATE ---
  // These stay alive even when AutoMarker unmounts
  const [activeTestTab, setActiveTestTab] = useState("test1"); 
  const [testSuite, setTestSuite] = useState({
    test1: null,
    test2: null,
    test3: null,
  });

  const [currentCircuit, setCurrentCircuit] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  // 1. Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`draft_${problemId}`);
    if (savedProgress) {
      setCurrentCircuit(savedProgress);
    } else {
      setCurrentCircuit(circuit);
    }
  }, [problemId, circuit]);

  // 2. Navigation
  const handleBack = () => {
    setSimResults(null);
  };

  const handleSimSubmit = (data, sim) => {
    if (sim && typeof sim.exportCircuit === 'function') {
      const exported = sim.exportCircuit();
      setCurrentCircuit(exported);
      localStorage.setItem(`draft_${problemId}`, exported);
    }
    // This triggers the view switch to AutoMarker
    setSimResults(data);
  };

  const resetToTemplate = () => {
    if (confirm("Reset circuit to original template? This will delete your progress.")) {
      localStorage.removeItem(`draft_${problemId}`);
      setCurrentCircuit(circuit);
      setTestSuite({ test1: null, test2: null, test3: null }); // Clear grades too
      setResetKey(prev => prev + 1);
    }
  };

  if (currentCircuit === null) return null;

  return (
    <div className="h-screen w-full overflow-y-auto bg-white">
      {simResults ? (
        <AutoMarker
          // Pass the lifted state props
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
            className="absolute bottom-20 right-9 z-10 hover:text-green-500 hover:cursor-pointer text-xs font-semibold"
          >
            Reset Circuit
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