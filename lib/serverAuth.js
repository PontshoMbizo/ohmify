import { adminDb, adminAuth } from "./firebaseAdmin";

/**
 * Server-side auth for privileged API routes (role changes, deletions).
 *
 * Unlike the grade route, there is NO unverified-decode fallback here — a
 * forged token must never reach a privileged write, so if the Admin SDK is
 * not configured these helpers refuse everyone (503 semantics, surfaced as
 * an { error, status } object the route turns into a response).
 */

/** Verify the Bearer token and return its uid, or an { error, status } object. */
export async function requireUser(request) {
  if (!adminAuth || !adminDb) {
    return { error: "Admin SDK is not configured on this server.", status: 503 };
  }
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing Authorization header.", status: 401 };
  }
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    return { uid: decoded.uid };
  } catch {
    return { error: "Invalid or expired token.", status: 401 };
  }
}

/** Like requireUser, but the caller's Users doc must have role === "admin". */
export async function requireAdmin(request) {
  const result = await requireUser(request);
  if (result.error) return result;

  const snap = await adminDb.collection("Users").doc(result.uid).get();
  if (!snap.exists || snap.data().role !== "admin") {
    return { error: "Admin privileges required.", status: 403 };
  }
  return { uid: result.uid };
}
