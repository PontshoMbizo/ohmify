"use client";

import Navbar from "@/components/Navbar";
import ProblemWindow from "@/components/ProblemDescriptionWindow/ProblemWindow";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingAnimation from "@/components/LoadingAnimation";
import SolveProblem from "@/components/SimulationWindow/SolveProblem";
import { GeneralUtils } from "@/lib/GeneralUtils";

export default function ProblemPage() {
  const { id } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadProblem = async () => {
      try {
        // 1. Fetch main metadata
        const metaRef = doc(db, "Problems", id);
        const metaSnap = await getDoc(metaRef);

        if (metaSnap.exists()) {
          const metaData = metaSnap.data();

          // 2. Fetch "heavy" data from sub-collections in parallel
          const [circuitSnap, solutionSnap] = await Promise.all([
            getDoc(doc(db, "Problems", id, "initialCircuit", "data")),
            getDoc(doc(db, "Problems", id, "solutionWaveform", "data"))
          ]);

          // 3. Assemble the full problem object
          setProblem({
            ...metaData,
            id: id,
            initialCircuit: circuitSnap.data()?.payload || "",
            solutionWaveform: solutionSnap.data()?.samples || "",
            sampleRate: solutionSnap.data()?.sampleRate || 0
          });
        } else {
          setProblem(null);
        }
      } catch (error) {
        console.error("Error loading full problem data:", error);
        setProblem(null);
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [id]);

  /**
   * Determine the simulation timestep based on the problem's categorized topics.
   */
const timestep = GeneralUtils.getTimestepForProblem(problem);

 console.log("Determined timestep:", timestep);
  if (loading) return <LoadingAnimation />;
  if (!problem) return <div className="p-10">Problem not found.</div>;

  return (
    <>
      <Navbar />
      <div className="h-screen w-full grid grid-cols-1 lg:grid-cols-2">
        <ProblemWindow problem={problem} />
        <SolveProblem 
          circuit={problem.initialCircuit} 
          solution={problem.solutionWaveform} 
          timestep={timestep} 
          topics={problem.topics || []}
        />
      </div>
    </>
  );
}