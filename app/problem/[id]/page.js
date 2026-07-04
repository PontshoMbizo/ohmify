"use client";

import ProblemWindow from "@/components/ProblemDescriptionWindow/ProblemWindow";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingAnimation from "@/components/LoadingAnimation";
import SolveProblem from "@/components/SimulationWindow/SolveProblem";
import ResizableSplit from "@/components/ResizableSplit";

export default function ProblemPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // L2

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const loadProblem = async () => {
      try {
        // solutionWaveform (the golden waveforms) is deliberately NOT fetched
        // here — the docs are large packed sample strings that only the
        // Solutions tab needs; SampleSolution lazy-loads them on first open.
        const [metaSnap, circuitSnap] = await Promise.all([
          getDoc(doc(db, "Problems", id)),
          getDoc(doc(db, "Problems", id, "initialCircuit", "data")),
        ]);

        if (controller.signal.aborted) return;

        if (!metaSnap.exists()) {
          setProblem(null);
          return;
        }

        const metaData = metaSnap.data();
        setProblem({
          ...metaData,
          id,
          initialCircuit: circuitSnap.data()?.payload || "",
          testType: metaData.testType?.trim() || (metaData.isDigital ? "digital" : "load"),
          simulatorType: metaData.simulatorType || "circuitjs",
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error loading problem:", err);
        setError("Failed to load problem. Check your connection and try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadProblem();
    return () => controller.abort();
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
      <ResizableSplit
        left={<ProblemWindow problem={problem} />}
        right={
          <SolveProblem
            circuit={problem.initialCircuit}
            topics={problem.topics || []}
            sampleCount={problem.sampleCount}
            timeStep={problem.timeStep}
            testbench={problem.testbench}
            testType={problem.testType}
            simulatorType={problem.simulatorType}
            starterCode={problem.starterCode}
          />
        }
      />
    </div>
  );
}
