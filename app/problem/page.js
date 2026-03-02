'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import Drawer from "@/components/Drawer.jsx";
import ProblemList from "@/components/ProblemList.jsx";

export default function ProblemPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set()); // Lifted state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch all problems
        const qProb = query(collection(db, "Problems"), orderBy("createdAt", "desc"));
        const probSnap = await getDocs(qProb);
        const probList = probSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProblems(probList);

        // 2. Fetch user progress if user is logged in
        if (user?.uid) {
          const qProg = query(
            collection(db, "UserProgress"), 
            where("userId", "==", user.uid), 
            where("status", "==", "completed")
          );
          const progSnap = await getDocs(qProg);
          const ids = new Set(progSnap.docs.map(doc => doc.data().problemId));
          setCompletedIds(ids);
        }
      } catch (error) {
        console.error("Error fetching page data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.uid]);

  const myCreatedProblems = problems.filter(p => p.creatorId === user?.uid);

  return (
    <div className="flex bg-white min-h-screen">
      <Drawer createdProblems={myCreatedProblems} isLoading={loading} />
      
      {/* Pass the completedIds Set directly to the list */}
      <ProblemList 
        allProblems={problems} 
        isLoading={loading} 
        completedIds={completedIds} 
      />
    </div>
  );
}