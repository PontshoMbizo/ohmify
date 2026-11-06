"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, doc, getDoc
} from "firebase/firestore";
import LoadingAnimation from "@/components/LoadingAnimation";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  const [completedProblems, setCompletedProblems] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);

  // Fetch completed problems from UserProgress (authoritative source after C1 migration)
  useEffect(() => {
    if (!user?.uid) { setProgressLoading(false); return; }
    const load = async () => {
      try {
        const q = query(
          collection(db, "UserProgress"),
          where("userId", "==", user.uid),
          where("status", "==", "completed")
        );
        const snap = await getDocs(q);
        const rows = await Promise.all(
          snap.docs.map(async (d) => {
            const { problemId, completedAt, score } = d.data();
            const probSnap = await getDoc(doc(db, "Problems", problemId));
            return {
              problemId,
              title: probSnap.exists() ? probSnap.data().title : problemId,
              difficulty: probSnap.exists() ? probSnap.data().difficulty : "",
              topics: probSnap.exists() && Array.isArray(probSnap.data().topics)
                ? probSnap.data().topics
                : [],
              completedAt,
              score: score ?? 100,
            };
          })
        );
        rows.sort((a, b) => (b.completedAt?.seconds ?? 0) - (a.completedAt?.seconds ?? 0));
        setCompletedProblems(rows);
      } catch (err) {
        console.error("Error loading completed problems:", err);
      } finally {
        setProgressLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  // Solved-problem counts per engineering domain, most active first.
  const domainCounts = useMemo(() => {
    const counts = new Map();
    completedProblems.forEach(p =>
      p.topics.forEach(t => counts.set(t, (counts.get(t) || 0) + 1))
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [completedProblems]);

  if (loading) return <LoadingAnimation />;
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Profile</p>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Sign in required</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Sign in to view your engineer profile and submission history.
          </p>
          <Link href="/" className="inline-block text-sm text-green-600 font-semibold hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const diffColor = { Easy: "text-green-500", Medium: "text-yellow-500", Hard: "text-red-500" };
  const solvedCount = completedProblems.length;
  const streak = user.streak ?? 0;
  const memberSince = user.createdAt?.seconds
    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-20 pb-10 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* ── LEFT: IDENTIFICATION ─────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex flex-col items-center lg:items-start">

            {/* Avatar */}
            <div className="relative border-[6px] border-green-500/10 p-2 rounded-full mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-green-600 shadow-xl shadow-green-100">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-5xl font-black">
                    {(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 right-4 bg-green-500 w-6 h-6 rounded-full border-4 border-white" />
            </div>

            {/* Identity */}
            <div className="text-center lg:text-left w-full">
              <h1 className="text-3xl font-black tracking-tight text-gray-900">{user.displayName}</h1>
              <p className="text-green-600 font-mono text-sm font-bold mt-1 uppercase tracking-widest">
                {user.role || "user"}
              </p>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">
                {user.email}
              </p>
              {memberSince && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-4">
                  Member since {memberSince}
                </p>
              )}
            </div>

            {/* Account link — editing lives in /settings */}
            <Link
              href="/settings"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-green-600 transition-colors border border-gray-200 hover:border-green-400 rounded-full px-4 py-1.5"
            >
              <Settings size={15} /> Manage account
            </Link>
          </div>
        </div>

        {/* ── RIGHT: TECHNICAL DATA ────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-10">

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "SOLVED",  val: solvedCount,             color: "text-green-600" },
              { label: "POINTS",  val: user.totalPoints ?? 0,   color: "text-gray-900"  },
              { label: "RANK",    val: "—",                     color: "text-gray-400"  },
              { label: "STREAK",  val: `${streak}d`,            color: "text-orange-500"},
            ].map((stat, i) => (
              <div key={i} className="border-l-2 border-gray-100 pl-4 py-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Domain breakdown */}
          {domainCounts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Active Domains</p>
              <div className="flex flex-wrap gap-2">
                {domainCounts.map(([topic, count]) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold"
                  >
                    {topic}
                    <span className="bg-green-600 text-white rounded-full px-1.5 text-[10px] font-black">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Latest submissions */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm shadow-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full" />
              LATEST SUBMISSIONS
            </h2>

            {progressLoading ? (
              <div className="flex justify-center py-12"><LoadingAnimation /></div>
            ) : completedProblems.length > 0 ? (
              <div className="space-y-3">
                {completedProblems.map((prob) => (
                  <Link
                    key={prob.problemId}
                    href={`/problem/${prob.problemId}`}
                    className="group flex items-center justify-between p-4 hover:bg-green-50 rounded-2xl transition-all border border-transparent hover:border-green-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                          {prob.title}
                        </h3>
                        <p className={`text-xs font-semibold ${diffColor[prob.difficulty] || "text-gray-400"}`}>
                          {prob.difficulty || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-gray-900">{prob.score}%</p>
                      <p className="text-[10px] text-gray-400 uppercase">
                        {prob.completedAt?.seconds
                          ? new Date(prob.completedAt.seconds * 1000).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-gray-300 italic">No circuits processed yet.</p>
                <Link href="/problem" className="mt-4 inline-block text-sm text-green-500 font-semibold hover:underline">
                  Browse problems →
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
