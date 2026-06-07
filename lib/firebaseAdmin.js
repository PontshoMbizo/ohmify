import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// adminDb is null when FIREBASE_SERVICE_ACCOUNT_JSON is not set (local dev without
// service account). Reads fall back to the regular client SDK; writes are skipped.
let adminDb = null;

try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  adminDb = getFirestore();
} catch (e) {
  console.warn(`[firebaseAdmin] Admin SDK disabled: ${e.message}`);
}

export { adminDb, FieldValue };
