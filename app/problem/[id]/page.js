"use client";

import ProblemWindow from "@/components/ProblemDescriptionWindow/ProblemWindow";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingAnimation from "@/components/LoadingAnimation";
import SolveProblem from "@/components/SimulationWindow/SolveProblem";

export default function ProblemPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // L2

  useEffect(() => {
    if (!id) return;
    const loadProblem = async () => {
      try {
        const [metaSnap, circuitSnap] = await Promise.all([
          getDoc(doc(db, "Problems", id)),
          getDoc(doc(db, "Problems", id, "initialCircuit", "data")),
        ]);

        if (!metaSnap.exists()) {
          setProblem(null);
          return;
        }

        const metaData = metaSnap.data();
        setProblem({
          ...metaData,
          id,
          initialCircuit: circuitSnap.data()?.payload || "",
          // M3: sampleRate comes from the top-level document, not subcollection iteration.
          // L1: trim() ensures an accidental empty string doesn't fall through as falsy.
          testType: metaData.testType?.trim() || (metaData.isDigital ? "digital" : "load"),
        });
      } catch (err) {
        // L2: distinguish a network/permission error from a missing document.
        console.error("Error loading problem:", err);
        setError("Failed to load problem. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    loadProblem();
  }, [id]);

  if (loading) return <LoadingAnimation />;
  if (error) return (
    <div className="p-10 text-center space-y-2">
      <p className="font-bold text-red-500">{error}</p>
      <button onClick={() => window.location.reload()} className="text-sm text-gray-400 underline">
        Retry
      </button>
    </div>
  );
  if (!problem) return <div className="p-10 text-center font-bold">Problem not found.</div>;

  return (
    <div className="h-[calc(100vh)] w-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden items-stretch">
        <ProblemWindow problem={problem} />
        <SolveProblem
          circuit={problem.initialCircuit}
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
