import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/serverAuth";

// firebase-admin requires the Node.js runtime.
export const runtime = "nodejs";

/**
 * DELETE /api/admin/problems/:id
 *
 * Admins could delete the Problems doc client-side under the rules, but the
 * initialCircuit / solutionWaveform subcollections would be orphaned.
 * recursiveDelete removes the whole tree. UserProgress rows that reference
 * the problem are intentionally left alone — they are the users' completion
 * history, and the profile page already renders gracefully when the problem
 * doc is gone.
 */
export async function DELETE(request, { params }) {
  const caller = await requireAdmin(request);
  if (caller.error) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Problem id is required." }, { status: 400 });
  }

  const problemRef = adminDb.collection("Problems").doc(id);
  const snap = await problemRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  try {
    await adminDb.recursiveDelete(problemRef);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[admin/problems] delete failed:", e);
    return NextResponse.json({ error: "Problem deletion failed." }, { status: 500 });
  }
}
