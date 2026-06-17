# Creator Conventions — how to build a gradeable circuit

The capture engine doesn't understand your circuit; it **discovers instrumentation
by naming/labeling convention** and samples it. If a problem ignores these rules it
will fail to capture or grade — and that's the single most common cause of a
"my problem won't grade" report. Build your template *and* your golden solution to
these rules, and tell solvers about any problem-specific labels in the description.

Source of truth: `lib/samplingUtils.js` (capture) and `components/Simulator.jsx`
(digital discovery). If you change discovery logic there, update this doc.

---

## Analog problems (`testType: "load"` or `"signal"`)

**Required: exactly one Voltmeter across the output.**
- Discovery matches the element whose info string contains the word
  `voltmeter` (case-insensitive). Use CircuitJS's Voltmeter/Labeled Voltage probe.
- It's read every timestep via `getVoltageDiff()` (V) and, at the end, `getCurrent()`
  for the current chart on load problems. Place it across the **output port** the
  problem is about.
- If no voltmeter is found, capture rejects with:
  *"No 'Voltmeter' found. Place a voltmeter across the output nodes."*
- More than one voltmeter: the **last one discovered wins** — don't place two.

**Optional but recommended: an `input` reference node.**
- A Labeled Node named exactly `input` (lowercase) marks the input signal.
- It feeds the FFT/Bode "input" used for transfer-function plots. Without it the
  input is treated as 0 and Bode/spectrum comparisons degrade.

**Load problems** additionally need the testbench load values set in Creator Studio
(Max Load Ω, Min Load Ω — both must be > 0). These become the resistances the three
captures (No-load / Max / Min) are graded at.

---

## Digital problems (`testType: "digital"`)

**Required: a clock.**
- An element whose info string contains `square wave gen` (case-insensitive) is the
  clock generator.
- A node labeled exactly `clk` is the clock signal that's sampled. Capture records a
  row on every **rising edge** (crossing the 2.5V logic threshold upward).
- Missing clock element → discovery fails:
  *"No element found with 'square wave gen' in its info."*

**Required: output bus nodes labeled `Output0`, `Output1`, …**
- Labels must match `^Output<n>$` exactly (capital O). They're sorted numerically and
  packed **LSB-first**: `Output0` is bit 0, `Output1` is bit 1, etc.
- Each node > 2.5V reads as logic 1. The packed integer per cycle is compared exactly
  against the golden decimal table.
- No `Output*` nodes → discovery fails:
  *"No nodes labeled 'Output0', 'Output1', etc. found."*

**Optional: input bus nodes `Input0`, `Input1`, …** — same `^Input<n>$` rule and
LSB-first packing; recorded for display, not graded.

**Logic threshold is 2.5V** for both clock and bus bits. Drive rails so highs are
clearly above and lows clearly below 2.5V.

**Cycle count is fixed at 330** (`numCycles` in `Simulator.jsx`). Your golden table
and the solver both capture 330 rising edges, so the clock must actually run that
many cycles within the sim window.

---

## Time step — the silent contract

The template's simulation time step **is** part of the problem. Grading compares the
solver's samples against the golden capture, and the grade API rejects a submission
whose capture sample rate drifts more than **5%** from the rate the golden solution
was captured at.

Practical consequences:
- Capture your golden solution from the **same template** you publish, at the
  template's time step. Don't change the step between capturing the template and the
  solution.
- Solvers must not change the time step. "Reset Template" restores it — the in-app
  error tells them to do exactly that.
- Legacy problems published before sample-rate storage used the form's `timeStep`
  value as the rate. If an old problem's form value didn't match its real sim step,
  solvers may now hit the mismatch error — **republish it** to fix.

---

## Pre-publish checklist

- [ ] Template and golden solution captured from the **same** circuit + time step.
- [ ] Analog: one voltmeter across the output; `input` node present if relevant.
- [ ] Load: Max/Min load values set and > 0.
- [ ] Digital: `square wave gen` + `clk` node; outputs labeled `Output0..n`
      (and `Input0..n` if used); rails clear of the 2.5V threshold.
- [ ] All required tests captured (3 for load/digital, 1 for signal) — empty
      captures are refused at capture time.
- [ ] Description tells solvers any problem-specific node labels they must add.
- [ ] Published as one atomic action (the wizard handles this) — if publish errors,
      nothing is half-written; just retry.
