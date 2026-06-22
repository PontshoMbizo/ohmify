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