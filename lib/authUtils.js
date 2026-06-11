import { auth, db } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Ensures the Users/{uid} document exists in Firestore.
 *
 * Identity fields (name, email, photo) are always merged. Account-state
 * fields (role, points, completedProblems, createdAt) are only written when
 * the document doesn't exist yet — merging them unconditionally would demote
 * creators back to "user" and reset progress on any later call. If two tabs
 * race on first login, both create identical defaults, so the race is benign.
 */
export const syncUserDocument = async (user) => {
  if (!user) return null;
  const userRef = doc(db, "Users", user.uid);
  const identity = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };

  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await setDoc(userRef, identity, { merge: true });
    return { ...snap.data(), ...identity };
  }

  const userData = {
    ...identity,
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
