"use client";

import React, { useState } from "react"; // 1. Import useState
import { useAuth } from "@/components/Auth/AuthProvider.jsx";
import { Waypoints, School, Library, Star } from "lucide-react";

export default function Drawer({ createdProblems, isLoading }) {
  const { user } = useAuth();
  
  // 2. Initialize state with "library" so it starts active
  const [activeTab, setActiveTab] = useState("library");

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
          
          <div tabIndex={0} className="collapse collapse-arrow bg-base-100 border-base-300 border-t-1">
            <div className="flex collapse-title font-semibold after:start-5 after:end-auto pe-1 ps-12 text-gray-500 text-sm">My Problem List</div>
            <div className="flex justify-center collapse-content text-sm">
              <ul>
                {isLoading ? (
                  <li><a>Loading...</a></li>
                ) : user?.role === "user" ? (
                  <button className="btn btn-soft btn-sm btn-warning">Become a creator</button>
                ) : createdProblems.length > 0 ? (
                  createdProblems.map((p) => (
                    <li className="text-sm text-gray-700" key={p.id}>
                      <a href={`/problem/${p.id}`}>
                      <Star size={18} color="#39c663" />
                      {p.title}</a>
                    </li>
                  ))
                ) : (
                  <li><a className="italic opacity-50">No problems found</a></li>
                )}
              </ul>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
}