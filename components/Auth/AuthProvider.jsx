"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { syncUserDocument, GoogleAuth, logoutUser } from "@/lib/authUtils";

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: () => {},
  signOut: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Double check Firestore for the full user profile
        const userRef = doc(db, "Users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
          setUser({ ...firebaseUser, ...snap.data() });
        } else {
          // If the document doesn't exist yet, sync it
          const profile = await syncUserDocument(firebaseUser);
          setUser({ ...firebaseUser, ...profile });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of the Navbar
  const contextValue = useMemo(() => ({
    user,
    loading,
    signIn: GoogleAuth,
    signOut: logoutUser
  }), [user, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);