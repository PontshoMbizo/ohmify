/**
 * samplingUtils.js
 * Specialized utility for Triple-Test Validation.
 * Handles Analog Waveforms, DC Metrics (V, I), and Digital Logic.
 */

export const samplingUtils = {

  /**
   * Core Analog Engine: Captures V(in) and V(out) over time.
   * Now measures metrics directly without pre-validation of resistance.
   */
  captureAnalog: (sim, { numSamples = 30720, timeoutMs = 60000 } = {}) => {
    return new Promise((resolve, reject) => {
      const buffers = { output: [], input: [] };
      const dt = sim.getTimeStep();
      const elms = sim.getElements();

      // Safety net: if the sim is paused or converging too slowly the
      // ontimestep handler never reaches numSamples and the promise would
      // hang forever, leaving the UI stuck on "Analyzing…".
      const timer = setTimeout(() => {
        sim.ontimestep = null;
        sim.setSimRunning(false);
        reject(`Capture timed out after ${timeoutMs / 1000}s. Make sure the simulation is running, then try again.`);
      }, timeoutMs);
      
      let voltmeter = null;
      let inputSource = null;

      // 1. Discovery: Find the required measurement components
      elms.forEach(elm => {
        const info = elm.getInfo();
        // Identify Voltmeter by its info string
        if (info && info[0] && info[0].toLowerCase().includes("voltmeter")) {
          voltmeter = elm;
        }
        // Identify Input reference node
        if (elm.getType() === "LabeledNodeElm" && elm.getLabelName() === "input") {
          inputSource = "input";
        }
      });

      if (!voltmeter) {
        clearTimeout(timer);
        reject("Discovery Error: No 'Voltmeter' found. Place a voltmeter across the output nodes.");
        return;
      }

      // 2. Sampling Loop
      sim.ontimestep = () => {
        try {
          const vOut = voltmeter.getVoltageDiff();
          buffers.output.push(vOut !== undefined ? vOut : 0);
          
          const vIn = inputSource ? sim.getNodeVoltage("input") : 0;
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
   * Digital Engine: Captures bit-packed data on clock rising edges.
   */
  captureDigital: (sim, { inputs = [], outputs = [], numCycles = 330, timeoutMs = 60000 } = {}) => {
    return new Promise((resolve, reject) => {
      const history = [];
      let lastClk = 0;
      let cycleCount = 0;
      const dt = sim.getTimeStep();

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

      sim.ontimestep = () => {
        try {
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