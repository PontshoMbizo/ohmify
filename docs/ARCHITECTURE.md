# Ohmify — ARCHITECTURE

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

### Step-by-step flow

**1. User clicks Submit (`components/Simulator.jsx`)**
- Gets `sim = iframe.contentWindow.CircuitJS1`.
- Requires `sim.getTime() === 0` (user must reset to 0ms first).
- Discovers instrumentation elements via `getInfo()` / `getType()` / `getLabelName()`.
- Calls `captureAnalog` or `captureDigital` from `samplingUtils`.
- Invokes `onSubmit(capturedData, sim)`.

**2. `SolveProblem.jsx` receives `handleSimSubmit(capturedData, sim)`**
- Calls `sim.exportCircuit()` and saves to `localStorage["draft_${problemId}"]`.
- Sets `simResults` state → mounts `AutoMarker`.

**3. `AutoMarker.jsx` processes `capturedData`**

Uses a `useRef` (`activeTestTabRef`) to read the active tab at submission time — not as a reactive dependency — so switching tabs cannot cancel in-flight processing.

- `testType === "digital"` → `processDigital(table, testKey)`:
  - Parses golden solution text into `goldenTable` (one decimal int per line).
  - `gradingUtils.gradeDigital(userTable, goldenTable)` → `{ matchRatio, details, totalCycles, correctCount }`.
  - `gradingUtils.getVerdict(matchRatio, topics, true)` → `{ passed, score, message }`.
  - Writes `testSuite[testKey]` with `type:"digital"`, `table`, `verdict`, `summary`.

- `testType === "load"` → `processLoad(userVout, userVin, timeLabels, sampleRate, testKey)`:
  - Extracts golden data lines (`extractDataPoints`).
  - `gradingUtils.calculateNormalizedRMSE(userVout, solOutData)` → `nrmse`.
  - `gradingUtils.getVerdict(nrmse, topics, false)` → verdict + score.
  - `signalUtils.getFrequencyData(...)` → Bode magnitude/phase + spectrum for both user and golden.
  - Writes `testSuite[testKey]` with `type:"analog"`, waveform arrays, verdict, and all spectral data.
  - Resistance per test: `{ test1: bench.noload || 1e12, test2: bench.maxload || 1, test3: bench.minload || 1 }`.

- `testType === "signal"` → `processSignal(...)`:
  - Same as load but always writes to `testSuite.test1` with `isSignalOnly: true`. No resistance map.

**4. `SolveProblem` monitors `testSuite` for completion**

```js
const multiTestPassed = testSuite.test1?.verdict?.passed &&
                        testSuite.test2?.verdict?.passed &&
                        testSuite.test3?.verdict?.passed;
const signalPassed = testType === "signal" && testSuite.test1?.verdict?.passed;
```

When either passes (and not already completed):
- Sets `isCompleted = true`.
- Writes to `UserProgress/{uid}_{problemId}` via `setDoc(..., { merge: true })`:
  ```json
  { "userId": "<uid>", "problemId": "<id>", "status": "completed", "completedAt": <serverTimestamp>, "score": 100 }
  ```
- Only writes if `user?.uid` is present (unauthenticated users do not persist progress).

**5. Results rendered (`AutoMarker/Results.jsx`)**

Dynamic import (`ssr: false`). Uses Chart.js registered once at module level. Tabs: Logic Analyzer / Truth Table (digital) or Time Domain / Frequency Spectrum / Bode Plot (analog).

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
| `SolveProblem.jsx` | Circuit state, localStorage draft, `testSuite` state, Firestore `UserProgress` write |
| `AutoMarker.jsx` | Grading orchestration — invokes `gradingUtils` + `signalUtils`, updates `testSuite` |
| `gradingUtils` / `signalUtils` / `samplingUtils` | Pure numeric analysis helpers |

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

Write this from `SolveProblem.handleSimSubmit` after grading completes, then update `UserProgress` as the summary/index.

---

## 4) Firestore security rules (recommended)

No `firestore.rules` is present in the repository. See `docs/firestore_rules.md` for the full recommended ruleset.

Quick summary of intended access:
- **Public read**: `Problems`, `initialCircuit`, `solutionWaveform`.
- **Write to Problems**: creator (owns the problem) or admin.
- **UserProgress**: created/updated by the owning authenticated user; read by owner or admin.
- **Submissions**: created by the submitting user; read by owner or admin.

Roles are stored in `Users/{uid}.role` (`"user"` / `"creator"` / `"admin"`). For performant rule evaluation, prefer custom Auth claims over `get()` calls in rules.

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

`SolutionSection` uses an embedded `Simulator` with `mode="export"`. Each "Submit" capture in the simulator writes to `problem.solutions.test{1,2,3}` in local state. Publish is gated on all three being present. On publish, two Firestore writes fire in sequence: the `Problems` document, then `solutionWaveform` subcollection docs.

---

## 7) Actionable next steps

- **Add `Submissions` persistence** — write a submission doc in `SolveProblem.handleSimSubmit` after grading, covering `capturedData`, `exportedNetlist`, and the `verdictSnapshot`.
- **Add `firestore.rules`** — copy the rules from `docs/firestore_rules.md`, deploy via `firebase deploy --only firestore:rules`, and test with the Firebase Emulator.
- **Move roles to custom claims** — set `admin`/`creator` as Auth custom claims via the Admin SDK to avoid rules-time `get()` overhead.
- **CircuitJS ready handshake** — add a `postMessage` handshake so the iframe explicitly signals ready, rather than relying on `contentWindow.CircuitJS1` existence.
- **Add `Submissions` collection Firestore rules** — ensure only the submitting user and admins can read submission documents.
