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
        const metaRef = doc(db, "Problems", id);
        const metaSnap = await getDoc(metaRef);

        if (metaSnap.exists()) {
          const metaData = metaSnap.data();
          const [circuitSnap, solutionDocs] = await Promise.all([
            getDoc(doc(db, "Problems", id, "initialCircuit", "data")),
            getDocs(collection(db, "Problems", id, "solutionWaveform"))
          ]);

          const solutionsMap = {};
          let sampleRate = 0;
          
          solutionDocs.forEach((doc) => {
            const data = doc.data();
            solutionsMap[doc.id] = data.samples || "";
            if (data.sampleRate) sampleRate = data.sampleRate;
          });

          setProblem({
            ...metaData,
            id: id,
            initialCircuit: circuitSnap.data()?.payload || "",
            solutions: solutionsMap, 
            sampleRate: sampleRate,
            testType: metaData.testType || (metaData.isDigital ? "digital" : "load")
          });
        } else {
          setProblem(null);
        }
      } catch (error) {
        console.error("Error loading problem:", error);
        setProblem(null);
      } finally {
        setLoading(false);
      }
    };
    loadProblem();
  }, [id]);

  if (loading) return <LoadingAnimation />;
  if (!problem) return <div className="p-10 text-center font-bold">Problem not found.</div>;

  return (
    /* h-[calc(100vh-64px)] ensures the layout fits perfectly under a 64px navbar */
    <div className="h-[calc(100vh)] w-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden items-stretch">
        
        {/* Left Column: Scrollable internally via ProblemWindow */}
        <ProblemWindow problem={problem} />
        
        {/* Right Column: Simulator & Verification */}
        <SolveProblem 
          circuit={problem.initialCircuit} 
          solution={problem.solutions}
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