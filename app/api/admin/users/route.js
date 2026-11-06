import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/serverAuth";

// firebase-admin requires the Node.js runtime.
export const runtime = "nodejs";

const VALID_ROLES = ["user", "creator", "admin"];

/**
 * PATCH /api/admin/users
 * Body: { uid, role }
 *
 * Role is not client-writable under the Firestore rules, so promotions and
 * demotions flow through here. The custom claim is set alongside the Users
 * doc so rules that prefer request.auth.token.role pick it up on the
 * target's next token refresh; the doc-read fallback makes it effective
 * immediately.
 */
export async function PATCH(request) {
  const caller = await requireAdmin(request);
  if (caller.error) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { uid, role } = body ?? {};
  if (typeof uid !== "string" || !uid.trim()) {
    return NextResponse.json({ error: "uid is required." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}.` }, { status: 400 });
  }
  // Changing your own role is blocked so an admin can't accidentally lock
  // themselves out of this very endpoint.
  if (uid === caller.uid) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  const userRef = adminDb.collection("Users").doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    await userRef.update({ role });
    await adminAuth.setCustomUserClaims(uid, { role });
    return NextResponse.json({ ok: true, uid, role });
  } catch (e) {
    console.error("[admin/users] role update failed:", e);
    return NextResponse.json({ error: "Role update failed." }, { status: 500 });
  }
}
