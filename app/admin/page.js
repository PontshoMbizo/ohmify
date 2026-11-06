"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthProvider";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, query, where, orderBy, getCountFromServer
} from "firebase/firestore";
import LoadingAnimation from "@/components/LoadingAnimation";
import {
  Users, CircuitBoard, Search, Trash2, ExternalLink, ShieldAlert
} from "lucide-react";

const ROLES = ["user", "creator", "admin"];

const roleBadge = {
  admin:   "bg-red-100 text-red-700",
  creator: "bg-blue-100 text-blue-700",
  user:    "bg-gray-100 text-gray-600",
};

const diffColor = {
  Easy: "text-green-500",
  Medium: "text-yellow-500",
  Hard: "text-red-500",
};

const fmtDate = (ts) =>
  ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString() : "—";

export default function AdminPage() {
  const { user, loading } = useAuth();

  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [problems, setProblems] = useState([]);
  const [completions, setCompletions] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userSearch, setUserSearch] = useState("");
  const [problemSearch, setProblemSearch] = useState("");
  const [busyUid, setBusyUid] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // problem object
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null); // { msg, ok }

  const isAdmin = user?.role === "admin";

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      try {
        const [usersSnap, problemsSnap, completedCount] = await Promise.all([
          // No orderBy: legacy user docs may lack createdAt and orderBy would
          // silently drop them. Sorted client-side instead.
          getDocs(collection(db, "Users")),
          getDocs(query(collection(db, "Problems"), orderBy("createdAt", "desc"))),
          getCountFromServer(query(
            collection(db, "UserProgress"),
            where("status", "==", "completed")
          )),
        ]);
        const rows = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setUsers(rows);
        setProblems(problemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCompletions(completedCount.data().count);
      } catch (err) {
        console.error("Admin data load failed:", err);
        setError("Failed to load admin data. Check your permissions and refresh.");
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const creatorNames = useMemo(() => {
    const map = new Map();
    users.forEach(u => map.set(u.id, u.displayName || u.email || u.id));
    return map;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredProblems = useMemo(() => {
    const q = problemSearch.trim().toLowerCase();
    if (!q) return problems;
    return problems.filter(p => (p.title || "").toLowerCase().includes(q));
  }, [problems, problemSearch]);

  const changeRole = async (uid, role) => {
    const prev = users.find(u => u.id === uid)?.role;
    if (prev === role) return;
    setBusyUid(uid);
    // Optimistic — reverted on failure.
    setUsers(us => us.map(u => (u.id === uid ? { ...u, role } : u)));
    try {
      const token = await user?.getIdToken?.();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Role update failed.");
      showToast(`Role updated to ${role}.`);
    } catch (e) {
      setUsers(us => us.map(u => (u.id === uid ? { ...u, role: prev } : u)));
      showToast(e.message, false);
    } finally {
      setBusyUid(null);
    }
  };

  const deleteProblem = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const token = await user?.getIdToken?.();
      const res = await fetch(`/api/admin/problems/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed.");
      setProblems(ps => ps.filter(p => p.id !== confirmDelete.id));
      showToast(`"${confirmDelete.title}" deleted.`);
      setConfirmDelete(null);
    } catch (e) {
      showToast(e.message, false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingAnimation />;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Restricted Area</p>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Access Denied</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {user
              ? "This dashboard is reserved for administrators."
              : "Please sign in with an administrator account to continue."}
          </p>
          <Link href="/" className="inline-block text-sm text-green-600 font-semibold hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const creatorCount = users.filter(u => u.role === "creator" || u.role === "admin").length;

  return (
    <div className="min-h-screen bg-white text-gray-800 pt-16 pb-24 px-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ── HEADER ── */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Administration</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-green-600 leading-none">
            Mission Control
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
            Manage user roles and published problems. Role changes take effect immediately;
            problem deletion is permanent and removes the template circuit and all golden waveforms.
          </p>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "USERS",       val: dataLoading ? "…" : users.length,      color: "text-gray-900" },
            { label: "CREATORS",    val: dataLoading ? "…" : creatorCount,      color: "text-blue-600" },
            { label: "PROBLEMS",    val: dataLoading ? "…" : problems.length,   color: "text-green-600" },
            { label: "COMPLETIONS", val: dataLoading ? "…" : completions ?? "—", color: "text-orange-500" },
          ].map((stat) => (
            <div key={stat.label} className="border-l-2 border-gray-100 pl-4 py-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.val}</p>
            </div>
          ))}
        </div>

        {error ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl space-y-2">
            <p className="font-bold text-red-500">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm text-gray-400 underline">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* ── TABS ── */}
            <div className="flex items-center gap-2">
              {[
                { id: "users", label: "Users", icon: Users },
                { id: "problems", label: "Problems", icon: CircuitBoard },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all
                    ${tab === id ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {/* ── CONTENT CARD ── */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm shadow-gray-100 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-6 bg-green-500 rounded-full" />
                  {tab === "users" ? "USER MANAGEMENT" : "PROBLEM MANAGEMENT"}
                </h2>
                <label className="input input-sm flex items-center gap-2 w-64 bg-gray-50 border-gray-200">
                  <Search size={14} className="text-gray-400" />
                  <input
                    type="text"
                    className="grow"
                    placeholder={tab === "users" ? "Search name or email…" : "Search title…"}
                    value={tab === "users" ? userSearch : problemSearch}
                    onChange={e => tab === "users" ? setUserSearch(e.target.value) : setProblemSearch(e.target.value)}
                  />
                </label>
              </div>

              {dataLoading ? (
                <div className="flex justify-center py-16 relative"><LoadingAnimation /></div>
              ) : tab === "users" ? (
                /* ── USERS TABLE ── */
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="border-gray-100">
                        {["Member", "Role", "Points", "Joined", ""].map(h => (
                          <th key={h} className="text-[10px] uppercase tracking-widest font-black text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-gray-50 hover:bg-gray-50/60 transition-colors">
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-green-50 flex items-center justify-center text-green-600 font-black shrink-0">
                                {u.photoURL
                                  ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                  : (u.displayName?.[0] || u.email?.[0] || "?").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-800 truncate">
                                  {u.displayName || "—"}
                                  {u.id === user.uid && <span className="ml-2 text-[10px] text-green-600 font-black uppercase">You</span>}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${roleBadge[u.role] || roleBadge.user}`}>
                              {u.role || "user"}
                            </span>
                          </td>
                          <td className="font-mono text-sm text-gray-600">{u.totalPoints ?? 0}</td>
                          <td className="text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
                          <td className="text-right">
                            {u.id === user.uid ? (
                              <span className="text-[10px] text-gray-300 uppercase font-bold">—</span>
                            ) : (
                              <select
                                className="select select-xs bg-gray-50 border-gray-200 font-medium"
                                value={u.role || "user"}
                                disabled={busyUid === u.id}
                                onChange={e => changeRole(u.id, e.target.value)}
                              >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-gray-300 italic py-10">No users match that search.</p>
                  )}
                </div>
              ) : (
                /* ── PROBLEMS TABLE ── */
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="border-gray-100">
                        {["Problem", "Difficulty", "Topics", "Creator", "Published", ""].map(h => (
                          <th key={h} className="text-[10px] uppercase tracking-widest font-black text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.map(p => (
                        <tr key={p.id} className="border-gray-50 hover:bg-gray-50/60 transition-colors">
                          <td>
                            <Link
                              href={`/problem/${p.id}`}
                              className="font-bold text-gray-800 hover:text-green-700 transition-colors inline-flex items-center gap-1.5"
                            >
                              {p.title || p.id}
                              <ExternalLink size={12} className="opacity-40" />
                            </Link>
                          </td>
                          <td className={`text-sm font-medium ${diffColor[p.difficulty] || "text-gray-400"}`}>
                            {p.difficulty || "—"}
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(p.topics) ? p.topics : [p.topics]).filter(Boolean).map(t => (
                                <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="text-xs text-gray-500">{creatorNames.get(p.creatorId) || p.creatorId || "—"}</td>
                          <td className="text-xs text-gray-400">{fmtDate(p.createdAt)}</td>
                          <td className="text-right">
                            <button
                              onClick={() => setConfirmDelete(p)}
                              className="btn btn-ghost btn-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete problem"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProblems.length === 0 && (
                    <p className="text-center text-gray-300 italic py-10">No problems match that search.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {confirmDelete && (
        <div className="modal modal-open">
          <div className="modal-box bg-white rounded-3xl max-w-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Permanent Action</p>
            <h3 className="text-xl font-black tracking-tight text-gray-900 mt-1">
              Delete &ldquo;{confirmDelete.title}&rdquo;?
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mt-3">
              This removes the problem, its template circuit, and every golden waveform.
              Solvers&apos; completion history is kept, but the problem can never be restored.
            </p>
            <div className="modal-action">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="btn btn-sm btn-ghost text-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={deleteProblem}
                disabled={deleting}
                className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none"
              >
                {deleting ? <span className="loading loading-spinner loading-xs" /> : <Trash2 size={14} />}
                Delete forever
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/30" onClick={() => !deleting && setConfirmDelete(null)} />
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast toast-end z-50">
          <div className={`alert border-none shadow-lg text-white text-sm font-medium ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
