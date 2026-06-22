/**
 * circuitDiscovery.js
 *
 * Single home for all "find instrumentation in the running CircuitJS1 sim"
 * logic. Previously this was duplicated across `Simulator.jsx` (digital
 * params) and `samplingUtils.js` (voltmeter / input node) as ad-hoc
 * `sim.getElements().forEach(...)` scans with locale-fragile
 * `getInfo()[0].includes(...)` string matching.
 *
 * The recompiled CircuitJS1 build exposes safe/efficient accessors
 * (see docs/SIMULATOR.md §3 "Safe & Efficient Integration API"):
 *   - sim.getElementByLabel(label)   → element with that exact label, or null
 *   - sim.getElementsByType(type)    → elements of a stable class name
 *   - sim.isCircuitValid()           → false on singular matrix / floating node
 *   - sim.getSimulationErrors()      → the solver's own error string, or null
 *
 * Every helper here feature-detects those methods and falls back to the
 * legacy full-element scan when they are absent, so the module also works
 * against an un-patched runtime and under unit-test mocks.
 */

// Stable, locale-independent CircuitJS class name for a labeled node.
// getElementsByType() compares against the Java simple class name, which is
// preserved in the compiled output (unlike the localized getInfo() strings).
const LABELED_NODE_TYPE = "LabeledNodeElm";

const isFn = (sim, name) => sim && typeof sim[name] === "function";

/**
 * All labeled-node elements in the circuit, via the typed accessor when
 * available (one bulk call) instead of scanning every element on the canvas.
 */
export function getLabeledNodes(sim) {
  if (isFn(sim, "getElementsByType")) {
    return sim.getElementsByType(LABELED_NODE_TYPE) || [];
  }
  // Legacy fallback: O(n) scan over all elements.
  const elms = sim.getElements ? sim.getElements() : [];
  return elms.filter((elm) => elm.getType && elm.getType() === LABELED_NODE_TYPE);
}

/**
 * Return the element carrying an exact label (e.g. "input", "clk"), or null.
 * Uses the indexed accessor when present; otherwise scans labeled nodes.
 */
export function findElementByLabel(sim, label) {
  if (isFn(sim, "getElementByLabel")) {
    return sim.getElementByLabel(label) || null;
  }
  const node = getLabeledNodes(sim).find(
    (elm) => elm.getLabelName && elm.getLabelName() === label
  );
  return node || null;
}

/** True if a labeled node with this exact label exists in the circuit. */
export function hasLabeledNode(sim, label) {
  return findElementByLabel(sim, label) != null;
}

/**
 * Find the output voltmeter. This is behaviour-based (a probe across the
 * output), so it stays an info-string match — but it is now in exactly one
 * place. `getInfo()[0]` is localized, so we lower-case and substring-match.
 */
export function findVoltmeter(sim) {
  const elms = sim.getElements ? sim.getElements() : [];
  return (
    elms.find((elm) => {
      const info = elm.getInfo && elm.getInfo();
      return info && info[0] && info[0].toLowerCase().includes("voltmeter");
    }) || null
  );
}

// Convention label the output voltmeter must carry so its load resistance can
// be set programmatically by `setElementProperty` (see docs/CREATOR-CONVENTIONS.md).
export const VOLTMETER_LABEL = "output";

/**
 * Set the output voltmeter's load resistance via the recompiled runtime's
 * `setElementProperty(label, property, value)`, targeting the voltmeter by its
 * conventional "output" label. This is what drives the No-load / Max / Min load
 * sweep in code instead of asking the solver to edit the resistance by hand.
 *
 * Returns true if the runtime exposes the setter, false otherwise (un-patched
 * build) so callers can surface an actionable error rather than silently
 * grading three identical captures.
 */
export function setVoltmeterResistance(sim, ohms) {
  if (!isFn(sim, "setElementProperty")) return false;
  sim.setElementProperty(VOLTMETER_LABEL, "Resistance", Number(ohms));
  return true;
}

/**
 * Find the clock source. The clock is "a voltage source whose waveform is
 * square", which is a runtime *property*, not a distinct class — so this also
 * stays an info-string match ("square wave gen"), centralized here.
 */
export function findClock(sim) {
  const elms = sim.getElements ? sim.getElements() : [];
  return (
    elms.find((elm) => {
      const info = elm.getInfo && elm.getInfo();
      return info && info[0] && info[0].toLowerCase().includes("square wave gen");
    }) || null
  );
}

const numeric = (label) => parseInt(String(label).replace(/\D/g, ""), 10);
const byNumericLabel = (a, b) => numeric(a) - numeric(b);

/**
 * Discover the full digital test harness in one pass:
 *   { clkElm, inputs: ["Input0", ...], outputs: ["Output0", ...] }
 * Input/Output buses are returned LSB-first (numeric label order).
 *
 * Replaces the inline discovery block that lived in Simulator.jsx.
 */
export function discoverDigitalIO(sim) {
  const inputs = [];
  const outputs = [];

  for (const elm of getLabeledNodes(sim)) {
    const label = elm.getLabelName ? elm.getLabelName() : "";
    if (/^Input\d+$/.test(label)) inputs.push(label);
    else if (/^Output\d+$/.test(label)) outputs.push(label);
  }

  inputs.sort(byNumericLabel);
  outputs.sort(byNumericLabel);

  return { clkElm: findClock(sim), inputs, outputs };
}

/**
 * Inspect solver health without running anything new. Returns
 * { valid, error } where `error` is the simulator's own message (e.g.
 * "Singular matrix!") when the matrix is unstable.
 *
 * On an un-patched runtime (no isCircuitValid) this reports healthy, so
 * callers degrade to their previous behaviour rather than false-failing.
 */
export function checkCircuitHealth(sim) {
  if (isFn(sim, "isCircuitValid")) {
    const valid = sim.isCircuitValid();
    const error = !valid && isFn(sim, "getSimulationErrors")
      ? sim.getSimulationErrors()
      : null;
    return { valid: !!valid, error };
  }
  if (isFn(sim, "getSimulationErrors")) {
    const error = sim.getSimulationErrors();
    return { valid: !error, error: error || null };
  }
  return { valid: true, error: null };
}
