# Scope.io — ARCHITECTURE

This document covers the CircuitJS integration contract, the grading pipeline end-to-end, Firestore data model, the role model, and the distinction between `UserProgress` and `Submissions`.

---

## 1) CircuitJS integration contract

**Overview**

The app embeds a locally-hosted CircuitJS runtime at `/public/circuitAPI/circuitjs.html` inside an `<iframe>`. Integration is via direct property access on the iframe's `contentWindow` — not `postMessage`. The iframe must be same-origin (served from `public/`).

**Simulator reference**

```js
// components/Simulator.jsx
const sim = iframeRef.current?.contentWindow?.CircuitJS1 || null
```

**Contract surface — methods the app calls**

| Method | Used for |
|---|---|
| `sim.importCircuit(str, false)` | Load a netlist/payload string |
| `sim.exportCircuit()` | Export current netlist (draft save) |
| `sim.setSimRunning(bool)` | Start / stop simulation |
| `sim.getTime()` | Current sim time (enforces 0ms start) |
| `sim.getTimeStep()` | Simulation timestep in seconds |
| `sim.getElements()` | Discover voltmeters, labelled nodes, clock |
| `element.getInfo()` | Identify element type (voltmeter, square wave gen…) |
| `element.getType()` / `element.getLabelName()` | Find `Input0`, `Output0`, `clk`, `input` nodes |
| `voltmeter.getVoltageDiff()` | Read instantaneous voltage |
| `voltmeter.getCurrent()` | Read instantaneous current |
| `sim.getNodeVoltage(name)` | Read named node voltage |
| `sim.ontimestep` | Set timestep callback for sampling |

**Netlist format**

The netlist is an opaque string (Falstad/CircuitJS plain-text format). The app passes it straight to `importCircuit()` without parsing.

Storage locations:
- Initial circuit for a problem: `Problems/{id}/initialCircuit/data` → `{ payload: string }`
- User draft circuit: `localStorage["draft_${problemId}"]` — written by `SolveProblem` on each submit

**Capture modes (`lib/samplingUtils.js`)**

- `captureAnalog(sim, { numSamples })` — sets `sim.ontimestep`, reads `voltmeter.getVoltageDiff()` and `sim.getNodeVoltage('input')` each step until `numSamples` collected. Resolves `{ type:'analog', data:{output,input}, metrics, timeStep, sampleRate, timeLabels }`.
- `captureDigital(sim, { inputs, outputs, numCycles })` — monitors `sim.getNodeVoltage('clk')` for rising edges. On each edge packs input/output node voltages into integer words. Resolves `{ type:'digital', table, totalCycles, timeStep }`.

**Deterministic sampling**

Samples are taken at each discrete simulator timestep via `sim.ontimestep` (not wall-clock). Digital capture uses clock-edge detection. Repeated runs from the same netlist + settings produce identical sequences.

**Contract risks**

- Requires `CircuitJS1` on `contentWindow`; breaks if the iframe is cross-origin.
- No explicit ready/health handshake — if the simulator hasn't finished loading, `CircuitJS1` will be undefined.

---

## 2) Grading pipeline — end-to-end

> **Grading is server-side.** The browser only captures samples and renders
> results; the verdict and the progress write happen in `app/api/grade/route.js`.
> This is the security boundary — everything from the client is treated as
> untrusted. (Migrated from the original client-side design; see
> `docs/REVIEW-2026-06-11.md` for why.)

### Step-by-step flow

**1. User clicks Submit (`components/Simulator.jsx`)**
- Gets `sim = iframe.contentWindow.CircuitJS1`.
- Requires `sim.getTime() === 0` (user must reset to 0ms first).
- Discovers instrumentation elements via `getInfo()` / `getType()` / `getLabelName()`.
- Calls `captureAnalog` or `captureDigital` from `samplingUtils` (60s timeout guard).
- Invokes `onSubmit(capturedData, sim)`.

**2. `SolveProblem.jsx` receives `handleSimSubmit(capturedData, sim)`**
- Calls `sim.exportCircuit()` and saves to `localStorage["draft_${problemId}"]`.
- Sets `simResults` state → mounts `AutoMarker`.

**3. `AutoMarker.jsx` POSTs the capture to `/api/grade`**

A `useRef` (`activeTestTabRef`) reads the active tab at submission time — not as a
reactive dependency — so switching tabs cannot cancel an in-flight request.

- Sends a minimal body: `{ problemId, testKey, capturedData }` plus the Firebase
  ID token in the `Authorization` header. It deliberately does **not** send
  `topics` / `testType` / `testbench` — the server derives those from the problem
  doc so a client can't substitute lenient grading parameters.
- On success, stores the returned `testResult` into `testSuite[testKey]` and calls
  `onCompleted()` if the server reports `isCompleted`.

**4. `app/api/grade/route.js` grades and (maybe) writes progress**

Node runtime (firebase-admin needs it). In order:
1. **Authenticate** — verify the ID token via Admin SDK → trustworthy `uid`. In
   production without the Admin SDK, tokens are NOT trusted (treated anonymous);
   in dev only, an unverified decode is allowed.
2. **Rate-limit** — sliding window (15 / 60s) keyed by uid, or by IP for anonymous.
3. **Fetch problem + solutions** server-side (per-instance 5-min cache). Derive
   `testType`, `topics`, `testbench` from the problem doc.
4. **Validate `capturedData`** — shape per type, finite numbers, size caps
   (200k analog samples / 10k digital rows), and reject captures shorter than the
   solution or whose sample rate drifts >5% from the stored golden rate.
5. **Grade**:
   - `digital` → `gradingUtils.gradeDigital` + `getVerdict(ratio, topics, true)`.
   - `load` / `signal` → `gradingUtils.calculateNormalizedRMSE` +
     `getVerdict(nrmse, topics, false)`, plus `signalUtils.getFrequencyData` for
     user and golden spectra/Bode.
6. **Persist** — only if the user is verified AND the verdict passed: merge
   `passedTests[testKey]=true` into `UserProgress/{uid}_{problemId}` via the Admin
   SDK, marking `status:"completed"` once all required tests pass. `isCompleted` is
   returned to the client.

Returns `{ testResult, isCompleted }`. Resistance per analog test:
`{ test1: bench.noload || 1e12, test2: bench.maxload || 1, test3: bench.minload || 1 }`.
Signal results carry `isSignalOnly: true` and always map to `test1`.

**5. Results rendered (`AutoMarker/Results.jsx`)**

Dynamic import (`ssr: false`). Chart.js registered once at module level. Tabs:
Logic Analyzer / Truth Table (digital) or Time Domain / Frequency Spectrum / Bode
Plot (analog). Renders the server-supplied `testResult` — no grading here.

---

### Score / verdict data structures

**Per-test entry (`testSuite[testKey]`)**

```ts
{
  type: "analog" | "digital",
  verdict: { passed: boolean, score: string, message: string, nrmse?: number, matchRatio?: number },
  // analog only:
  timeLabels, userData, solutionData,
  resistance,
  freqLabels, userSpectrum, solutionSpectrum,
  userBodeMag, userBodePhase, solutionBodeMag, solutionBodePhase,
  isSignalOnly?: boolean,
  // digital only:
  table: [{ cycle, expected, actual, passed }],
  summary: { total, correct }
}
```

**Aggregated verdict (`gradingUtils.calculateFinalVerdict(testSuite, testType)`)**

```ts
{
  isAccepted: boolean,
  progress: number,
  requiredCount: number,
  passCount: number,
  globalScore: string,   // "0"–"100"
  statusMessage: string,
  isFullyComplete: boolean
}
```

---

### Data ownership

| Component | Owns |
|---|---|
| `Simulator.jsx` | Simulator lifecycle, element discovery, capture, hands `capturedData` to parent |
| `SolveProblem.jsx` | Circuit state, localStorage draft, `testSuite` state (no Firestore writes) |
| `AutoMarker.jsx` | POSTs capture to `/api/grade`, stores returned `testResult`, renders `Results` |
| `app/api/grade/route.js` | **Authority**: auth, validation, grading, the `UserProgress` write |
| `gradingUtils` / `signalUtils` / `samplingUtils` | Pure numeric analysis helpers (run server-side for grading) |

---

## 3) Firestore data model

### Collections

| Collection / Path | Shape | Notes |
|---|---|---|
| `Problems/{id}` | `{ title, description, difficulty, topics[], testType, sampleCount, timeStep, testbench, creatorId, createdAt }` | Top-level problem metadata |
| `Problems/{id}/initialCircuit/data` | `{ payload: string }` | Starting circuit netlist |
| `Problems/{id}/solutionWaveform/{testKey}` | `{ samples: string, sampleRate: number }` | Golden output per test (`test1`–`test3`). `samples` is newline-delimited decimals. |
| `Users/{uid}` | `{ uid, email, displayName, role, createdAt }` | Written by `authUtils.syncUserDocument()` on first sign-in |
| `UserProgress/{uid}_{problemId}` | `{ userId, problemId, status:"completed", completedAt, score }` | Lightweight progress index |

### `testType` values

| Value | Meaning | Tests |
|---|---|---|
| `"load"` | Analog multi-load (power electronics, etc.) | `test1` (no load), `test2` (max load), `test3` (min load) |
| `"signal"` | Single analog signal trace | `test1` only |
| `"digital"` | Bit-vector / clock-edge logic | `test1` (Input A), `test2` (Input B), `test3` (Input C) |

### What is NOT stored today

There is no `Submissions` collection. Captured waveforms and exported netlists are only held in component state and localStorage. This makes replay and offline re-grading impossible.

**Recommended `Submissions` document shape:**
```json
{
  "submissionId": "<uuid>",
  "userId": "<uid>",
  "problemId": "<id>",
  "createdAt": "<serverTimestamp>",
  "type": "analog | digital",
  "capturedData": { "...or Cloud Storage pointer..." },
  "exportedNetlist": "...text...",
  "verdictSnapshot": { "...testSuite copy..." },
  "score": 95
}
```

Write this from the grade route after a verdict is computed (it already holds the
verdict and uid), then keep `UserProgress` as the summary/index. The exported
netlist would need to be sent in the grade request body to enable server-side
re-simulation later.

---

## 4) Firestore security rules

`firestore.rules` is present and is the source of truth (deploy with
`firebase deploy --only firestore:rules,firestore:indexes`). Current access model:
- **Public read**: `Problems`, `initialCircuit`, `solutionWaveform` (the Solutions
  tab intentionally shows golden waveforms).
- **Write to Problems**: create requires creator/admin AND `creatorId == uid`;
  update/delete restricted to the problem's own creator or an admin.
- **`Users`**: a user may write only identity fields (`displayName`, `photoURL`,
  `email`, `uid`). `role`, `totalPoints`, `completedProblems`, `createdAt` are NOT
  client-writable — creation is forced to `role:"user"` with zero points. This
  closes a self-escalation hole: `isAdmin()` can fall back to reading
  `Users.role`, so a writable role would have been account takeover.
- **`UserProgress`**: `allow write: if false` for all clients. The grade API owns
  every write via the Admin SDK (which bypasses rules). Read is owner-or-admin.
- **`Submissions`**: reserved (write denied) until server-side circuit audits exist.

`isOwnerOfProblem` uses **`getAfter()`**, not `get()`: publishing is an atomic
`writeBatch`, so the parent `Problems` doc may be created in the same request as
its subcollection docs — `get()` would see the pre-batch (missing) state and
reject every publish.

Roles live in `Users/{uid}.role` (`"user"` / `"creator"` / `"admin"`); custom Auth
claims are preferred and are checked first to avoid a rules-time `get()`.

---

## 5) Role model

| Role | Capabilities |
|---|---|
| **Anonymous** | Browse landing, read published problems. Cannot submit attempts or write `UserProgress`. |
| **`user`** | Attempt problems, capture waveforms, view grading locally. `UserProgress` written on completion if signed in. Cannot create problems. |
| **`creator`** | All `user` capabilities + create/update problems and golden solutions they own. |
| **`admin`** | Full read/write on all collections. Can delete problems, read all `UserProgress` and `Submissions`. |

Role enforcement: `Users/{uid}.role` drives UI gates (e.g. `Navbar.jsx` checks `user?.role === "admin"`). Server-side enforcement requires Firestore rules or custom claims.

---

## 6) Creator workflow (`/create`)

The `CreateProblem` wizard has four locked-sequential steps:

| Step | Section | Gate to advance |
|---|---|---|
| 0 — Details | `MetadataSection` | `problem.title` non-empty |
| 1 — Topics | `TopicSection` | (no gate; back/next free) |
| 2 — Template | `TemplateSection` | `problem.templateCircuit` non-empty |
| 3 — Solution | `SolutionSection` | All three solutions captured + `timeStep` valid before publish |

`SolutionSection` uses an embedded `Simulator` with `mode="export"`. Each "Submit"
capture writes to `problem.solutions.test{1,2,3}` in local state (empty captures are
rejected at capture time, while the creator can still fix the circuit), and records
the actual capture `sampleRate`. Publish is gated on all required captures plus a
valid `timeStep` and positive load resistances. **Publish is a single atomic
`writeBatch`**: the `Problems` doc, `initialCircuit/data`, and all `solutionWaveform`
docs commit together or not at all — the old sequential writes could fail halfway
and leave a problem that 500s at grade time. Each solution doc stores the rate the
capture actually ran at (falling back to `1/timeStep`), which the grade API checks
the solver's capture against.

---

## 7) Actionable next steps

Done since the original draft: server-side grading (`/api/grade`), `firestore.rules`
written + hardened, atomic batch publish, sample-rate/length validation, capture
timeouts, deploy config (`firebase.json`, `firestore.indexes.json`). Remaining:

- **Anti-cheat (the real one)** — submissions are client-captured waveforms and
  golden solutions are public, so a determined user can replay the solution.
  Deferred for v1 (learning platform — cheaters only cheat themselves). Before any
  rankings/competitive feature: persist the user's exported circuit per passing
  submission, then re-simulate server-side (headless CircuitJS) to verify. The
  `Submissions` collection is reserved for this.
- **Move roles to custom claims** — set `admin`/`creator` as Auth custom claims via
  the Admin SDK to avoid the rules-time `get()` fallback entirely.
- **CircuitJS ready handshake** — replace the retry-until-defined loop with an
  explicit ready signal from the iframe.
- **Digital cycle count** — `numCycles` is hardcoded at 330 in `Simulator.jsx`;
  wire it to a problem-level field with a sane default before raising sample counts.
- **Cost** — downsample what the Solutions tab loads if problem views grow (see
  `docs/DEPLOYMENT.md` free-tier table).
