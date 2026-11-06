"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthProvider";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import LoadingAnimation from "@/components/LoadingAnimation";
import {
  UserCircle, Palette, Database, Download, Eraser, LogOut, Trash2, AlertTriangle
} from "lucide-react";

const THEME_KEY = "scope-theme";
const THEMES = [
  { id: "dim",    label: "Dim",    desc: "Dark interface chrome — the scope.io default." },
  { id: "light",  label: "Light",  desc: "Bright interface chrome throughout." },
  { id: "system", label: "System", desc: "Follows your operating system preference." },
];

// Resolve a stored preference to a concrete daisyUI theme.
const resolveTheme = (pref) =>
  pref === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dim" : "light")
    : pref;

const SectionCard = ({ title, icon: Icon, accent = "bg-green-500", children }) => (
  <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm shadow-gray-100 space-y-6">
    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
      <span className={`w-2 h-6 ${accent} rounded-full`} />
      <span className="flex items-center gap-2">{Icon && <Icon size={18} className="text-gray-400" />} {title}</span>
    </h2>
    {children}
  </div>
);

const Row = ({ label, hint, children }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 py-3 border-b border-gray-50 last:border-none">
    <div className="md:w-52 shrink-0">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{hint}</p>}
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const [themePref, setThemePref] = useState("dim");
  const [draftCount, setDraftCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user?.displayName]);

  useEffect(() => {
    setThemePref(localStorage.getItem(THEME_KEY) || "dim");
    setDraftCount(
      Object.keys(localStorage).filter(k => k.startsWith("draft_")).length
    );
  }, []);

  const changeTheme = (pref) => {
    setThemePref(pref);
    localStorage.setItem(THEME_KEY, pref);
    document.documentElement.dataset.theme = resolveTheme(pref);
  };

  const saveDisplayName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === user.displayName) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
      await updateDoc(doc(db, "Users", user.uid), { displayName: trimmed });
      setSaveMsg("Saved!");
    } catch (e) {
      console.error("Display name update failed:", e);
      setSaveMsg("Failed — try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const snap = await getDocs(query(
        collection(db, "UserProgress"),
        where("userId", "==", user.uid)
      ));
      const { getIdToken: _omit, ...profile } = user;
      const payload = {
        exportedAt: new Date().toISOString(),
        profile,
        progress: snap.docs.map(d => ({ id: d.id, ...d.data() })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scope-io-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const clearDrafts = () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith("draft_"))
      .forEach(k => localStorage.removeItem(k));
    setDraftCount(0);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const token = await user?.getIdToken?.();
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Account deletion failed.");
      // Sign out immediately — the local session would otherwise recreate the
      // Users doc on the next auth-state sync.
      await signOut();
      window.location.href = "/";
    } catch (e) {
      setDeleteError(e.message);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingAnimation />;
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Settings</p>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Sign in required</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Sign in to manage your account, appearance, and data.
          </p>
          <Link href="/" className="inline-block text-sm text-green-600 font-semibold hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = user.createdAt?.seconds
    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : "—";

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-16 pb-24 px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-green-600 leading-none">
            Settings
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Manage your identity, interface preferences, and data.
          </p>
        </div>

        {/* ── ACCOUNT ── */}
        <SectionCard title="ACCOUNT" icon={UserCircle}>
          <div className="flex items-center gap-4 pb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-500 shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-2xl font-black">
                  {(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-900 truncate">{user.displayName}</p>
              <p className="text-green-600 font-mono text-[11px] font-bold uppercase tracking-widest">
                {user.role || "user"}
              </p>
            </div>
          </div>

          <div>
            <Row label="Display name" hint="Shown on your profile and submissions.">
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  className="input input-sm flex-1 bg-gray-50 border-gray-200"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveDisplayName()}
                  placeholder="New display name"
                />
                <button
                  onClick={saveDisplayName}
                  disabled={saving || !displayName.trim() || displayName.trim() === user.displayName}
                  className="btn btn-sm btn-success disabled:opacity-40"
                >
                  {saving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
                </button>
              </div>
              {saveMsg && (
                <p className={`text-xs mt-1 ${saveMsg.startsWith("Saved") ? "text-green-500" : "text-red-400"}`}>
                  {saveMsg}
                </p>
              )}
            </Row>

            <Row label="Email" hint="Managed by your sign-in provider.">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                  Google
                </span>
              </div>
            </Row>

            <Row label="Member since">
              <p className="text-sm text-gray-600">{memberSince}</p>
            </Row>

            <Row label="Session">
              <button
                onClick={signOut}
                className="btn btn-sm btn-ghost text-gray-500 hover:text-red-500 hover:bg-red-50 -ml-3"
              >
                <LogOut size={15} /> Sign out
              </button>
            </Row>
          </div>
        </SectionCard>

        {/* ── APPEARANCE ── */}
        <SectionCard title="APPEARANCE" icon={Palette}>
          <p className="text-sm text-gray-500 -mt-2">
            Sets the interface chrome (navbar, menus, inputs) on this device.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all space-y-1
                  ${themePref === t.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 hover:border-green-200"}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-black uppercase tracking-wide ${themePref === t.id ? "text-green-700" : "text-gray-700"}`}>
                    {t.label}
                  </p>
                  {themePref === t.id && <span className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{t.desc}</p>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── DATA & PRIVACY ── */}
        <SectionCard title="DATA & PRIVACY" icon={Database}>
          <div>
            <Row label="Export my data" hint="Profile and full completion history as JSON.">
              <button
                onClick={exportData}
                disabled={exporting}
                className="btn btn-sm btn-outline btn-success"
              >
                {exporting
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Download size={15} />}
                Download JSON
              </button>
            </Row>
            <Row
              label="Local circuit drafts"
              hint="Unsubmitted circuits auto-saved in this browser."
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={clearDrafts}
                  disabled={draftCount === 0}
                  className="btn btn-sm btn-ghost text-gray-500 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 -ml-3"
                >
                  <Eraser size={15} /> Clear drafts
                </button>
                <span className="text-xs text-gray-400">
                  {draftCount === 0 ? "No drafts stored" : `${draftCount} draft${draftCount === 1 ? "" : "s"} stored`}
                </span>
              </div>
            </Row>
          </div>
        </SectionCard>

        {/* ── DANGER ZONE ── */}
        <div className="border-2 border-red-100 rounded-3xl p-8 space-y-4">
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
            <span className="w-2 h-6 bg-red-500 rounded-full" />
            <span className="flex items-center gap-2"><AlertTriangle size={18} /> DANGER ZONE</span>
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
            Deleting your account permanently removes your profile, points, and completion
            history. Problems you have published stay available to the community.
            This cannot be undone.
          </p>
          <button
            onClick={() => { setConfirmOpen(true); setConfirmText(""); setDeleteError(null); }}
            className="btn btn-sm btn-outline btn-error"
          >
            <Trash2 size={15} /> Delete account
          </button>
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {confirmOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-white rounded-3xl max-w-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Permanent Action</p>
            <h3 className="text-xl font-black tracking-tight text-gray-900 mt-1">Delete your account?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mt-3">
              Your profile, points, and completion history will be erased.
              Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              className="input input-sm w-full mt-4 bg-gray-50 border-gray-200 font-mono"
              placeholder="Type DELETE"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              disabled={deleting}
            />
            {deleteError && <p className="text-xs text-red-500 mt-2">{deleteError}</p>}
            <div className="modal-action">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="btn btn-sm btn-ghost text-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting || confirmText !== "DELETE"}
                className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none disabled:opacity-40"
              >
                {deleting ? <span className="loading loading-spinner loading-xs" /> : <Trash2 size={14} />}
                Delete forever
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/30" onClick={() => !deleting && setConfirmOpen(false)} />
        </div>
      )}
    </div>
  );
}
