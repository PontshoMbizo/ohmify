#done
1. ✅ auto-reset on submit — Submit now calls `sim.reset()` automatically (no more "please reset" alert). `components/Simulator.jsx`.
2. ✅ sim speed slider stays consistent with the real sim speed after sim-reset and template-reset — the slider now pulls `sim.getSpeed()` after every import and reset. `components/Simulator.jsx` (`syncSpeed`).
3. ✅ resizable problem-description / simulator divider — new `components/ResizableSplit.jsx`, wired into `app/problem/[id]/page.js` (drag on desktop, stacks on mobile).
4. ✅ automated load sweep — one Submit sets the output voltmeter's resistance to each testbench load (No-load / Max / Min) via `sim.setElementProperty("output","Resistance",ohms)`, resets, and captures each; `AutoMarker` grades all three; Creator Studio captures the golden the same way. Output voltmeter must be labeled `output` (see `docs/CREATOR-CONVENTIONS.md`). Files: `lib/circuitDiscovery.js`, `lib/samplingUtils.js#captureLoadSweep`, `Simulator.jsx`, `SolveProblem.jsx`, `AutoMarker.jsx`, `SolutionSection.jsx`. Tests added (97 pass).

5. ✅ **load-sweep wiring (prerequisite).** `captureLoadSweep` + its consumers existed, but no
   version of `Simulator.jsx` ever consumed the `loads` prop — load problems silently fell back to a
   single `captureAnalog` and only the active tab graded. `Simulator.jsx` now branches non-digital
   captures to `captureLoadSweep` when `loads` is present, so one Submit captures No-load / Max / Min
   (also fixes the creator's golden capture).
6. ✅ **task 5.1 — auto-reset on submit.** Removed the "please click Reset" gate; `handleInternalSubmit`
   calls `sim.reset()` before capturing so a running sim (t>0) submits correctly. The manual "Reset
   simulation" button is kept as a convenience. `components/Simulator.jsx`.
7. ✅ **task 5.2 — batched load grading.** `AutoMarker.gradeSweep` now sends all three captures in one
   `/api/grade` POST (`{ problemId, captures }`); the route grades each via a shared
   `gradeAnalogCapture` helper, writes `UserProgress` once, and counts as one rate-limit hit. Returns
   `{ testResults, errors, isCompleted }`; oversized batches return 413 and the client falls back to
   per-load requests. Files: `app/api/grade/route.js`, `components/.../AutoMarker.jsx`.
8. ✅ **task 5.4 — reject miswired captures early.** New pure `gradingUtils.isDeadOutput` /
   `signalRange`; the grade route returns "Output never changed — check the voltmeter / floating
   output" when the golden varies but the user's output is flat (never fires on flat/DC goldens).
   Files: `lib/gradingUtils.js`, `app/api/grade/route.js`, tests in `__tests__/gradingUtils.test.js`.

9. ✅ **storage 1+2 — packed Float32 golden waveforms.** New `lib/waveformCodec.js`
   (`encodeWaveform`/`decodeWaveform`, "f32:" base64, isomorphic) replaces the newline-text format —
   ~2-3× smaller docs and no per-grade text parse. Backward compatible: the codec auto-detects and
   still decodes legacy text. Wired into the write path (`SolutionSection`), server grade
   (`route.js`), and client readers (`app/problem/[id]/page.js`, `SampleSolution.jsx`).
10. ✅ **storage 3 — decimated goldens.** Long captures are stored decimated (`computeDecimation`,
   target 8192 samples; signal problems keep full resolution). The stride `decimation` is stored on
   the solution doc and read **server-side**; the grader decimates the user capture to match and uses
   `effectiveRate = userRate/D` for the FFT. The NRMSE the decimation injects is computed at publish
   time (`gradingUtils.decimationError`), stored as `decimationError`, and subtracted as grading
   headroom. Legacy docs (no `decimation`) grade with D=1 → byte-identical to before.
11. ✅ **hybrid analog grade.** Analog pass/fail now uses a blended error (same % units, so it reuses
   the topic thresholds + `getVerdict`): **70%** time-domain NRMSE, **20%** frequency-domain
   (aligned magnitude spectra via `signalUtils.getMagnitudeSpectrum`), **10%** key features
   (`gradingUtils.extractFeatures`: RMS / peak / settling time). The verdict carries the component
   breakdown for richer feedback. Files: `lib/gradingUtils.js`, `lib/signalUtils.js`,
   `app/api/grade/route.js`; tests in `__tests__/gradingUtils.test.js` + `__tests__/waveformCodec.test.js`.
12. ✅ **backfill script** `scripts/backfillWaveforms.mjs` — re-encodes legacy text goldens to packed
   (`--dry-run`, `--decimate` flags; skips digital + already-packed). Needs `FIREBASE_SERVICE_ACCOUNT_JSON`.

#improvements backlog (task 5) — grading flow & solution storage
Prioritized; grounded in the current code. Pick any and I'll implement.

## Grading flow
3. **Phase/alignment tolerance in NRMSE.** (deferred — changes pass/fail semantics)
   `calculateNormalizedRMSE` compares sample-by-sample, so a small time offset between the
   user's and golden's start fails a waveform that's correct but shifted. Consider a best-shift
   alignment (cross-correlate, pick min-RMSE offset within a small window) or a tolerance band.

# audit 2026-07-04 — simulator-embed bugs + core-functionality sweep

## fixed in this pass
13. ✅ **embed init race (the "nika loses its problem solution / solution not recorded" bug).**
   `scopeio:init` was posted once, fire-and-forget, on the iframe `load` event — which races the
   sim app's React hydration. A dropped init = no starter code seeded AND no embed Submit button.
   Both sims now post `scopeio:ready` once their listener is registered (`announceReady()` in
   nikaV/stmV `src/lib/scopeioBridge.js`), and `SimulatorEmbed.jsx` (re)sends init on that message
   (onLoad send kept as a fallback; the sims seed from init only once, so duplicates are harmless).
14. ✅ **result view no longer unmounts the embedded sim.** `SolveProblem.jsx` used a ternary, so
   showing AutoMarker destroyed the iframe and back-nav remounted a fresh sim restored only by the
   racy one-shot init. The embedded iframe now stays mounted (CSS-hidden) behind the result view —
   back-nav is instant and keeps all editor/waveform state. circuitjs keeps the old unmount flow
   (it restores synchronously from `exportCircuit()`).
15. ✅ **grading errors are no longer silent.** `AutoMarker.gradeTest`/`gradeSweep` swallowed every
   HTTP/server error (`console.error` only) — a 429/400 left the user on "Awaiting Capture" with no
   feedback. All grade failures (single, batch per-test errors map, 413 fallback) now surface via
   `runError`. Also added a signed-out banner: the server grades but never writes UserProgress
   without a verified uid, so unrecorded completions were invisible.
16. ✅ **capture mode now follows `testType`.** Solve-path captures were chosen from topics
   (`GeneralUtils.isDigitalProblem`) while the server grades by the problem's `testType` — a
   `digital` problem with a non-digital topic captured analog, sent `{table: undefined}`, and got a
   permanent 400: unsolvable. `SolveProblem.jsx` now passes `isDigital={testType === "digital"}`
   (matches the creator side, which already used `problemType`).
17. ✅ **publish-time stack overflow on long captures.** `calculateNormalizedRMSE` used
   `Math.max(...expected)`; the publish-time `decimationError` path runs it on the full-resolution
   capture, and big `sampleCount` blew the engine's argument limit (RangeError → whole publish
   batch failed). Now a loop. `lib/gradingUtils.js`.
18. ✅ **user spectrum/Bode plotted on the golden's x-axis.** `getFrequencyData` skips near-zero
   bins per call, so user and golden freq arrays can differ; Results zipped the user's series
   against `freqLabels` (the golden's bins). The grade route now returns `userFreqLabels` and
   `Results.jsx` plots each series against its own bins. Grading unaffected (uses aligned
   `getMagnitudeSpectrum`).
19. ✅ **goldens no longer eagerly downloaded on every problem view.** `app/problem/[id]/page.js`
   fetched the entire `solutionWaveform` subcollection (large packed sample strings) on load;
   only the Solutions tab needs it. `SampleSolution.jsx` now lazy-loads it on first tab open
   (IntersectionObserver — the CSS tabs keep it mounted but display:none).
20. ✅ **Navbar avatar fallback** was the relative `"profile.png"` → 404 on nested routes like
   `/problem/[id]`. Now `/profile.png`.

## backlog (found, deliberately not fixed — semantic/security design changes)
21. **FPGA/MCU exact-match grading is brittle.** `gradingUtils.gradeSequence` compares value-change
   lists index-by-index and the digital verdict requires `matchRatio >= 1.0` — one extra/missing
   edge (e.g. an initial-state transition) shifts every index and fails a functionally correct
   design. Consider edge-list normalisation (dedupe consecutive equal values, ignore t=0 seeding)
   or a small tolerance. Changes pass/fail semantics — decide before touching.
22. **Completion forgery is trivial.** Goldens are world-readable (`firestore.rules` allows read on
   `solutionWaveform`) and grading trusts a client-posted capture, so anyone can decode the golden
   and POST it back to /api/grade as their own output → instant "completed". Real fix is a design
   change: server-only goldens (Admin SDK reads, rules deny client read) + move the Solutions-tab
   display behind an API that only serves them post-completion, or accept the risk.
23. **Digital golden parse assumes newline text** (`route.js` digital branch `parseInt`s the raw
   string). If a digital golden is ever stored packed ("f32:"), it reads as malformed. Guard with
   `decodeWaveform` or assert the format at publish.
24. **Digital tabs don't verify the capture matches the active input payload.** AutoMarker grades
   whatever capture is current against the *selected* tab's golden (test1/2/3) — you can record a
   pass for Input B while the sim still holds Input A's SRAM payload.
25. **`isPublishing` never resets on successful publish** (`CreateProblem.jsx`) — relies on
   `router.push` navigating away; if navigation fails the button spins forever.
26. **No live editor sync from embedded sims.** The draft (`draft_<id>` localStorage) only updates
   when the sim posts a result (Submit). Edits made after the last run are lost on page refresh
   (back-nav is now safe — the iframe stays mounted). Optional protocol extension: a debounced
   `scopeio:code` message from the sims' editors.