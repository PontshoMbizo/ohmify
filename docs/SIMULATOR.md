# Simulator API Integration Guide (CircuitJS1)

This document provides an overview of the Falstad Circuit Simulator (CircuitJS1), its architecture, and how it is integrated into the Scope.io project.

## 1. Background: How it was written
[CircuitJS1](https://github.com/pfalstad/circuitjs1) is an electronic circuit simulator that runs in the browser. It is a JavaScript port of Paul Falstad's original Java-based circuit simulator. 

Instead of being written in raw JavaScript from scratch, the port was created using **GWT (Google Web Toolkit)**. The core simulation engine and UI logic are written in Java, and GWT compiles this Java codebase into highly optimized JavaScript. The `/public/circuitAPI` directory contains this compiled output.

## 2. Architecture & How it works
At its core, CircuitJS1 is a time-domain circuit simulator. 
- **MNA (Modified Nodal Analysis)**: The simulator formulates the circuit as a matrix of equations based on Kirchhoff's laws and solves for the voltages at every node and currents through voltage sources.
- **Non-linear components**: Devices like diodes and transistors are modeled using iterative numerical methods (like Newton-Raphson) to find a solution for each time step.
- **Time Stepping**: It uses numerical integration methods (such as the Trapezoidal rule) to model capacitors and inductors over time.
- **JS Interface**: The `jsinterface.html` (and the `CircuitJS1` object exposed to the window) acts as a bridge. It allows external JavaScript to invoke the internal Java methods that have been exposed via JSNI (JavaScript Native Interface).

## 3. Core API Functions
The Scope.io project interacts with the simulator via the `CircuitJS1` object attached to the iframe's `contentWindow`. Key functions utilized include:

- `sim.importCircuit(circuitString, false)`: Loads a text-based circuit definition into the simulator.
- `sim.setSimRunning(boolean)`: Pauses or resumes the simulation clock.
- `sim.getTime()`: Returns the current elapsed simulation time.
- `sim.getTimeStep()`: Returns the delta time (`dt`) used for each simulation step.
- `sim.getElements()`: Returns an array of all components currently on the canvas. (Warning: O(N) over all components; prefer using typed accessors if possible.)
- `elm.getInfo()`: Retrieves a string array describing the component (useful for identifying components like the "Voltmeter" or "Square Wave Gen").
- `elm.getType()`: Returns the internal type name (e.g., `LabeledNodeElm`).
- `elm.getLabelName()`: Returns the assigned label (e.g., "Input0", "Output1").
- `sim.getNodeVoltage(label)`: Retrieves the instantaneous voltage at a labeled node.
- `sim.ontimestep`: A callback hook that fires exactly once per simulation calculation step, allowing external scripts to record data or pause the simulation at exact moments.

### Safe & Efficient Integration API (Newly Added)
- `sim.getElementByLabel(label)`: Retrieves the JavaScript reference to the component with the exact given label (applicable to `LabeledNodeElm` and `ExtVoltageElm`), bypassing the need to poll and iterate the full element list.
- `sim.getElementsByType(type)`: Retrieves all components matching the internal class type (e.g., `ResistorElm`), skipping JSNI marshalling overhead for unrelated components.
- `sim.isCircuitValid()`: Returns `true` if the solver matrix is stable, or `false` if it encountered a singular matrix (e.g., direct short circuit or floating node).
- `sim.getSimulationErrors()`: Returns a detailed string explaining why the circuit crashed (e.g., `"Singular matrix!"`).
- `sim.setElementProperty(label, property, value)`: Dynamically mutates a numeric property (e.g., `"Resistance"`) of a specific labeled component on the fly, without needing to re-import the circuit string.
- `sim.addNodeVoltageListener(label, threshold)`: Registers a callback to trigger `sim.onnodevoltagechange` only when the labeled node's voltage changes by at least `threshold`, avoiding excessive `ontimestep` polling.

## 4. How Scope.io is Using It
Scope.io embeds the simulator as a core educational and grading engine. It runs the simulator headlessly (or semi-headlessly via an iframe) to validate student circuit designs against expected behaviors.

### The Wrapper (`components/Simulator.jsx`)
An iframe points to `/circuitAPI/circuitjs.html`. A React component waits for the iframe to load and then accesses the `CircuitJS1` global object.

### Data Extraction (`lib/samplingUtils.js`)
Instead of just visually verifying a circuit, Scope.io hooks into `sim.ontimestep` to extract precise telemetry:
- **Analog Validation**: Scope.io searches the component list for a `Voltmeter` and an `input` node. As the simulation steps, it records an array of input and output voltages. After collecting a fixed number of samples (e.g., 30720), it halts the simulation and yields the data for grading.
- **Digital Validation**: For logic circuits, Scope.io finds a clock generator and parses inputs/outputs (e.g., `Input0`, `Output1`). On every rising clock edge, it reads the node voltages, converting voltages > 2.5V into binary `1`s and packing them into integer buses.

## 5. Future Usage & Enhancements
Going forward, the integration can be expanded to support:
- **Interactive Tooling**: Directly injecting faults into the circuit (e.g., changing resistor values dynamically via `elm.setResistance()`) and asking the user to debug.
- **Component Limitation**: Programmatically analyzing `sim.getElements()` before running the simulation to enforce constraints (e.g., "Build a full adder using only NAND gates").
- **Performance Profiling**: Using the captured analog samples to generate Bode plots or perform FFT (Fast Fourier Transform) analysis to grade AC frequency responses natively.
- **Headless Grading Pipeline**: Moving the simulation completely out of the UI layer for backend or CI validation, provided a Node-compatible DOM environment (like JSDOM) is used to load the GWT output.

## 6. Integration Requirements (Safe & Efficient WebApp Integration)

> [!NOTE]
> **Status:** Implemented! We successfully patched the Java source code (`CirSim.java` and `JSInterface.java`) and recompiled CircuitJS1 to expose these critical methods directly to the UI.

CircuitJS ships as opaque GWT-compiled output (`public/circuitAPI/circuitjs1/`) — there's no
Java source in this repo to patch, so everything below is either (a) a wishlist for if/when
we fork `pfalstad/circuitjs1` and recompile, or (b) something we can build as a thin JS shim
around the existing `CircuitJS1` object without touching the GWT output. Each item is tied to
a real fragility in `components/Simulator.jsx` / `lib/samplingUtils.js`, not a hypothetical.

### A. Discovery should be type-based, not string-based
`captureAnalog`, `captureDigital`, and the digital-discovery block in `Simulator.jsx` all find
components by lower-casing `elm.getInfo()[0]` and checking `.includes("voltmeter")` /
`.includes("square wave gen")`. `getInfo()` strings are **localized** — this repo ships
`locale_de.txt`, `locale_fr.txt`, `locale_ja.txt`, etc. If a user's browser locale ever flows
into the simulator's UI language, discovery silently breaks because the English substring
never appears. Needed:
- `elm.getElementClass()` (or similar) returning a **stable, locale-independent identifier**
  per component kind — e.g. `"VoltmeterElm"`, `"SquareWaveGenElm"` — distinct from
  `getType()`, which already returns internal class-like names for some elements
  (`LabeledNodeElm`) but not reliably for all of them.
- Until that exists upstream, build a local shim (`lib/circuitDiscovery.js`) that maps
  `elm.getType()` → kind, falling back to the English info-string match only when
  `getType()` is ambiguous, and centralize it so the matching logic lives in exactly one
  place instead of being duplicated across `Simulator.jsx` and `samplingUtils.js`.

### B. Bulk/indexed accessors instead of full-element scans
Every capture and every submit currently does `sim.getElements().forEach(...)` and
re-derives voltmeter/clock/labeled-node lookups from scratch. For circuits with many
elements (e.g. a `relayff`-scale design) this is an O(n) scan per discovery call, done at
least twice per submission (once in `Simulator.jsx` for digital params, once inside
`samplingUtils`). Needed:
- `sim.getLabeledNodeVoltages()` returning a `{label: voltage}` map for all labeled nodes
  in one call, instead of N calls to `sim.getNodeVoltage(label)` per timestep — this is the
  single highest-value addition since `captureDigital` calls `getNodeVoltage` once per bus
  bit, per rising edge, for 330 cycles.
- `sim.findElementByLabel(label)` / `sim.findElementsByClass(kind)` so discovery is a single
  call instead of a manual `forEach` + string match repeated in two files.

### C. A real readiness handshake
`Simulator.jsx` polls for `iframe.contentWindow.CircuitJS1` with `setTimeout(loadCircuit, 10)`
and then waits a **blind, fixed 2000ms** (`handleIframeLoad`) before calling
`importCircuit`, because there's no signal for "the GWT app has finished bootstrapping and is
safe to drive." This is both slow (always pays the 2s tax) and fragile (a slower device could
need more than 2s). Needed:
- A `window.postMessage({type: "circuitjs-ready"})` or `CircuitJS1.onReady(callback)` hook
  fired once GWT onModuleLoad has actually completed, so we can drop the fixed delay and the
  10ms poll loop entirely.
- A matching `CircuitJS1.onImportError(callback)` (or a return value / thrown error from
  `importCircuit`) — right now `loadCircuit()` only catches synchronous JS exceptions; a
  malformed netlist that the parser silently rejects or partially loads has no signal back to
  the wrapper.

### D. Surface simulation health, not just node values
`captureAnalog`/`captureDigital` only fail on a JS exception inside `ontimestep` or on the
60s timeout. A circuit that's non-convergent, has a singular matrix, or is producing NaN
voltages currently just streams garbage samples (or zeros, since both capture functions
substitute `0` for `undefined`) all the way into grading, where it fails an RMSE check far
from the actual cause. Needed:
- `sim.getSimError()` / `sim.isConverged()` — expose whatever internal error string the
  simulator already shows in its own UI (e.g. "singular matrix!") via the JS interface, so
  capture can `reject()` immediately with the real cause instead of an opaque NRMSE mismatch.
- `ontimestep` (or a new `onsimerror`) should fire with the error rather than just going
  silent — today a stalled solver and a slow-but-healthy one look identical from JS until the
  60s timeout fires.

### E. A dry-run validation mode for Creator Studio
`docs/CREATOR-CONVENTIONS.md` defines a pre-publish checklist (voltmeter present, clock +
`clk` node present, `Output0..n` labeled, etc.) that's currently only enforced *implicitly* —
by the same capture code failing at grading time. Needed:
- `sim.validateCircuit()` returning the discovered instrumentation (voltmeter found?, labeled
  nodes list, clock element found?) **without running the simulation**, so Creator Studio can
  check the convention checklist at publish time and reject a problem before any solver hits
  the "Discovery Error" message that's currently the most common support complaint.

### F. Headless / fast-forward execution
Capture today runs in real iframe time, paced by the simulator's own render loop — 330 clock
cycles or 30,720 samples take as long as the UI takes to animate them, because `ontimestep`
piggybacks on the same loop driving the canvas redraw. For grading (server-side verification,
golden-solution capture, or a future CI check per `docs/REVIEW-2026-06-11.md`), wall-clock
speed shouldn't be coupled to render speed. Needed:
- `sim.runHeadless(steps, { render: false })` or a `sim.setRenderEnabled(false)` flag that
  lets `ontimestep` fire as fast as the solver can step, decoupled from `requestAnimationFrame`.
  This is also the prerequisite for the "Headless Grading Pipeline" item in §5 — without a
  render-decoupled stepping mode, moving grading server-side still requires a real browser
  paint loop running somewhere.

## 7. Integration changelog (what the app actually uses now)

The recompiled runtime's new methods are wired into Scope.io as follows. Every call site
**feature-detects** the new method and falls back to the legacy behaviour when it's absent, so
the code still works against an un-patched `circuitjs1/` build and under unit-test mocks.

### New module: `lib/circuitDiscovery.js`
A single home for "find instrumentation in the running sim", removing the duplicated
`getElements().forEach(...)` + localized `getInfo()` matching that previously lived in both
`Simulator.jsx` and `samplingUtils.js`. Exports:
- `getLabeledNodes(sim)` — uses `sim.getElementsByType("LabeledNodeElm")` (one bulk, typed,
  locale-independent call) instead of scanning every element; falls back to a filtered
  `getElements()` scan. **(addresses §6.A discovery + §6.B bulk accessors)**
- `findElementByLabel(sim, label)` / `hasLabeledNode(sim, label)` — wrap
  `sim.getElementByLabel(label)`; fall back to scanning labeled nodes.
- `findVoltmeter(sim)` / `findClock(sim)` — kept as info-string matches **on purpose**: the
  voltmeter is behaviour-based and "square wave gen" is a voltage source whose *waveform
  property* is square (class is `VoltageElm`/`RailElm`), so neither maps to a distinct class
  name. Now centralized in one place.
- `discoverDigitalIO(sim)` — returns `{ clkElm, inputs[], outputs[] }`, buses sorted LSB-first
  numerically. Replaces the inline discovery block formerly in `Simulator.jsx`.
- `checkCircuitHealth(sim)` — wraps `sim.isCircuitValid()` / `sim.getSimulationErrors()`,
  returning `{ valid, error }`. **(addresses §6.D surfacing simulation health)**

### `lib/samplingUtils.js`
- `captureAnalog` / `captureDigital` now discover instrumentation through `circuitDiscovery`
  instead of their own element scans.
- Both capture loops poll `checkCircuitHealth(sim)` every `HEALTH_CHECK_INTERVAL` (256) steps
  and **`reject()` immediately with the solver's own message** (e.g. "Singular matrix!")
  instead of streaming garbage/zero samples into the RMSE grader until the 60s timeout. This
  turns the most confusing failure mode (an opaque NRMSE mismatch far from the real cause)
  into an actionable error. **(§6.D)**

### `components/Simulator.jsx`
- Digital discovery is now a single `discoverDigitalIO(sim)` call.
- The blind, fixed **2000 ms** post-`onLoad` delay before `importCircuit` is replaced by the
  `oncircuitjsloaded` readiness hook the recompiled runtime fires once GWT `onModuleLoad`
  completes (`win.oncircuitjsloaded = bootOnce`). If `CircuitJS1` is already present we boot
  immediately; the 2 s timer is kept only as a safety net for an un-patched runtime that never
  fires the hook. A `bootedRef` one-shot guard ensures the bootstrap runs once no matter which
  signal wins the race. **(addresses §6.C readiness handshake — removes the fixed 2 s tax on
  every problem load)**
- **Startup-clobber guard.** The runtime loads its `startCircuit=blank.txt` via an *async*
  fetch that resolves shortly *after* `oncircuitjsloaded` fires. Importing on the hook alone
  means blank.txt lands ~1 s later and silently wipes the imported circuit (the old blind 2 s
  delay only masked this by importing *after* the clobber). `bootCircuit()` instead imports
  immediately, records the resulting element count, and runs a short watchdog (every 150 ms
  for ≤ 3 s) that re-asserts the template whenever the canvas drops below that count. This is
  machine-speed independent — a slow device that clobbers late is still corrected — and a
  blank template (count 0) opts out, since an empty canvas is its intended state.

### Tests
- `__tests__/circuitDiscovery.test.js` (new) — typed-accessor vs. fallback paths,
  label lookup, LSB-first bus ordering, and `checkCircuitHealth` across patched / un-patched
  / error states.
- `__tests__/samplingUtils.test.js` — added solver-health rejection cases for both capture
  modes plus a healthy-path regression. Suite: 63 → 83 tests.

### Per-problem time step is applied to the solver
Each problem has its own time step (`Problems.timeStep`, mirrored by
`solutionWaveform.sampleRate`). Template netlists exported by Creator Studio,
however, carry whatever step the author's canvas was at — frequently CircuitJS's
default `1e-3` — so the solver ran ~200× coarser than the golden was graded at,
and `/api/grade` rejected every honest submission with *"time step doesn't match
this problem's reference."*
- New `lib/netlistUtils.js#patchTimeStep(netlist, timeStep)` rewrites token 2 of
  the `$` options line to the declared step (pure, fully unit-tested), so the
  solver *stamps* reactive elements at the correct step on import.
- `Simulator.jsx` then pins it deterministically via the exposed runtime setter
  `sim.setMaxTimeStep(ts)` (sets both `sim.timeStep` and `sim.maxTimeStep`) on
  every import **and** again at submit, independent of header parsing. The
  `timeStep` prop is threaded from the problem doc through `SolveProblem` and
  from `SolutionSection` (Creator Studio) — so **golden capture and user capture
  both run at `Problems.timeStep`**, guaranteeing their rates agree. A missing
  `timeStep` prop is surfaced with a console warning rather than silently
  falling back to CircuitJS's default step.
- `captureAnalog`/`captureDigital` already report the *nominal* step via
  `getMaxTimeStep()` (CircuitJS adaptively halves `getTimeStep()` for stiff
  circuits), so the reported sample rate is stable.
- `/api/grade` now accepts a capture whose rate matches **either** the declared
  step (`1/Problems.timeStep`) **or** the stored golden `sampleRate`, and logs
  all three rates on mismatch — so a legacy problem with a jittered stored rate
  no longer blocks submissions, and any remaining mismatch is diagnosable.

### Automated load sweep (`setElementProperty` adopted)
Load problems no longer ask the solver to edit the voltmeter resistance and submit three
times. `lib/samplingUtils.js#captureLoadSweep` sets the output voltmeter's resistance to
each testbench load via `sim.setElementProperty("output", "Resistance", ohms)`
(`lib/circuitDiscovery.js#setVoltmeterResistance`, feature-detected), resets, and runs a full
analog capture per load — all from one Submit. `Simulator.jsx` takes a `loads` prop and routes
load problems through the sweep; `AutoMarker` grades the three captures in sequence; Creator
Studio captures the golden the same way. The output voltmeter must be **labeled `output`** so
it can be targeted by label (see `docs/CREATOR-CONVENTIONS.md`). Fails closed: an un-patched
runtime (no `setElementProperty`) rejects up-front rather than grading three identical captures.

### Deliberately deferred
- **`addNodeVoltageListener` + `onnodevoltagechange`** — exposed by the runtime but not yet
  adopted. Event-driven clock-edge capture would mean rewiring the grading hot path (analog
  still needs every timestep; digital still reads the whole bus per edge), so it's left for a
  focused follow-up rather than bundled with this discovery/health pass.
- **§6.E dry-run `validateCircuit`** for Creator Studio and **§6.F headless/fast-forward
  execution** — no corresponding method is exposed by the current build, so they remain open.
