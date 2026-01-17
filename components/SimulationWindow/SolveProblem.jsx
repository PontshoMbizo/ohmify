"use client";

import Simulator from "@/components/Simulator";
import AutoMarker from "@/components/SimulationWindow/AutoMarker/AutoMarker.jsx";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // To get the unique problem ID

export default function SolveProblem({ circuit, solution, topics = [], sampleCount }) {
  const { id: problemId } = useParams(); // Using problem ID as the storage key
  const [simResults, setSimResults] = useState(null);
  
  // Initialize state with null to avoid hydration mismatch
  const [currentCircuit, setCurrentCircuit] = useState(null);

  // KEY FOR UNMOUNTING
  const [resetKey, setResetKey] = useState(0);

  // 1. Load from localStorage on Mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`draft_${problemId}`);
    if (savedProgress) {
      setCurrentCircuit(savedProgress);
    } else {
      setCurrentCircuit(circuit); // Fallback to template if no save exists
    }
  }, [problemId, circuit]);

  // 2. Clear results and return to simulator
  const handleBack = () => {
    setSimResults(null);
  };

  const handleSimSubmit = (data, sim) => {
    if (sim && typeof sim.exportCircuit === 'function') {
      const exported = sim.exportCircuit();
      setCurrentCircuit(exported);
      
      // Save to localStorage immediately on submit
      localStorage.setItem(`draft_${problemId}`, exported);
    }
    setSimResults(data);
  };

  // 3. Optional: Add a "Clear Draft" function if the user wants to reset to template
  const resetToTemplate = () => {
    if (confirm("Reset circuit to original template? This will delete your progress.")) {
      localStorage.removeItem(`draft_${problemId}`);
      setCurrentCircuit(circuit);
      // INCREMENT KEY TO FORCE UNMOUNT/REMOUNT
      setResetKey(prev => prev + 1);
    }
  };

  if (currentCircuit === null) return null; // Wait for useEffect to load storage

  return (
    <div className="h-screen w-full overflow-y-auto border-l border-gray-200 bg-white">
      {simResults ? (
        <AutoMarker 
          onBack={handleBack} 
          solution={solution} 
          capturedData={simResults} 
          topics={topics}
        />
      ) : (
        <div className="relative h-full">
          {/* Reset Button UI */}
          <button 
            onClick={resetToTemplate}
            type="submit"
            className="absolute bottom-20 right-6 z-10 btn btn-sm btn-ghost text-wihte hover:text-white hover:bg-green-600"
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