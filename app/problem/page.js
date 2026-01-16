'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/Auth/AuthProvider.jsx";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Drawer from "@/components/Drawer.jsx";
import ProblemList from "@/components/ProblemList.jsx";

export default function ProblemPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
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

  // Filter problems created by the current user for the Drawer
  const myCreatedProblems = problems.filter(p => p.creatorId === user?.uid);

  return (
    <>
      <div className="flex">
        {/* Pass the filtered list to the Drawer */}
        <Drawer createdProblems={myCreatedProblems} isLoading={loading} />
        {/* Pass the full list and loading state to ProblemList */}
        <ProblemList allProblems={problems} isLoading={loading} />
      </div>
    </>
  );
} 