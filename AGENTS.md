# Scope.io — Agent Context

## What this project is
Scope.io is a LeetCode-style platform for electronics engineers. Users browse problems, build circuits in an embedded CircuitJS simulator, submit them, and get automated graded feedback. Think "competitive programming judge" but for circuits.

## Tech stack
- **Framework**: Next.js (App Router, v16) + React 19
- **Styling**: Tailwind CSS + daisyUI
- **Simulation engine**: CircuitJS (embedded in `public/circuitAPI/` as a same-origin iframe)
- **Backend**: Firebase v12 — Firestore (data) + Auth (Google sign-in). Server routes use `firebase-admin`.
- **Charts / math**: Chart.js, react-chartjs-2, MathJax
- **Tests**: Vitest (`npm test`) — 63 tests over the four `lib/` analysis modules

## Architecture in one paragraph
The browser captures waveform samples from the CircuitJS iframe and POSTs them to `/api/grade`. **All grading runs server-side** in that route: it fetches the problem + golden solution from Firestore, runs the numeric comparison, and — for verified users — writes `UserProgress` via the Admin SDK. The client never decides pass/fail and never writes progress. See `docs/ARCHITECTURE.md` for the full pipeline and `docs/REVIEW-2026-06-11.md` for the rationale behind the current design.

## Project structure (key files)
```
app/
  layout.js                    # Global layout, wraps with AuthProvider + Navbar
  page.js                      # Landing page
  api/grade/route.js           # ★ SERVER-SIDE GRADING — the trust boundary. Node runtime.
  create/page.js               # Creator Studio entry
  problem/
    page.js                    # Problem list — paginated Problems + UserProgress (two effects)
    [id]/page.js               # Problem detail — loads metadata, initialCircuit, solutionWaveform

components/
  Auth/AuthProvider.jsx        # Auth state — exposes useAuth() { user, loading, signIn, signOut }
  Navbar.jsx                   # Global nav
  ProblemList.jsx              # Topic filters, difficulty badges, completion markers, load-more
  Simulator.jsx                # CircuitJS iframe integration + capture trigger
  SimulationWindow/
    SolveProblem.jsx           # Circuit/draft state, testSuite state, mounts AutoMarker
    AutoMarker/AutoMarker.jsx  # POSTs capture to /api/grade, renders Results
    AutoMarker/Results.jsx     # Chart.js rendering of verdict (dynamic import, ssr:false)
  CreateProblemWindow/         # 4-step Creator Studio (Metadata→Topic→Template→Solution)
  ProblemDescriptionWindow/    # Problem statement, editorial, sample solutions

lib/
  firebase.js                  # Client Firebase init (NEXT_PUBLIC_FIREBASE_* env vars)
  firebaseAdmin.js             # Admin SDK init (FIREBASE_SERVICE_ACCOUNT_JSON) — server only
  authUtils.js                 # Google popup sign-in, syncUserDocument()
  gradingUtils.js              # Pure: calculateNormalizedRMSE, gradeDigital, getVerdict, calculateFinalVerdict
  samplingUtils.js             # Pure: captureAnalog / captureDigital (drive the sim, collect samples)
  signalUtils.js               # Pure: FFT → spectrum + Bode magnitude/phase
  GeneralUtils.js              # Constants (PROBLEM_TYPES, digitalTopics), isDigitalProblem, toHex/toDB

public/circuitAPI/             # CircuitJS runtime — loaded into iframe by Simulator.jsx
```

## Firestore data model
```
Problems/{id}
  fields: { title, description, difficulty, topics[], testType, testbench,
            timeStep, sampleCount, creatorId, creatorName, createdAt }
  └── initialCircuit/data        # { version, payload }  — starting netlist string
  └── solutionWaveform/{testKey} # { samples, sampleRate } — golden output, test1..test3

Users/{uid}                      # { uid, displayName, email, photoURL, role, totalPoints,
                                 #   completedProblems[], createdAt }
                                 # role/points/completedProblems are NOT client-writable (rules)

UserProgress/{uid}_{problemId}   # { userId, problemId, passedTests{}, status, completedAt?, score? }
                                 # written ONLY by the grade API via Admin SDK
```
`testbench` shape depends on `testType`: load → `{ noload, maxload, minload }`; digital → `{ payload1..3 }`; signal → `{ isSignal: true }`.

## Grading strategies (3 types, selected by `problem.testType`)
1. **`load`** (Power Electronics) — time-domain Normalized RMSE across three testbench loads (No-load / Max / Min). All three must pass to complete.
2. **`signal`** (Waveshaping / DSP) — single capture; NRMSE plus spectral/Bode comparison. Only `test1` required.
3. **`digital`** (Logic / Gates) — clock-synchronized sampling, bit-packed bus values compared exactly against a golden decimal table. Requires 100% cycle match.

`testType` is read **server-side from the problem document**, never from the request body — a client cannot pick a more lenient mode. Thresholds live in `gradingUtils.getVerdict`.

## Security / trust model (read before touching grading or rules)
- The **trust boundary is `/api/grade`**. Treat anything from the client (`capturedData`) as hostile: it's validated, size-capped, and checked for length/sample-rate before grading.
- `topics`, `testType`, `testbench` come from the **problem doc**, not the request.
- `UserProgress` is **Admin-SDK-only**; `firestore.rules` denies all client writes to it. Never reintroduce a client-side progress write.
- `Users.role` is **not client-writable** (it gates `isAdmin()` — self-escalation would be account takeover). Grant roles via the console or a custom claim; see `docs/DEPLOYMENT.md`.
- In production, a missing Admin SDK means tokens are NOT trusted (anonymous), so `FIREBASE_SERVICE_ACCOUNT_JSON` is required for progress to save.

## Creator circuit conventions (the implicit capture contract)
The capture engine discovers instrumentation by convention. A problem that violates these will fail to grade — see `docs/CREATOR-CONVENTIONS.md` for the full list. Essentials:
- **Analog**: exactly one element whose info string contains "voltmeter", placed across the output. Optional labeled node `input` for the input reference.
- **Digital**: a "square wave gen" element acts as the clock; a node labeled `clk`; output bus nodes labeled `Output0`, `Output1`, … (LSB first); optional `Input0..N`.
- **Time step**: the template's time step is the contract. Solutions are graded against the rate the golden capture ran at (±5% tolerance), so the solver must use the template's step. Resetting the template restores it.

## Conventions
- **UI / styling**: before building or editing any UI, read `UI.md` and match the
  existing design language (green=app / blue=Create, `rounded-2xl` cards, `font-black
  uppercase tracking-widest` labels, daisyUI components, Geist fonts). Don't introduce
  new colors, fonts, or icon sets.
- **Auth**: always use the `useAuth()` hook — never read Firebase auth directly in components.
- **Firestore (client)**: access via `lib/firebase.js` exports; keep direct SDK use in pages/`lib`, not scattered through components.
- **Firestore (server)**: privileged reads/writes go through `lib/firebaseAdmin.js` in API routes only.
- **CircuitJS**: all simulator interaction goes through `components/Simulator.jsx` via direct `iframe.contentWindow.CircuitJS1` method calls (NOT postMessage). Treat the runtime as a black box; don't spread sim calls across components.
- **New problem types** need a new grading branch in `app/api/grade/route.js` AND a capture path in `lib/samplingUtils.js`.
- **Env vars**: client config via `NEXT_PUBLIC_FIREBASE_*`; server secret via `FIREBASE_SERVICE_ACCOUNT_JSON`. Never hardcode or commit. See `.env.example`.

## Simulation gotchas
- Sampling is driven by `sim.ontimestep` (discrete sim steps, not wall-clock), so repeated runs from the same netlist + step are deterministic.
- CircuitJS is same-origin in an iframe and exposes `CircuitJS1` on `contentWindow`. There is no ready handshake — `Simulator.jsx` retries until `CircuitJS1` is defined, then waits before importing.
- Captures now time out after 60s (`samplingUtils`) so a paused/non-converging sim can't hang the UI forever.
- `solutionWaveform.samples` is a large newline-delimited string (~30k lines at default sampleCount). Watch the 1 MiB Firestore doc limit if `sampleCount` grows.

## How to run locally
```bash
npm install
cp .env.example .env.local      # fill in NEXT_PUBLIC_FIREBASE_* (and FIREBASE_SERVICE_ACCOUNT_JSON for progress)
npm run dev
npm test                        # vitest
```
Without the Admin SDK locally, grading still works but progress isn't persisted (logged as a warning) and tokens are decoded unverified (dev only).

The `/tools` area embeds two externally-hosted simulators (FPGA + MCU) via iframe — set `NEXT_PUBLIC_NIKA_URL` / `NEXT_PUBLIC_STM_URL` to run them locally. See `docs/TOOLS.md`.

## Docs map
- `UI.md` — design system / style guide; read before any UI work
- `docs/TOOLS.md` — the `/tools` area: embedded FPGA (nikaV) + MCU (stmV) simulators, iframe model, env vars
- `docs/ARCHITECTURE.md` — CircuitJS contract, full grading pipeline, data model, roles
- `docs/CREATOR-CONVENTIONS.md` — circuit labeling rules creators must follow
- `docs/DEPLOYMENT.md` — Vercel + Firebase free-tier deploy, rules/index deploy, role granting
- `docs/REVIEW-2026-06-11.md` — review findings, what changed and why, prod roadmap
- `docs/firestore_rules.md`, `docs/route_map.md` — rules walkthrough and route map
- `TASKS.md` — issue/task board

## How to help me effectively
- Read `TASKS.md` and `docs/REVIEW-2026-06-11.md` first to understand current state and open risks.
- When touching grading, check all three modes AND the server route's validation — the route is the security boundary.
- When touching Firestore access, check `app/problem/page.js`, `app/problem/[id]/page.js`, and `app/api/grade/route.js`.
- Keep CircuitJS interaction inside `Simulator.jsx`.
- Prefer editing existing components over creating new ones unless the feature clearly warrants it.
