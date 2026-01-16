"use client";

import React from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import LoadingAnimation from "@/components/LoadingAnimation";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingAnimation />;
  if (!user) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <p className="text-gray-400 italic">Please sign in to access your engineer profile.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-20 pb-10 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT COLUMN: IDENTIFICATION */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative border-[6px] border-green-500/10 p-2 rounded-full mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-green-600 shadow-xl shadow-green-100">
                <img 
                  src={user.photoURL} 
                  alt="Engineer Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-4 right-4 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>
            
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-black tracking-tight text-gray-900">{user.displayName}</h1>
              <p className="text-green-600 font-mono text-sm font-bold mt-1 uppercase tracking-widest">
                {user.role || "user"}
              </p>
              <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-xs mb-2">
                Analyzing signals and optimizing circuits on the Ohmify platform. 
              </p>
            </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend text-green-500">change display name</legend>
                <input type="text" className="input" placeholder="Type here" />
                <p className="label">Optional</p>
              </fieldset>

          </div>
        </div>

        {/* RIGHT COLUMN: TECHNICAL DATA */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* STATS STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "SOLVED", val: user.completedProblems?.length || 0, color: "text-green-600" },
              { label: "POINTS", val: user.totalPoints || 0, color: "text-gray-900" },
              { label: "RANK", val: "#1.2k", color: "text-gray-900" }, //come back to this
              { label: "STREAK", val: `${user.streak || 0 + "d"}`, color: "text-orange-500" }
            ].map((stat, i) => (
              <div key={i} className="border-l-2 border-gray-100 pl-4 py-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.val}</p>
              </div>
            ))}
          </div>

          {/* PROGRESS LOG */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm shadow-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              LATEST SUBMISSIONS
            </h2>
            
            <div className="space-y-4">
              {user.completedProblems && user.completedProblems.length > 0 ? (
                user.completedProblems.map((prob, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-4 hover:bg-green-50 rounded-2xl transition-all border border-transparent hover:border-green-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">{prob.title}</h3>
                        <p className="text-xs text-gray-400 font-medium">Verified Simulation</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">100% Match</p>
                      <p className="text-[10px] text-gray-400 uppercase">{new Date(prob.solvedAt?.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
                  <p className="text-gray-300 italic">No circuits processed in current cycle.</p>
                </div>
              )}
            </div>
          </div>

          {/* SKILL HEATMAP PLACEHOLDER */}
          {/* <div className="bg-green-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-green-100">
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Mastery Level</h3>
                <p className="text-green-300 text-sm max-w-xs">You are currently in the top 15% of Analog Design challengers this month.</p>
                <button className="mt-6 bg-white text-green-900 font-bold px-6 py-2 rounded-full text-sm">View Analysis</button>
             </div>
             <svg className="absolute right-[-20px] bottom-[-20px] opacity-10 w-64 h-64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h4.5a.5.5 0 0 0 .5-.5v-.282a.52.52 0 0 0-.247-.437 8 8 0 1 1 8.494-.001.52.52 0 0 0-.247.438v.282a.5.5 0 0 0 .5.5H21"/></svg>
          </div> */}
        </div>
      </div>
    </div>
  );
}