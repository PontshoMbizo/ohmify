"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider.jsx";
import { Waypoints, School, Library, Star } from "lucide-react";

const TABS = [
  { id: "library", label: "Library",    icon: Library  },
  { id: "grind",   label: "Grind Mode", icon: Waypoints },
  { id: "study",   label: "Study Plan", icon: School   },
];

function ComingSoonPanel({ title, description }) {
  return (
    <div className="mt-4 mx-1 p-4 rounded-xl border border-dashed border-gray-200 text-center space-y-2">
      <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-widest">
        Coming Soon
      </span>
      <p className="text-xs font-semibold text-gray-600">{title}</p>
      <p className="text-[11px] text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default function Drawer({ createdProblems, isLoading }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("library");
  const [myListOpen, setMyListOpen] = useState(false);

  return (
    <div className="drawer lg:drawer-open w-60 overflow-hidden">
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
      <div className="drawer-side">
        <label htmlFor="my-drawer-3" aria-label="close sidebar" className="drawer-overlay" />
        <div className="bg-base-800 border-r border-gray-200 min-h-full w-60 flex flex-col p-4 pt-8 gap-2 text-gray-800 text-[15px] font-medium">

          {/* Tab nav */}
          <ul className="menu gap-1 p-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id} className="pb-1">
                <button
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 w-full text-left rounded-lg px-3 py-2 transition-colors ${
                    activeTab === id ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} /> {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Tab content */}
          <div className="border-t border-gray-200 pt-3 flex-1">
            {activeTab === "library" && (
              <>
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
                    ) : createdProblems?.length > 0 ? (
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
              </>
            )}

            {activeTab === "grind" && (
              <ComingSoonPanel
                title="Grind Mode"
                description="Timed problem sets with streak tracking and difficulty scaling. Train like you mean it."
              />
            )}

            {activeTab === "study" && (
              <ComingSoonPanel
                title="Study Plan"
                description="Curated learning paths by topic — Analog, Digital, RF, and more. Follow a structured curriculum."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
