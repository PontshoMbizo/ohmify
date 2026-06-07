import { auth, db } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Ensures the Users/{uid} document exists in Firestore.
 * H2: uses setDoc(merge:true) — idempotent under concurrent calls from
 * multiple tabs; no read-check-write race condition.
 */
export const syncUserDocument = async (user) => {
  if (!user) return null;
  const userRef = doc(db, "Users", user.uid);
  const userData = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    role: "user",
    createdAt: serverTimestamp(),
    completedProblems: [],
    totalPoints: 0,
  };
  await setDoc(userRef, userData, { merge: true });
  return userData;
};

/**
 * Initiates Google Sign-In via popup.
 * H2: removed the redundant syncUserDocument call — onAuthStateChanged in
 * AuthProvider handles document creation; calling it here too caused a
 * double-write on every first login.
 */
export const GoogleAuth = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google Auth Popup Error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn("User closed the login window.");
    }
    throw error;
  }
};

export const logoutUser = () => firebaseSignOut(auth);
