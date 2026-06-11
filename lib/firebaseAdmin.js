import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// adminDb and adminAuth are null when FIREBASE_SERVICE_ACCOUNT_JSON is not set.
// Reads fall back to the regular client SDK; writes and token verification are skipped.
let adminDb = null;
let adminAuth = null;

try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  adminDb = getFirestore();
  adminAuth = getAuth();
} catch (e) {
  console.warn(`[firebaseAdmin] Admin SDK disabled: ${e.message}`);
}

export { adminDb, adminAuth, FieldValue };
