"use client";

import Navbar from "@/components/Navbar";
import ProblemWindow from "@/components/ProblemWindow";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingAnimation from "@/components/LoadingAnimation";
import SolveProblem from "@/components/SolveProblem";

export default function ProblemPage() {
  const { id } = useParams();  // ← actual dynamic route param

  console.log("Problem ID from URL:", id);

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

  if (loading) return <LoadingAnimation />;
  if (!problem) return <div className="p-10">Problem not found.</div>;

  return (
    <>
      <Navbar />
      <div className="h-screen w-full grid grid-cols-1 lg:grid-cols-2">
        <ProblemWindow problem={problem} />
        <SolveProblem circuit={problem.initialCircuit} solution={problem.solutionWaveform} />
      </div>
    </>
  );
}