import Navbar from "@/components/Navbar";
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

  useEffect(() => {
    if (!id) return;

    const loadProblem = async () => {
      const ref = doc(db, "problems", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProblem(snap.data());
      } else {
        setProblem(null);
      }
      setLoading(false);
    };

    loadProblem();
  }, [id]);

  /**
   * Determine the simulation timestep based on the problem's categorized topics.
   */
  const getTimestepForProblem = () => {
    if (!problem || !problem.topic) return 5e-6; // Default fallback

    // Logic synchronized with CreateProblem.jsx
    if (problem.topic.includes("Power Electronics")) {
      return 1e-3; // 50 microseconds
    }
    
    if (problem.topic.some(t => t.includes("RF") || t.includes("Microwave"))) {
      return 1e-9; // 1 nanosecond for high frequency
    }

    return 5e-6; // Standard 5 microseconds
  };

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
          timestep={getTimestepForProblem()} 
          topics={problem.topic || []}
        />
      </div>
    </>
  );
}