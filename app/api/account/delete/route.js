import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { requireUser } from "@/lib/serverAuth";

// firebase-admin requires the Node.js runtime.
export const runtime = "nodejs";

/**
 * POST /api/account/delete
 *
 * Self-service account deletion. Runs server-side because (a) the rules
 * don't allow clients to delete Users or UserProgress docs, and (b)
 * client-side deleteUser() demands a recent re-login, which is a dead end
 * for a popup-blocked or long-lived session.
 *
 * Removes: all UserProgress rows, the Users doc, and the Auth user.
 * Published problems are kept — they are community content; the creatorId
 * simply stops resolving to a profile.
 */
export async function POST(request) {
  const caller = await requireUser(request);
  if (caller.error) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }
  const { uid } = caller;

  try {
    // UserProgress rows (batched — 500 writes per batch limit).
    const progressSnap = await adminDb
      .collection("UserProgress")
      .where("userId", "==", uid)
      .get();
    const docs = progressSnap.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = adminDb.batch();
      docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    await adminDb.collection("Users").doc(uid).delete();
    await adminAuth.deleteUser(uid);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/delete] deletion failed:", e);
    return NextResponse.json({ error: "Account deletion failed." }, { status: 500 });
  }
}
