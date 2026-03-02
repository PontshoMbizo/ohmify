# Ohmify — ARCHITECTURE

This document describes the CircuitJS integration contract, the grading pipeline end-to-end, recommended Firestore security rules (no rules file present in repo), the role model, and the distinction between `UserProgress` and `Submissions` (what is stored today and recommended changes).

---

## 1) CircuitJS integration contract (the black box)

Overview
- The app embeds a locally-hosted CircuitJS runtime at `/public/circuitAPI/circuitjs.html` inside an `<iframe>`.
- Integration is NOT based on `window.postMessage` in the current code; instead the parent page expects the iframe to expose a global `CircuitJS1` object on `iframe.contentWindow` and calls its API directly.

Where this happens
- `components/Simulator.jsx` obtains the simulator instance with:

  - `const sim = iframeRef.current?.contentWindow?.CircuitJS1 || null`

Methods and properties the app uses (contract surface)
- `sim.importCircuit(circuitString, false)` — import a netlist/payload string into the simulator.
- `sim.setSimRunning(boolean)` — start/stop the simulator.
- `sim.getTime()` — current sim time.
- `sim.getTimeStep()` — simulation timestep (seconds).
- `sim.getElements()` — returns element objects; used to discover voltmeters, labeled nodes, clock generator etc.
- `element.getInfo()` — returns descriptive array used to identify element type (e.g. detects "voltmeter" or "square wave gen").
- `element.getType()` and `element.getLabelName()` — used to find labeled nodes such as `Input0`, `Output0`, or named nodes like `clk` and `input`.
- `voltmeter.getVoltageDiff()`, `voltmeter.getCurrent()` — used by analog capture to read instantaneous V and I.
- `sim.getNodeVoltage(name)` — read node voltage for digital packing and clock detection.
- `sim.ontimestep` — set to a function that will be called on each simulation timestep; `samplingUtils` sets this to collect samples.
- `sim.exportCircuit()` — returns the current netlist string (used to save user drafts).

Netlist / payload format
- The netlist is treated as an opaque string by the app (stored as `payload` in Firestore initialCircuit/doc). The app does not parse the netlist itself; it passes the string straight to `sim.importCircuit()`.
- Practically this is the Falstad/CircuitJS textual netlist format (plain text lines describing devices and node labels). The app relies on the simulator to interpret it.
- Storage:
  - Problem initial circuits are read from `Problems/{id}/initialCircuit/data` where the document has a `payload` field (string).
  - When the simulator exports the user's circuit, `sim.exportCircuit()` is called and the returned string saved to localStorage (draft) in current implementation; it is not automatically written to Firestore.

How samples are extracted
- The parent sets `sim.ontimestep = () => { ... }`. Inside that callback the sampling functions call simulator element APIs to read voltages/currents each timestep.
- Two capture modes implemented in `lib/samplingUtils.js`:
  - Analog (`captureAnalog`): discovers a voltmeter element and (optionally) an `input` labeled node. On each timestep reads `voltmeter.getVoltageDiff()` and `sim.getNodeVoltage('input')` and pushes samples into buffers until `numSamples` is reached. When done it clears `sim.ontimestep`, stops the simulator via `sim.setSimRunning(false)`, and resolves a structure with samples, final metrics, `timeStep`, `sampleRate`, and `timeLabels`.
  - Digital (`captureDigital`): discovers labelled input/output nodes and a `clk` node. On each timestep it monitors `sim.getNodeVoltage('clk')` and detects rising edges (lastClk 0 -> 1). On each rising edge it packs inputs/outputs into integer words and records a `history` row. After `numCycles` cycles it resolves with a `table` containing cycle rows.

What "deterministic sampling" means here
- Deterministic sampling in this implementation is achieved by:
  1. Setting the simulator to a known initial state (`sim.setSimRunning(false)` / reset), ensuring the user is instructed to reset to 0ms before running capture.
  2. Using the simulator's internal timestep (`sim.getTimeStep()`) and the `sim.ontimestep` callback to sample at each discrete simulator step rather than trying to sample asynchronous wall-clock time.
  3. For digital captures, sampling is synchronized to a discovered clock node by observing node voltage transitions (edge detection) rather than relying on external timers.
- The net effect: samples are taken at consistent simulation timesteps or on deterministic clock edges, so repeated captures from the same netlist + simulator settings produce identical sample sequences (assuming deterministic simulator behavior).

Limitations & contract risks
- This approach requires `CircuitJS1` to be present on `contentWindow` and the iframe page must not violate browser cross-origin rules. It only works when `circuitjs.html` is served from the same origin (true here under `public/`).
- If the simulator changes its API (method names or element object shapes), the parent code will break.
- There is no explicit message-based handshake; a robust integration could add a `postMessage` handshake and explicit ready/health messages.


---

## 2) Grading pipeline — end-to-end (what happens when the user clicks "Submit")

High level steps
1. User clicks `Submit` in the simulator UI (the visible button in `components/Simulator.jsx`).
2. `Simulator.jsx` runs `handleInternalSubmit()`:
   - It gets `sim = iframe.contentWindow.CircuitJS1`.
   - If `mode === 'export'`, calls `onSubmit(null, sim)` and returns (export-only).
   - Checks `sim.getTime()` and requires simulator to be at 0ms (asks user to reset otherwise) — this enforces deterministic starting point.
   - Discovers digital/analog measurement elements (voltmeters, labelled nodes, clock element) using element `getInfo()` / `getType()` / `getLabelName()`.
   - Starts the simulator via `sim.setSimRunning(true)` and calls the appropriate capture function in `samplingUtils`:
     - `captureAnalog(sim, { numSamples })` → samples until `numSamples`, then resolves object with `type: 'analog'`, `data: {output:[], input:[]}`, `metrics`, `timeStep`, `sampleRate`, `timeLabels`.
     - `captureDigital(sim, { inputs, outputs, numCycles })` → captures on clock rising edges and resolves `{ type: 'digital', table, totalCycles, timeStep }`.
   - After capture resolves, `Simulator` invokes `onSubmit(capturedData, sim)`.

3. `SolveProblem.jsx` receives `handleSimSubmit(capturedData, sim)`:
   - If `sim && typeof sim.exportCircuit === 'function'`, calls `sim.exportCircuit()` and saves exported netlist string to localStorage as a draft for the current `problemId`.
   - Stores `capturedData` into local `simResults` state.

4. `SolveProblem` renders `AutoMarker` and passes `capturedData`, the `solution` payload (golden waveform strings fetched earlier from Firestore), project `topics`, `testbench`, and `testType`.

5. `AutoMarker.jsx` receives `capturedData` and triggers one of three pipelines depending on `testType`:
   - `digital`: calls `processDigital(userTable, testKey)`:
     - Parses the stored golden solution CSV/text into `goldenTable` where each line is `decimalOutput`.
     - Calls `gradingUtils.gradeDigital(userTable, goldenTable)` which compares cycle-by-cycle and returns `matchRatio`, `details`, `totalCycles`, `correctCount`.
     - Calls `gradingUtils.getVerdict(matchRatio, topics, true)` to get `{ passed, score, message }`.
     - Writes a per-test entry into `testSuite[testKey]` state with table details and the `verdict`.
   - `load` (analog triple-test): calls `processLoad(userVout, userVin, timeLabels, sampleRate, testKey)`:
     - Extracts numeric data lines from the stored golden solution string (helper `extractDataPoints`).
     - Calculates `nrmse = gradingUtils.calculateNormalizedRMSE(userVout, solOutData)`.
     - Calls `gradingUtils.getVerdict(nrmse, topics, false)` to get verdict and score.
     - Runs spectral analysis with `signalUtils.getFrequencyData(...)` to produce bode/spectrum data for display.
     - Writes the result into `testSuite[testKey]`.
   - `signal`: similar to `load` but only one test (`test1`) and different UI.

6. `AutoMarker` updates the `testSuite` state in `SolveProblem`. A `useEffect` in `SolveProblem` watches `testSuite` and calls `handleMarkAsComplete()` if either the multi-test or single-test criteria are met:
   - For `testType === 'signal'`: passing `test1` completes.
   - For other types: passing `test1 && test2 && test3` completes.

7. `handleMarkAsComplete()` persists lightweight progress into Firestore:
   - It writes (merge) a document to `UserProgress` with id `${userId}_${problemId}` and fields:
     ```json
     {
       "userId": "<uid>",
       "problemId": "<problemId>",
       "status": "completed",
       "completedAt": <serverTimestamp>,
       "score": 100
     }
     ```
   - NOTE: Current implementation uses a placeholder `userId = "placeholder_user_id"`. Replace with real `useAuth().user.uid` when integrating auth.

8. Presentation to user
   - `AutoMarker` constructs a `verdict` object per test and the UI `Results` component renders charts, pass/fail badges, numeric score, and helpful diagnostics (N-RMSE, match ratio, Bode plots, etc.).
   - The final, aggregated verdict can be computed with `gradingUtils.calculateFinalVerdict(testSuite, testType)` which returns `{ isAccepted, passCount, globalScore, statusMessage, ... }`.

Data ownership and responsibilities
- `Simulator.jsx` — owns simulator lifecycle, discovery of instrumentation, starts/stops sim, performs capture, and hands raw captured data (and `sim`) to parent via `onSubmit`.
- `SolveProblem.jsx` — owns current circuit state, stores exported circuit draft (localStorage), receives capturedData and routes it to `AutoMarker`, manages testSuite state and persistence of `UserProgress` on completion.
- `AutoMarker.jsx` — owns grading logic orchestration for the current session; invokes `gradingUtils` + `signalUtils` and updates `testSuite` entries (individual test verdicts and details).
- `gradingUtils` + `signalUtils` + `samplingUtils` — pure helper modules that perform numeric analysis, grading heuristics, and sampling.

Score / verdict data structure (what is produced in-memory)
- Per-test entry (stored in `testSuite[testKey]`):
  - `type`: "analog" | "digital"
  - `verdict`: { `passed`: boolean, `score`: string (0-100), `message`: string, ... }
  - `summary` (digital): { total, correct }
  - `userData` / `solutionData` (analog arrays)
  - `nrmse` or `matchRatio` included under `verdict` or top-level for convenience.

- Aggregated suite verdict returned by `gradingUtils.calculateFinalVerdict(testSuite, testType)`:
  ```json
  {
    "isAccepted": boolean,
    "progress": number,
    "requiredCount": number,
    "passCount": number,
    "globalScore": string, // percent as string
    "statusMessage": string,
    "isFullyComplete": boolean
  }
  ```

Persistence today
- Golden solutions: `Problems/{id}/solutionWaveform/{docId}` — each solution doc contains serialized `samples` (string or CSV-like) and `sampleRate` (number). These are read by `app/problem/[id]/page.js`.
- Initial circuit: `Problems/{id}/initialCircuit/data` — document containing `{ payload: string }`.
- User progress: `UserProgress/{userId}_{problemId}` — light doc written when user completes a challenge (see shape earlier).

Limitations in current persistence
- There is no `Submissions` collection capturing raw user submissions (captured waveform, exported netlist) in Firestore by default. Exports are saved to `localStorage` only. This makes reproducible grading audits or re-processing impossible server-side.

Recommended addition for auditability
- Add a `Submissions` collection (or `Problems/{id}/submissions`) where each submission document stores:
  - `userId`, `problemId`, `capturedData` (or attachment to Cloud Storage), `exportedNetlist`, `sampleRate`, `createdAt`, `verdictSnapshot`.
- Persist the submission right after `AutoMarker` finishes grading so you can re-run offline or tune heuristics.


---

## 3) Firestore security rules (recommended)

There is no `firestore.rules` present in the repository. Below are recommended rules that mirror the app's intended access model. These assume you store the user's role in `Users/{uid}.role` (e.g. `"user"`, `"creator"`, `"admin"`).

Notes before applying rules
- If you use Firebase custom claims for roles, adapt checks to `request.auth.token.role` instead of reading the `Users` document.
- Reading the `Users` doc from rules (via `get()`) is possible but costs a document get charge on the rules engine — it's acceptable for small-scale but consider custom claims for large scale.

Suggested `firestore.rules` content (copy into your Firebase console or `firestore.rules` file):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Public reading of problems and associated public subcollections
    match /Problems/{problemId} {
      allow read: if true;
      // Writes (create/update/delete) restricted to admins or creators
      allow create, update, delete: if isAdmin() || isCreator();

      match /initialCircuit/{docId} {
        allow read: if true;
        allow write: if isOwnerOfProblem(problemId) || isAdmin() || isCreator();
      }

      match /solutionWaveform/{docId} {
        allow read: if true;
        // Only admins/creators (problem owners) can update golden solutions
        allow create, update, delete: if isOwnerOfProblem(problemId) || isAdmin();
      }
    }

    // Users collection: users may read their own document and write some profile fields
    match /Users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid; // user can read own profile
      allow update: if request.auth != null && request.auth.uid == uid; // user can update own profile
      allow create: if request.auth != null && request.auth.uid == uid; // allow initial creation
      // Admins can read all user docs
      allow read: if isAdmin();
    }

    // UserProgress: user can create/update their own progress; admins can read all
    match /UserProgress/{progressId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid || isAdmin();
      allow delete: if isAdmin();
    }

    // Optional Submissions collection recommendation
    match /Submissions/{submissionId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid || isAdmin();
      allow delete: if isAdmin();
    }

    // Helpers
    function isAdmin() {
      return request.auth != null && (
        // Prefer custom claims if available
        (request.auth.token.role != null && request.auth.token.role == 'admin') ||
        // Fallback: read the Users doc (costly for large scale)
        (get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'admin')
      );
    }

    function isCreator() {
      return request.auth != null && (
        (request.auth.token.role != null && request.auth.token.role == 'creator') ||
        (get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role == 'creator')
      );
    }

    function isOwnerOfProblem(problemId) {
      // The Problems doc is expected to include `creatorId` (uid)
      return request.auth != null && get(/databases/$(database)/documents/Problems/$(problemId)).data.creatorId == request.auth.uid;
    }
  }
}
```

Quick notes about the rules
- The rules restrict writes to `Problems` and golden solution subcollections to admins and creators (or the problem owner). This prevents anonymous or arbitrary accounts from changing problem definitions.
- `UserProgress` is writeable only by the owning user (and readable by the owner and admins). If you want instructors/admins to mark progress, extend rule accordingly.
- If you anticipate heavy reads on `Users` during rules evaluation, prefer custom claims on the Auth token (set via Cloud Functions / Admin SDK) to avoid rules-time `get()` overhead.


---

## 4) Role model (user types and capabilities)

1. Anonymous (unauthenticated)
   - Can: Browse landing page, read `Problems` and problem detail pages (public), view published circuit examples in `public/circuitAPI/`.
   - Cannot: Submit graded attempts (because `handleMarkAsComplete` currently expects a `userId`), write `UserProgress`, create or edit problems.

2. Authenticated user (`role: 'user'`)
   - Can: Attempt problems, capture waveforms, view grading results locally, have `UserProgress` written for their own completed problems, save local drafts (client-side).
   - Cannot: Create new problems, edit golden solutions, or manage other users.

3. Problem author / Creator (`role: 'creator'`)
   - All `user` capabilities plus:
   - Can: Create and update problem documents and subcollections (`initialCircuit`, `solutionWaveform`) for problems they own.
   - Intended to be used for people who author problem content.

4. Admin (`role: 'admin'`)
   - Full privileges: create/update/delete any `Problems` and `solutionWaveform`, read all `UserProgress` and `Submissions`, manage users.

Implementation notes
- The code stores a `role` on `Users/{uid}` in `lib/authUtils.syncUserDocument()` when creating the user document. This value is used in the UI (e.g., `Navbar.jsx` checks `user?.role === "admin"` to show admin links).
- For secure enforcement, the role must also be reflected in server-side rules (see Firestore rules above) or set as custom claims on the auth token.


---

## 5) `UserProgress` vs `Submissions` — what the repo stores today

What is stored today
- `UserProgress` (lightweight progress)
  - Current code writes the following document shape to `UserProgress/{userId}_{problemId}` when a challenge is completed:
    ```json
    {
      "userId": "<uid>",
      "problemId": "<problemId>",
      "status": "completed",
      "completedAt": <serverTimestamp>,
      "score": 100
    }
    ```
  - Purpose: quick lookup of which problems a user has completed and a simplistic score. This drives UI badges (green checks) in `ProblemList`.

- `Submissions` (NOT present today — recommended)
  - There is no persistent write of the user's captured waveform, exported netlist, or a verdict snapshot to Firestore in the current implementation. The only save of a user circuit is to `localStorage` (`draft_<problemId>`).

Why this distinction matters
- `UserProgress` is effectively a progress-tracking index. It is small and fast to query but insufficient for audit, replayability, or offline re-grading.
- `Submissions` should be an immutable audit trail of attempts and must include enough data to re-run grading later (captured samples or a pointer to storage where the raw CSV/JSON is kept, exported netlist string, verdict snapshot, and timestamps).

Recommended `Submissions` document shape (example)
```json
{
  "submissionId": "<uuid>",
  "userId": "<uid>",
  "problemId": "<problemId>",
  "createdAt": <serverTimestamp>,
  "type": "analog" | "digital",
  "capturedData": { /* a copy of the capturedData object or a reference to Cloud Storage */ },
  "exportedNetlist": "...text...",
  "verdictSnapshot": { /* copy of testSuite or final verdict */ },
  "score": 95
}
```

Flow change recommended: when `AutoMarker` finishes grading, write a `Submissions/{submissionId}` doc with the `capturedData`, `exportedNetlist`, and `verdictSnapshot`. Then update `UserProgress` as summary/index data. This preserves an audit trail and enables server-side re-processing later.


---

## 6) Actionable next steps (practical changes you can make right now)

- Add `Submissions` persistence: implement a `saveSubmission()` call in `SolveProblem.handleSimSubmit` or in `AutoMarker` after grading completes. Store either full `capturedData` (small) or upload a CSV to Cloud Storage and store a pointer.
- Replace the placeholder `userId` in `SolveProblem.handleMarkAsComplete()` with the authenticated `useAuth().user.uid` and protect the UI path so anonymous users cannot mark progress.
- Add `firestore.rules` to repo (copy recommended rules) and test them using the Firebase Emulator.
- Consider moving role info into Auth custom claims for performant rule evaluation.
- Harden CircuitJS integration: add a handshake using `postMessage` so the iframe can explicitly report ready/health and the parent does not rely solely on `contentWindow.CircuitJS1` existence.