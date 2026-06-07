'use client';

import Link from "next/link";
import { useState } from "react";
import LoadingAnimation from "./LoadingAnimation";
import { GeneralUtils } from "@/lib/GeneralUtils";

export default function ProblemList({
  allProblems,
  isLoading,
  completedIds = new Set(),
  onLoadMore,
  hasMore,
  loadingMore,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("All");

  const tags = ["All", ...GeneralUtils.PROBLEM_TYPES];

  const filtered = selectedTopic === "All"
    ? allProblems
    : allProblems.filter(p => Array.isArray(p.topics) && p.topics.includes(selectedTopic));

  const diffColor = (difficulty) => ({
    Easy:   "text-green-500",
    Medium: "text-yellow-500",
    Hard:   "text-red-500"
  }[difficulty] || "text-gray-400");

  if (isLoading) return <LoadingAnimation />;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Topic Filter Bar */}
      <div className="flex mt-4">
        <div className={`flex flex-wrap items-center gap-2 p-1 transition-all duration-300 overflow-hidden mt-4 ${isExpanded ? "h-auto" : "h-8"}`}>
          {tags.map(tag => (
            <div key={tag} className="flex items-center">
              <button
                onClick={() => setSelectedTopic(tag)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-all whitespace-nowrap
                  ${selectedTopic === tag ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {tag}
              </button>
              <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-400">
                {tag === "All" ? allProblems.length : allProblems.filter(p => p.topics?.includes(tag)).length}
              </span>
            </div>
          ))}
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="absolute right-16 flex items-center text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
          {isExpanded ? 'Collapse' : 'Expand'}
          <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Problem Navigation Menu */}
      <ul className="menu bg-base-100 rounded-box w-[90%]">
        {filtered.map((p) => {
          const isDone = completedIds.has(p.id);
          return (
            <li key={p.id} className="border-b border-base-200 last:border-none">
              <label className="flex items-center gap-4 py-3 hover:bg-base-200 transition-colors px-4">
                <div className="flex shrink-0 w-6 justify-center">
                  {isDone ? (
                    <div className="bg-green-500 rounded-full p-0.5 animate-in zoom-in duration-300">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  )}
                </div>
                <Link className="flex-1 font-semibold" href={`/problem/${p.id}`}>
                  {p.title}
                </Link>
                <span className="hidden md:inline text-xs px-2 py-1 rounded opacity-60">
                  {Array.isArray(p.topics) ? p.topics[0] : p.topics}
                </span>
                <span className={`${diffColor(p.difficulty)} font-medium w-20 text-right`}>
                  {p.difficulty}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/* M1: Load more — only visible when there are more pages */}
      {hasMore && (
        <div className="flex justify-center pb-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
