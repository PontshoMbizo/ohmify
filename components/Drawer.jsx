"use client";

import React, { useState } from "react"; // 1. Import useState
import { useAuth } from "@/components/Auth/AuthProvider.jsx";
import { Waypoints, School, Library, Star } from "lucide-react";

export default function Drawer({ createdProblems, isLoading }) {
  const { user } = useAuth();
  
  // 2. Initialize state with "library" so it starts active
  const [activeTab, setActiveTab] = useState("library");
  const [myListOpen, setMyListOpen] = useState(false);

  return (
    <div className="drawer lg:drawer-open w-60 overflow-hidden">
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
      <div className="drawer-side">
        <label htmlFor="my-drawer-3" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu bg-base-800 border-r-1 border-gray-200 min-h-full w-60 p-4 pt-8 gap-2 text-gray-800 text-[15px] font-medium">
          
          {/* Library - Active if state is "library" */}
          <li className="pb-1">
            <a 
              onClick={() => setActiveTab("library")} 
              className={activeTab === "library" ? "bg-gray-300" : ""}
              href="#library"
            >
              <Library size={18} /> Library
            </a>
          </li>

          {/* Grind Mode - Active if state is "grind" */}
          <li className="pb-1">
            <a 
              onClick={() => setActiveTab("grind")} 
              className={activeTab === "grind" ? "bg-gray-300" : ""}
              href="#grind"
            >
              <Waypoints size={18} /> Grind Mode
            </a>
          </li>

          {/* Study Plan - Active if state is "study" */}
          <li className="pb-4">
            <a 
              onClick={() => setActiveTab("study")} 
              className={activeTab === "study" ? "bg-gray-300" : ""}
              href="#study"
            >
              <School size={18} /> Study Plan
            </a>
          </li>
          
          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={() => setMyListOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <span>My Problem List</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${myListOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {myListOpen && (
              <ul className="mt-1 space-y-0.5">
                {isLoading ? (
                  <li className="px-3 py-2 text-sm text-gray-400">Loading...</li>
                ) : user?.role === "user" ? (
                  <li className="px-3 py-2">
                    <button className="btn btn-soft btn-sm btn-warning w-full">Become a creator</button>
                  </li>
                ) : createdProblems.length > 0 ? (
                  createdProblems.map((p) => (
                    <li key={p.id}>
                      <a
                        href={`/problem/${p.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors truncate"
                      >
                        <Star size={14} color="#39c663" className="shrink-0" />
                        <span className="truncate">{p.title}</span>
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm italic text-gray-400">No problems found</li>
                )}
              </ul>
            )}
          </div>
        </ul>
      </div>
    </div>
  );
}