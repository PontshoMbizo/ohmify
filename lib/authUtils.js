import { auth, db } from "./firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const provider = new GoogleAuthProvider();

// Explicitly set custom parameters to help with COOP issues
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Helper to ensure the Users/{uid} document exists in Firestore.
 */
export const syncUserDocument = async (user) => {
  if (!user) return null;
  
  const userRef = doc(db, "Users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
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
    await setDoc(userRef, userData);
    return userData;
  }
  return userSnap.data();
};

/**
 * Initiates the Google Sign-In via Popup.
 */
export const GoogleAuth = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    // Sync immediately so the UI updates before the listener even triggers
    await syncUserDocument(result.user);
    return result.user;
  } catch (error) {
    console.error("Google Auth Popup Error:", error);
    // Handle the common "closed by user" or "blocked" errors gracefully
    if (error.code === 'auth/popup-closed-by-user') {
       console.warn("User closed the login window.");
    }
    throw error;
  }
};

export const logoutUser = () => firebaseSignOut(auth);