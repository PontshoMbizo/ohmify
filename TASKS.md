#done
1. ✅ auto-reset on submit — Submit now calls `sim.reset()` automatically (no more "please reset" alert). `components/Simulator.jsx`.
2. ✅ sim speed slider stays consistent with the real sim speed after sim-reset and template-reset — the slider now pulls `sim.getSpeed()` after every import and reset. `components/Simulator.jsx` (`syncSpeed`).
3. ✅ resizable problem-description / simulator divider — new `components/ResizableSplit.jsx`, wired into `app/problem/[id]/page.js` (drag on desktop, stacks on mobile).
4. ✅ automated load sweep — one Submit sets the output voltmeter's resistance to each testbench load (No-load / Max / Min) via `sim.setElementProperty("output","Resistance",ohms)`, resets, and captures each; `AutoMarker` grades all three; Creator Studio captures the golden the same way. Output voltmeter must be labeled `output` (see `docs/CREATOR-CONVENTIONS.md`). Files: `lib/circuitDiscovery.js`, `lib/samplingUtils.js#captureLoadSweep`, `Simulator.jsx`, `SolveProblem.jsx`, `AutoMarker.jsx`, `SolutionSection.jsx`. Tests added (97 pass).

#improvements backlog (task 5) — grading flow & solution storage
Prioritized; grounded in the current code. Pick any and I'll implement.

## Grading flow
1. **Headless / fast-forward capture (biggest win, now 3× more pressing).**
   Capture runs in real iframe render time (`ontimestep` rides the canvas redraw loop). A load
   submit now runs three sequential ~30k-sample captures back-to-back, so a load attempt is ~3×
   slower than before. The runtime doesn't yet expose a render-decoupled stepping mode
   (`setRenderEnabled(false)` / `runHeadless(steps)`, SIMULATOR.md §6.F). Interim mitigations:
   lower the default `sampleCount`, or decimate the capture (see storage #3). Real fix needs a
   runtime patch.
2. **Batch the three load grades into one `/api/grade` call.**
   `AutoMarker.gradeSweep` fires three sequential POSTs. A single request carrying all three
   captures would cut latency, do one problem-doc cache lookup instead of three, and let the
   server write `UserProgress` in one transaction. Server already reads testbench once per call.
3. **Phase/alignment tolerance in NRMSE.**
   `calculateNormalizedRMSE` compares sample-by-sample, so a small time offset between the
   user's and golden's start fails a waveform that's correct but shifted. Consider a best-shift
   alignment (cross-correlate, pick min-RMSE offset within a small window) or a tolerance band.
4. **Reject obviously-miswired captures early.**
   `checkCircuitHealth` catches solver blow-ups, but an all-zero / flat output (floating output,
   probe on the wrong node) still streams to the grader and fails as an opaque NRMSE miss. A
   cheap "output never moved" check could return an actionable message instead.

## Problem-solution storage
1. **Waveform size vs the 1 MiB Firestore doc limit.**
   `solutionWaveform.samples` is a ~30k-line newline-delimited *text* string; load problems store
   three of them. As `sampleCount` grows this approaches the per-doc limit. Cheapest win: store a
   packed `Float32Array` as base64 (~4 bytes/sample vs ~10–18 chars/line) — roughly halves the
   doc and removes the parse. Bigger: move large goldens to Cloud Storage and keep a pointer.
2. **Parse the golden once, not per grade.**
   The server re-runs `extractDataPoints` (string→float) on every submission (mitigated by the
   5-min per-instance cache). A packed binary form removes the per-grade parse entirely.
3. **Decouple compare/storage cost from capture length.**
   Grade against a decimated reference (every Nth sample) so storage and the NRMSE/FFT loops
   don't grow linearly with how long the capture runs.
