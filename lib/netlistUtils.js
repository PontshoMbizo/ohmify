/**
 * netlistUtils.js
 *
 * Small, pure helpers for manipulating CircuitJS netlist strings before they
 * are handed to `sim.importCircuit(...)`.
 */

/**
 * Force a CircuitJS netlist to run at a specific simulation time step.
 *
 * Every CircuitJS dump begins with a `$` options line:
 *
 *   $ <flags> <timeStep> <iterCount> <simSpeed> <voltageRange> ...
 *              ^^^^^^^^^^ token index 2
 *
 * The solver's time step (and therefore the capture sample rate) comes from
 * this field. Templates exported by the Creator Studio carry whatever step the
 * author's canvas happened to be at — often CircuitJS's default 1e-3 — which is
 * NOT the per-problem step stored on the problem doc (`Problems.timeStep` /
 * `solutionWaveform.sampleRate`). Capturing at the wrong step makes a
 * sample-by-sample comparison against the golden meaningless, so the grader
 * rejects it ("time step doesn't match this problem's reference").
 *
 * This rewrites token index 2 of the `$` line to the problem's declared step so
 * the solver runs at exactly the rate the golden was graded at. Returns the
 * netlist unchanged when there's nothing safe to patch (no `$` line, malformed
 * options, or an invalid/missing step), so callers can apply it unconditionally.
 *
 * @param {string} netlist   CircuitJS dump text
 * @param {number|string} timeStep  desired step in seconds (e.g. 5e-6)
 * @returns {string} netlist with the `$`-header time step normalized
 */
export function patchTimeStep(netlist, timeStep) {
  const step = Number(timeStep);
  if (typeof netlist !== "string" || !isFinite(step) || step <= 0) {
    return netlist;
  }

  const lines = netlist.split("\n");
  // The options line is conventionally first, but tolerate leading blanks.
  const idx = lines.findIndex((line) => line.trimStart().startsWith("$"));
  if (idx === -1) return netlist;

  const tokens = lines[idx].trim().split(/\s+/);
  // Need at least: "$", flags, timeStep.
  if (tokens.length < 3) return netlist;

  tokens[2] = String(step);
  lines[idx] = tokens.join(" ");
  return lines.join("\n");
}
