# Ohmify — Task Board

Issues ordered by severity. Each task has a **Your comment** block — mark it approved or add notes before work begins on that item.

---

## Critical

### C1 — Move grading server-side
**Status:** DONE
**Severity:** Critical

**Problem:** All grading runs in the browser. A user can open DevTools, override the grading logic, and mark any problem complete. Scores cannot be trusted on a competitive platform.

**Root cause:** `AutoMarker.jsx` calls `gradingUtils` directly in the browser; `SolveProblem.jsx` writes `UserProgress` to Firestore from the client. No `/app/api/` directory exists.

**Action plan:**
1. Install `firebase-admin` package.
2. Create `lib/firebaseAdmin.js` — initialises the Admin app from a `FIREBASE_SERVICE_ACCOUNT_JSON` env var.
3. Create `app/api/grade/route.js` — accepts `{ problemId, testType, capturedData, userId }`, fetches the solution waveform from Firestore server-side, runs the appropriate grading function, writes `UserProgress` via Admin SDK, returns the verdict JSON.
4. Update `AutoMarker.jsx`: replace direct `gradingUtils` calls with `fetch('/api/grade', {...})`. Keep all rendering logic; only the computation moves server-side.
5. Remove the `setDoc(UserProgress, ...)` write from `SolveProblem.jsx` — the API route owns that write.

**Files touched:**
- `app/api/grade/route.js` *(new)*
- `lib/firebaseAdmin.js` *(new)*
- `components/SimulationWindow/AutoMarker/AutoMarker.jsx`
- `components/SimulationWindow/SolveProblem.jsx`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

### C2 — Add server-side input validation
**Status:** DONE
**Severity:** Critical

**Problem:** No user-submitted data is validated before reaching Firestore. The only line of defence is Firestore security rules, which aren't in this repo.

**Root cause:** No API layer exists; the client writes directly via the Firebase SDK.

**Action plan:**
1. Resolved in conjunction with C1: once the API route exists, add validation of the request body before grading runs.
2. Validate `problemId` exists in Firestore before fetching the solution.
3. Validate `capturedData` shape matches the expected type (`analog` / `digital`).
4. Return HTTP 400 with a descriptive message on any validation failure.

**Files touched:**
- `app/api/grade/route.js` *(same file as C1)*

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

## High

### H1 — Auth loading can hang forever on Firestore error
**Status:** DONE
**Severity:** High

**Problem:** If `getDoc` throws inside `onAuthStateChanged` (network error, quota exceeded, etc.), `setLoading(false)` is never reached and the entire app freezes on a loading spinner with no recovery.

**Root cause:** `components/Auth/AuthProvider.jsx:20` — async callback with no try/catch; `setLoading(false)` is only on the happy path.

**Action plan:**
1. Wrap the full async body in `try { ... } catch (e) { console.error(e); setUser(null); } finally { setLoading(false); }`.

**Files touched:**
- `components/Auth/AuthProvider.jsx`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

### H2 — Race condition double-writes user document on first login
**Status:** DONE
**Severity:** High

**Problem:** Two browser tabs opening simultaneously both read "no document exists" and both call `setDoc`, silently overwriting each other. Additionally `GoogleAuth` in `authUtils.js` and the `onAuthStateChanged` listener in `AuthProvider.jsx` both call `syncUserDocument`, causing a redundant Firestore write on every single first login.

**Root cause:** `lib/authUtils.js:17` — read-check-write is not atomic. Both `GoogleAuth` and `AuthProvider` independently call `syncUserDocument`.

**Action plan:**
1. In `syncUserDocument`, replace the `getDoc` + `if (!snap.exists())` block with a single `setDoc(userRef, userData, { merge: true })` — idempotent and concurrency-safe.
2. Remove the `await syncUserDocument(result.user)` call from `GoogleAuth`. The `onAuthStateChanged` listener handles it; the duplicate call is unnecessary.

**Files touched:**
- `lib/authUtils.js`
- `components/Auth/AuthProvider.jsx`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

### H3 — Spreading Firebase User object silently loses all properties
**Status:** DONE
**Severity:** High

**Problem:** `{ ...firebaseUser, ...snap.data() }` attempts to spread a class instance. Firebase User properties (`uid`, `email`, `getIdToken`, etc.) are non-enumerable — the spread produces `{}`. The `user` in context contains only Firestore data. Any component calling `user.getIdToken()` gets `undefined`.

**Root cause:** `components/Auth/AuthProvider.jsx:27` — assumes class instance is spreadable.

**Action plan:**
1. Replace the spread with an explicit property pick:
   ```js
   {
     uid: firebaseUser.uid,
     email: firebaseUser.email,
     displayName: firebaseUser.displayName,
     photoURL: firebaseUser.photoURL,
     getIdToken: firebaseUser.getIdToken.bind(firebaseUser),
     ...snap.data()
   }
   ```
2. Apply the same fix to the `syncUserDocument` fallback branch (~line 33).

**Files touched:**
- `components/Auth/AuthProvider.jsx`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

## Medium

### M1 — Full table scan on every problem list page load
**Status:** DONE
**Severity:** Medium

**Problem:** The problems query fetches every document in the collection unconditionally. Firestore bills per document read — 1 000 problems = 1 000 reads on every page visit.

**Root cause:** `app/problem/page.js:21` — no `limit()` on the query.

**Action plan:**
1. Add `limit(30)` to the problems query.
2. Store the last document snapshot in state (`lastVisible`).
3. Add a "Load more" button to `ProblemList.jsx` that calls `startAfter(lastVisible)` with another `limit(30)` query and appends results to the list.

**Files touched:**
- `app/problem/page.js`
- `components/ProblemList.jsx`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

### M2 — Problems fetched twice per authenticated session
**Status:** DONE
**Severity:** Medium

**Problem:** On initial render `user` is `null` — the effect fires and fetches all problems without progress data. When auth resolves, `user.uid` changes and the effect fires again, re-fetching all problems. Two full reads on every authenticated page load.

**Root cause:** `app/problem/page.js:16` — a single `useEffect` depends on `user?.uid`, but the problems query doesn't need the user.

**Action plan:**
1. Split into two effects: one for problems (empty dependency array, runs once on mount), one for progress (depends on `user?.uid`, skips if null).
2. Use a separate `progressLoading` state so the problem list renders immediately while progress loads in the background.

**Files touched:**
- `app/problem/page.js`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

### M3 — sampleRate determined by non-deterministic Firestore iteration
**Status:** HELD
**Severity:** Medium

**Problem:** If multiple `solutionWaveform` documents carry different `sampleRate` values, the last one in the `forEach` wins. Firestore's document iteration order is not guaranteed to be consistent, causing intermittent grading failures that are impossible to reproduce.

**Root cause:** `app/problem/[id]/page.js:44` — `sampleRate = data.sampleRate` inside a `forEach` over a subcollection.

**Action plan:**
1. Move `sampleRate` out of the subcollection into the top-level `Problems/{id}` document (it is problem-level metadata, not per-solution data).
2. Read it from `metaData.sampleRate` directly in the page — no iteration required.
3. Update the Creator Studio to write `sampleRate` on the top-level document.

**Files touched:**
- `app/problem/[id]/page.js`

---
> **Your comment:**
> - [ ] Approved — go ahead
> - [-] Hold — notes: we'll deal with this one later.

---

## Low

### L1 — testType empty string silently triggers wrong grading mode
**Status:** DONE
**Severity:** Low

**Problem:** `metaData.testType || (metaData.isDigital ? "digital" : "load")` — an empty string `""` is falsy, so a blank `testType` field in Firestore silently falls through to the legacy `isDigital` flag. The wrong grading strategy is applied with no error or warning.

**Root cause:** `app/problem/[id]/page.js:52` — implicit falsiness of `""`.

**Action plan:**
1. Change to an explicit trim-and-check:
   ```js
   testType: metaData.testType?.trim() || (metaData.isDigital ? "digital" : "load")
   ```

**Files touched:**
- `app/problem/[id]/page.js`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

### L2 — Fetch failures show as silent empty content
**Status:** DONE
**Severity:** Low

**Problem:** Both page components catch errors with only `console.error`. A network failure and a genuinely missing problem both show the same empty UI. Users cannot tell if the page is broken or simply empty.

**Root cause:** `app/problem/page.js` and `app/problem/[id]/page.js` — no `error` state.

**Action plan:**
1. Add `const [error, setError] = useState(null)` in both page components.
2. In each `catch` block, call `setError(err.message)` in addition to `console.error`.
3. Render an error banner when `error !== null` (distinct from the "not found" case).

**Files touched:**
- `app/problem/page.js`
- `app/problem/[id]/page.js`

---
> **Your comment:**
> - [-] Approved — go ahead
> - [ ] Hold — notes:

---

## Recommended execution order

| Order | Tasks | Reason |
|---|---|---|
| 1 | H1, H2, H3 | Auth fixes are isolated; safe to ship immediately |
| 2 | L1, L2 | One-liners and small additions; clear fast |
| 3 | M2, M3 | Data-fetching improvements; no grading dependencies |
| 4 | M1 | Pagination; can run in parallel with M2/M3 |
| 5 | C1 + C2 | Big structural change; must come last |
