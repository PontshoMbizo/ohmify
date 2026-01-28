"use client";

import ProblemWindow from "@/components/ProblemDescriptionWindow/ProblemWindow";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import LoadingAnimation from "@/components/LoadingAnimation";
import SolveProblem from "@/components/SimulationWindow/SolveProblem";

export default function ProblemPage() {
  const { id } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadProblem = async () => {
      try {
        // 1. Fetch main metadata (testbench values, title, etc.)
        const metaRef = doc(db, "Problems", id);
        const metaSnap = await getDoc(metaRef);

        if (metaSnap.exists()) {
          const metaData = metaSnap.data();

          // 2. Fetch "heavy" data: Circuit Template + All 3 Solution Documents
          const [circuitSnap, solutionDocs] = await Promise.all([
            getDoc(doc(db, "Problems", id, "initialCircuit", "data")),
            getDocs(collection(db, "Problems", id, "solutionWaveform"))
          ]);

          // 3. Map the solution sub-collection into an object { test1, test2, test3 }
          const solutionsMap = {};
          let sampleRate = 0;
          
          solutionDocs.forEach((doc) => {
            const data = doc.data();
            solutionsMap[doc.id] = data.samples || "";
            // Extract sampleRate from any one of the docs (they should be identical)
            if (data.sampleRate) sampleRate = data.sampleRate;
          });

          // 4. Assemble the full problem object for the UI
          setProblem({
            ...metaData,
            id: id,
            initialCircuit: circuitSnap.data()?.payload || "",
            // We pass the whole map so AutoMarker can switch between them
            solutions: solutionsMap, 
            sampleRate: sampleRate,
          });
          console.log("Loaded multi-test problem data:",solutionsMap);
        } else {
          setProblem(null);
        }
      } catch (error) {
        console.error("Error loading multi-test problem data:", error);
        setProblem(null);
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [id]);

  if (loading) return <LoadingAnimation />;
  if (!problem) return <div className="p-10 text-center font-bold">Problem not found.</div>;
console.log(problem.testbench);
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left: Description & Testbench Info */}
        <ProblemWindow problem={problem} />
        
        {/* Right: Simulator & AutoMarker */}
        <SolveProblem 
          circuit={problem.initialCircuit} 
          solution={problem.solutions} // Passing the {test1, test2, test3} object
          topics={problem.topics || []}
          sampleCount={problem.sampleCount}
          timeStep={problem.timeStep}
          testbench={problem.testbench}
          testType={problem.testType}
        />
      </div>
    </div>
  );
}