"use client";

import Simulator from "@/components/Simulator";
import AutoMarker from "@/components/AutoMarker/AutoMarker.jsx";
import { useState } from "react";

export default function SolveProblem({ circuit, solution }) {
  const [simResults, setSimResults] = useState(null);

  const handleSimSubmit = (data, sim) => {
    setSimResults(data);
  };

  return (
    <div className="h-screen w-full overflow-y-auto border-l border-gray-200 bg-white">
      {simResults ? (
        <AutoMarker 
          onBack={() => setSimResults(null)} 
          solution={solution} 
          capturedData={simResults} 
        />
      ) : (
        <Simulator
          nodes={["output", "input"]} 
          circuit={circuit}
          onSubmit={handleSimSubmit}
        />
      )}
    </div>
  );
}