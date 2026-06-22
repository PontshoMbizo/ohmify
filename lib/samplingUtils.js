/**
 * samplingUtils.js
 * Specialized utility for Triple-Test Validation.
 * Handles Analog Waveforms, DC Metrics (V, I), and Digital Logic.
 */

import {
  findVoltmeter,
  hasLabeledNode,
  checkCircuitHealth,
  setVoltmeterResistance,
} from "./circuitDiscovery.js";

// How often (in capture steps/cycles) to ask the solver whether it is still
// healthy. Cheap (reads stopMessage == null) but JSNI-marshalled, so we poll
// rather than check on every single sample.
const HEALTH_CHECK_INTERVAL = 256;

// The simulator's *nominal* time step (the template-header value), not the
// adaptive instantaneous one. CircuitJS halves `timeStep` for stiff circuits
// (`adjustTimeStep`), so `getTimeStep()` can return a transiently reduced value
// — using it as the reported sample rate makes two captures of the same problem
// disagree and trips the grader's rate guard. `getMaxTimeStep()` is stable.
const nominalTimeStep = (sim) => {
  if (typeof sim.getMaxTimeStep === "function") {
    const maxStep = Number(sim.getMaxTimeStep());
    if (isFinite(maxStep) && maxStep > 0) return maxStep;
  }
  return sim.getTimeStep();
};

export const samplingUtils = {

  /**
   * Core Analog Engine: Captures V(in) and V(out) over time.
   * Now measures metrics directly without pre-validation of resistance.
   */
  captureAnalog: (sim, { numSamples = 30720, timeoutMs = 60000 } = {}) => {
    return new Promise((resolve, reject) => {
      const buffers = { output: [], input: [] };
      const dt = nominalTimeStep(sim);

      // Safety net: if the sim is paused or converging too slowly the
      // ontimestep handler never reaches numSamples and the promise would
      // hang forever, leaving the UI stuck on "Analyzing…".
      const timer = setTimeout(() => {
        sim.ontimestep = null;
        sim.setSimRunning(false);
        reject(`Capture timed out after ${timeoutMs / 1000}s. Make sure the simulation is running, then try again.`);
      }, timeoutMs);

      // 1. Discovery (type/label-based, locale-independent — see circuitDiscovery.js)
      const voltmeter = findVoltmeter(sim);
      const hasInput = hasLabeledNode(sim, "input");

      if (!voltmeter) {
        clearTimeout(timer);
        reject("Discovery Error: No 'Voltmeter' found. Place a voltmeter across the output nodes.");
        return;
      }

      // 2. Sampling Loop
      sim.ontimestep = () => {
        try {
          // Surface solver failure (singular matrix / floating node / NaN) with
          // the real cause instead of streaming garbage into the RMSE grader.
          if (buffers.output.length % HEALTH_CHECK_INTERVAL === 0) {
            const health = checkCircuitHealth(sim);
            if (!health.valid) {
              sim.ontimestep = null;
              sim.setSimRunning(false);
              clearTimeout(timer);
              reject(`Simulation unstable: ${health.error || "circuit did not converge"}. Check for shorts or floating nodes.`);
              return;
            }
          }

          const vOut = voltmeter.getVoltageDiff();
          buffers.output.push(vOut !== undefined ? vOut : 0);

          const vIn = hasInput ? sim.getNodeVoltage("input") : 0;
          buffers.input.push(vIn !== undefined ? vIn : 0);

          if (buffers.output.length >= numSamples) {
            // Capture final static metrics (DC Operating Point)
            const finalV = voltmeter.getVoltageDiff();
            const finalI = voltmeter.getCurrent();

            sim.ontimestep = null;
            sim.setSimRunning(false);
            clearTimeout(timer);

            resolve({
              type: "analog",
              data: buffers,
              metrics: {
                voltage: finalV,
                current: finalI
              },
              timeStep: dt,
              sampleRate: 1 / dt,
              timeLabels: buffers.output.map((_, i) => (i * dt * 1000).toFixed(4))
            });
          }
        } catch (err) {
          sim.ontimestep = null;
          clearTimeout(timer);
          reject(`Analog Capture failed: ${err.message}`);
        }
      };
    });
  },

  /**
   * Load-sweep Engine (power-electronics "load" problems).
   *
   * Drives the three testbench loads (No-load / Max / Min) entirely in code:
   * for each load it sets the output voltmeter's resistance via the runtime
   * setter, resets the sim to a clean t=0 operating point, and runs a full
   * analog capture. This replaces the old flow where the solver had to edit the
   * voltmeter resistance and re-submit once per test tab.
   *
   * `loads` is a { test1, test2, test3 } map of resistances (Ω). Entries that
   * aren't a positive finite number are skipped, so a partially-configured
   * problem captures what it can rather than throwing.
   *
   * Fails closed: if the runtime can't set the load, it rejects up-front rather
   * than grading three identical captures (which would falsely pass test1's
   * solution against all three loads).
   */
  captureLoadSweep: async (sim, { loads = {}, numSamples = 30720, timeoutMs = 60000 } = {}) => {
    if (typeof sim.setElementProperty !== "function") {
      throw new Error(
        "This simulator build can't set loads in code. Update the CircuitJS runtime, or capture each load manually."
      );
    }

    const tests = {};
    for (const key of ["test1", "test2", "test3"]) {
      const ohms = Number(loads[key]);
      if (!isFinite(ohms) || ohms <= 0) continue;

      // Mutate the load first, then reset so the capture starts from a clean
      // operating point under the new load (reset() clears transient state but
      // preserves the element property we just set).
      setVoltmeterResistance(sim, ohms);
      if (typeof sim.reset === "function") sim.reset();
      sim.setSimRunning(true);

      tests[key] = await samplingUtils.captureAnalog(sim, { numSamples, timeoutMs });
    }

    return { type: "loadSweep", tests };
  },

  /**
   * Digital Engine: Captures bit-packed data on clock rising edges.
   */
  captureDigital: (sim, { inputs = [], outputs = [], numCycles = 330, timeoutMs = 60000 } = {}) => {
    return new Promise((resolve, reject) => {
      const history = [];
      let lastClk = 0;
      let cycleCount = 0;
      const dt = nominalTimeStep(sim);

      // Same safety net as captureAnalog: without clock edges the handler
      // never reaches numCycles and the promise would hang forever.
      const timer = setTimeout(() => {
        sim.ontimestep = null;
        sim.setSimRunning(false);
        reject(`Capture timed out after ${timeoutMs / 1000}s — only ${cycleCount}/${numCycles} clock cycles detected. Check that the clock is running.`);
      }, timeoutMs);

      const packBus = (labels) => {
        if (!labels || labels.length === 0) return 0;
        let val = 0;
        labels.forEach((label, index) => {
          const bit = sim.getNodeVoltage(label) > 2.5 ? 1 : 0;
          val |= (bit << index);
        });
        return val;
      };

      let stepCount = 0;

      sim.ontimestep = () => {
        try {
          // Same solver-health guard as captureAnalog: bail out with the real
          // cause rather than packing garbage bus values for 330 cycles.
          if (stepCount++ % HEALTH_CHECK_INTERVAL === 0) {
            const health = checkCircuitHealth(sim);
            if (!health.valid) {
              sim.ontimestep = null;
              sim.setSimRunning(false);
              clearTimeout(timer);
              reject(`Simulation unstable: ${health.error || "circuit did not converge"}. Check for shorts or floating nodes.`);
              return;
            }
          }

          const clkVoltage = sim.getNodeVoltage("clk");
          if (clkVoltage === undefined) throw new Error("Clock node 'clk' not found.");

          const currentClk = clkVoltage > 2.5 ? 1 : 0;
          const isTriggered = (lastClk === 0 && currentClk === 1);

          if (isTriggered) {
            history.push({
              cycle: cycleCount,
              decimalInput: packBus(inputs),
              decimalOutput: packBus(outputs)
            });
            cycleCount++;
          }

          lastClk = currentClk;

          if (cycleCount >= numCycles) {
            sim.ontimestep = null;
            sim.setSimRunning(false);
            clearTimeout(timer);
            resolve({
              type: "digital", 
              table: history, 
              totalCycles: cycleCount, 
              timeStep: dt 
            });
          }
        } catch (err) {
          sim.ontimestep = null;
          clearTimeout(timer);
          reject(`Digital Capture failed: ${err.message}`);
        }
      };
    });
  }
};