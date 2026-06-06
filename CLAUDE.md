# Ohmify — Claude Context

## What this project is
Ohmify is a LeetCode-style platform for electronics engineers. Users browse problems, interact with embedded CircuitJS simulations, submit circuit solutions, and receive automated graded feedback. Think "competitive programming judge" but for circuits.

## Tech stack
- **Framework**: Next.js (App Router) + React 19
- **Styling**: Tailwind CSS + daisyUI
- **Simulation engine**: CircuitJS (embedded in `public/circuitAPI/` as an iframe)
- **Backend**: Firebase v12 — Firestore (data) + Auth (Google sign-in)
- **Charts / math**: Chart.js, react-chartjs-2, MathJax

## Project structure (key files)
```
app/
  layout.js                    # Global layout, wraps with AuthProvider + Navbar
  page.js                      # Landing page
  problem/
    page.js                    # Problem list — fetches Problems + UserProgress
    [id]/page.js               # Problem detail — loads metadata, initialCircuit, solutionWaveform

components/
  Auth/AuthProvider.jsx        # Auth state — exposes useAuth() { user, loading, signIn, signOut }
  Navbar.jsx                   # Global nav
  ProblemList.jsx              # Topic filters, difficulty badges, completion markers
  Simulator.jsx                # CircuitJS iframe integration
  SimulationWindow/            # SolveProblem, auto-marker, simulator controls
  ProblemDescriptionWindow/    # Problem statement, editorial, sample solutions

lib/
  firebase.js                  # Firebase init (reads NEXT_PUBLIC_FIREBASE_* env vars)
  authUtils.js                 # Google popup sign-in, syncUserDocument()

public/circuitAPI/             # CircuitJS runtime — loaded into iframe by Simulator.jsx
```

## Firestore data model
```
Problems/{id}
  └── initialCircuit/data        # Starting netlist for the problem
  └── solutionWaveform/{docs}    # Correct waveform samples (sampleRate, metadata)

Users/{uid}                      # User profile doc (created by syncUserDocument)

UserProgress/{...}               # Tracks which problems a user has completed
```
Each `Problems/{id}` also has a `completedProblems` array on the User document, and `ProblemList` marks completion via a `Set` of completed IDs.

## Grading strategies (3 types)
1. **Load / Power Electronics** (`load`) — time-domain comparison, Normalized RMSE across testbench loads (No-load, Max, Min)
2. **Signal / DSP** (`signal`) — single capture, spectral comparison (Bode plot magnitude/phase)
3. **Digital** (`digital`) — clock-synchronized sampling, SRAM map comparison via decimal output of labeled nodes, golden standard table lookup

Key grading components: `components/SimulationWindow/SolveProblem.jsx`, `components/Simulator.jsx`

## Current state (as of last update)
See `TASKS.md` for the live task list. Key pending items:
- Finalize `gradeDigital` bit-packing comparison logic
- Add SRAM payload format validation in Creator Studio
- Implement "Global Progress" stats in Drawer/Navbar

## Conventions
- **Auth**: Always use `useAuth()` hook — never read Firebase auth directly in components
- **Firestore**: Access via `lib/firebase.js` exports; no direct Firebase SDK imports in components
- **CircuitJS**: All simulator interaction goes through the iframe postMessage API in `Simulator.jsx` — do not try to access CircuitJS internals directly
- **Problem types**: Always validate against the three grading modes (`load`, `signal`, `digital`) — new problem types need a new grading strategy implementation
- **Environment vars**: All Firebase config via `NEXT_PUBLIC_FIREBASE_*` in `.env.local` — never hardcode, never commit

## Simulation gotchas
- Deterministic sampling can be unreliable at low sample rates; prefer higher rates or exported CSV
- CircuitJS is embedded as an iframe and communicates via postMessage — treat it as a black box
- `solutionWaveform` subcollection stores large text strings in Firestore — keep an eye on document size limits

## How to run locally
```bash
npm install
# create .env.local with NEXT_PUBLIC_FIREBASE_* keys
npm run dev
```

## How to help me effectively
- Read `TASKS.md` first to understand what's in progress
- When touching grading logic, check all three grading modes for impact
- When touching Firestore queries, check both `app/problem/page.js` and `app/problem/[id]/page.js`
- Prefer editing existing components over creating new ones unless the feature clearly warrants it
- Keep CircuitJS iframe interaction inside `Simulator.jsx` — don't spread postMessage calls
