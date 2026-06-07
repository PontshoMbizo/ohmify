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
      try {
        if (firebaseUser) {
          const userRef = doc(db, "Users", firebaseUser.uid);
          const snap = await getDoc(userRef);
          const firestoreData = snap.exists()
            ? snap.data()
            : await syncUserDocument(firebaseUser);

          // H3: explicit property pick — Firebase User class properties are
          // non-enumerable so spreading the instance silently produces {}.
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            getIdToken: firebaseUser.getIdToken.bind(firebaseUser),
            ...firestoreData,
          });
        } else {
          setUser(null);
        }
      } catch (e) {
        // H1: always reach setLoading(false) even on network/quota errors.
        console.error("Auth state error:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
