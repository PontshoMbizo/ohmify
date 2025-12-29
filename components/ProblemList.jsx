'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import LoadingAnimation from "./LoadingAnimation";

export default function ProblemList() {

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const topics = ["All", "Digital Logic", "DSP", "Control Systems", "Computer Architecture"];
  const [selectedTopic, setSelectedTopic] = useState("All");

  // Fetch problems once on load
  useEffect(() => {
    const fetchProblems = async () => {
      const snap = await getDocs(collection(db, "problems"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProblems(list);
      setLoading(false);
    };
    fetchProblems();
  }, []);

  const filtered = selectedTopic === "All"
    ? problems
    : problems.filter(p => p.topic === selectedTopic);

  const diffColor = (difficulty) => ({
    Easy:  "text-green-500",
    Medium:"text-yellow-500",
    Hard:  "text-red-500"
  }[difficulty] || "text-gray-400");
  if (loading) return <LoadingAnimation />;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">

      {/* FILTER BAR — LeetCode Style */}
      <div className="flex gap-3 overflow-x-auto p-2 mt-2">
        {topics.map(topic => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`px-5 py-2 rounded-full border font-medium transition-all
              ${selectedTopic === topic 
                ? "bg-black text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* PROBLEM LIST */}
      <ul className="menu bg-base-100 rounded-box">
        {filtered.map((p) => (
          <li key={p.id}>
            <label className="flex items-center gap-4 py-3">

              <Link className="flex-1" href={`/problem/${p.id}`}>
                {p.title}
              </Link>

              <span className="text-sm opacity-70 w-20">{p.rate}</span>

              <span className={`${diffColor(p.difficulty)} font-medium w-14 text-right`}>
                {p.difficulty}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
