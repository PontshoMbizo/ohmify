'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingAnimation from "./LoadingAnimation";
import { GeneralUtils } from "@/lib/GeneralUtils";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function ProblemList() {

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("All");

  // Updated to match the types defined in CreateProblem.jsx
const tags = [
  "All", ...GeneralUtils.PROBLEM_TYPES
];
  

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        // Changed collection name to "Problems" to match your new schema
        const q = query(collection(db, "Problems"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProblems(list);
      } catch (error) {
        console.error("Error fetching problems:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  // UPDATED FILTER LOGIC:
  // p.topic is now an array. We check if that array includes the selectedTopic string.
  const filtered = selectedTopic === "All"
    ? problems
    : problems.filter(p => Array.isArray(p.topics) && p.topics.includes(selectedTopic));

    console.log(problems);
  const diffColor = (difficulty) => ({
    Easy:   "text-green-500",
    Medium: "text-yellow-500",
    Hard:   "text-red-500"
  }[difficulty] || "text-gray-400");

  if (loading) return <LoadingAnimation />;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">

      {/* FILTER BAR — LeetCode Style */}
      <div className="flex mt-4">
    <div className={`flex flex-wrap items-center gap-2 p-1 transition-all duration-300 overflow-hidden mt-4 ${isExpanded ? "h-auto" : "h-8"}`}>
          {tags.map(tag => (
            <div key={tag} className="flex items-center">
              <button
                onClick={() => setSelectedTopic(tag)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-all whitespace-nowrap
                  ${selectedTopic === tag 
                    ? "bg-green-600 text-white" 
                    : "text-gray-500 hover:bg-gray-100"}`}
              >
                {tag}
              </button>
              {/* Optional: Counter badge as seen in your image */}
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-400">
                {tag === "All" ? problems.length : problems.filter(p => p.topics?.includes(tag)).length}
              </span>
            </div>
          ))}
        </div>
                    {/* Expand/Collapse Trigger */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute right-16 flex items-center z-[20] text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            <svg 
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          </div>
      {/* PROBLEM LIST */}
      <ul className="menu bg-base-100 rounded-box w-[70%]">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <li key={p.id} className="border-b border-base-200 last:border-none">
              <label className="flex items-center gap-4 py-3 hover:bg-base-200 transition-colors">
                <Link className="flex-1 font-semibold px-4" href={`/problem/${p.id}`}>
                  {p.title}
                </Link>

                {/* Display primary topic tag (optional UI hint) */}
                <span className="hidden md:inline text-xs px-2 py-1 rounded opacity-60">
                  {Array.isArray(p.topic) ? p.topic[0] : p.topic}
                </span>

                <span className={`${diffColor(p.difficulty)} font-medium w-20 text-right`}>
                  {p.difficulty}
                </span>
              </label>
            </li>
          ))
        ) : (
          <div className="p-10 text-center opacity-50 italic">
            No problems found for this category.
          </div>
        )}
      </ul>
    </div>
  );
}