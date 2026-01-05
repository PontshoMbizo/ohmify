"use client";

import Simulator from "@/components/Simulator";
import AutoMarker from "@/components/SimulationWindow/AutoMarker/AutoMarker.jsx";
import {GeneralUtils} from "@/lib/GeneralUtils";
import { useState } from "react";

export default function SolveProblem({ circuit, solution, timestep, topics = [] }) {
  const [simResults, setSimResults] = useState(null);

  const handleSimSubmit = (data, sim) => {
    // Ensure the simulator is using the problem-specific timestep
    sim.setMaxTimeStep(timestep);
    setSimResults(data);
  };

  return (
    <div className="h-screen w-full overflow-y-auto border-l border-gray-200 bg-white">
      {simResults ? (
        <AutoMarker 
          onBack={() => setSimResults(null)} 
          solution={solution} 
          capturedData={simResults} 
          timestep={timestep}
          topics={topics}
        />
      ) : (
        <Simulator
          // Nodes are ignored by Simulator in Digital Mode (Discovery takes over)
          nodes={["output", "input"]} 
          circuit={circuit}
          onSubmit={handleSimSubmit}
          timestep={timestep}
          isDigital={GeneralUtils.isDigitalProblem(topics)}
        />
      )}
    </div>
  );
}