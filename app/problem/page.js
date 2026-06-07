'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit, startAfter } from "firebase/firestore";
import Drawer from "@/components/Drawer.jsx";
import ProblemList from "@/components/ProblemList.jsx";

const PAGE_SIZE = 30;

export default function ProblemPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [error, setError] = useState(null);  // L2

  // M2: fetch problems once on mount — no user dependency, so no double fetch.
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        // M1: limit to PAGE_SIZE instead of full table scan.
        const q = query(collection(db, "Problems"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
        const snap = await getDocs(q);
        const docs = snap.docs;
        setProblems(docs.map(d => ({ id: d.id, ...d.data() })));
        setLastVisible(docs[docs.length - 1] ?? null);
        setHasMore(docs.length === PAGE_SIZE);
      } catch (err) {
        console.error("Error fetching problems:", err);
        setError("Failed to load problems. Please refresh the page.");  // L2
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  // M2: progress fetch is independent — runs when auth resolves without
  // re-fetching the problem list.
  useEffect(() => {
    if (!user?.uid) return;
    const fetchProgress = async () => {
      try {
        const q = query(
          collection(db, "UserProgress"),
          where("userId", "==", user.uid),
          where("status", "==", "completed")
        );
        const snap = await getDocs(q);
        setCompletedIds(new Set(snap.docs.map(d => d.data().problemId)));
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    };
    fetchProgress();
  }, [user?.uid]);

  // M1: cursor-based load-more.
  const loadMore = async () => {
    if (!lastVisible || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, "Problems"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const docs = snap.docs;
      setProblems(prev => [...prev, ...docs.map(d => ({ id: d.id, ...d.data() }))]);
      setLastVisible(docs[docs.length - 1] ?? null);
      setHasMore(docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading more problems:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const myCreatedProblems = problems.filter(p => p.creatorId === user?.uid);

  return (
    <div className="flex bg-white min-h-screen">
      <Drawer createdProblems={myCreatedProblems} isLoading={loading} />
      {error ? (  // L2
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-10 space-y-2">
            <p className="font-bold text-red-500">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm text-gray-400 underline">
              Retry
            </button>
          </div>
        </div>
      ) : (
        <ProblemList
          allProblems={problems}
          isLoading={loading}
          completedIds={completedIds}
          onLoadMore={loadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
      )}
    </div>
  );
}
