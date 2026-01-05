/**
 * samplingUtils.js
 * Specialized utility for Analog Waveforms and Digital Logic bit-packing.
 */

export const samplingUtils = {
  
  captureAnalog: (sim, nodes = ["output"], numSamples = 3072) => {
    return new Promise((resolve, reject) => {
      const buffers = {};
      nodes.forEach(node => buffers[node] = []);
      const dt = sim.getTimeStep();

      sim.ontimestep = () => {
        try {
          nodes.forEach(node => {
            const val = sim.getNodeVoltage(node);
            buffers[node].push(val !== undefined ? val : 0);
          });
          if (buffers[nodes[0]].length >= numSamples) {
            sim.ontimestep = null;
            sim.setSimRunning(false);
            resolve({
              type: "analog",
              data: buffers,
              sampleRate: 1 / dt,
              dt: dt,
              timeLabels: buffers[nodes[0]].map((_, i) => (i * dt * 1000).toFixed(4))
            });
          }
        } catch (err) {
          sim.ontimestep = null;
          reject(`Analog Capture failed: ${err.message}`);
        }
      };
    });
  },

  captureDigital: (sim, { clkElm, inputs = [], outputs = [], numCycles = 330, edge = "rising" }) => {
    return new Promise((resolve, reject) => {
      const history = [];
      let lastClk = 0;
      let cycleCount = 0;

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
          // Parse voltage from string format "V = 5 V"
          const info = clkElm.getInfo();
          const match = info[2].match(/[+-]?([0-9]*[.])?[0-9]+/);
          if (!match) throw new Error("Clock voltage parse error");
          
          const clkVoltage = parseFloat(match[0]); 
          const currentClk = clkVoltage > 2.5 ? 1 : 0;

          const isTriggered = (edge === "rising") 
            ? (lastClk === 0 && currentClk === 1) 
            : (lastClk === 1 && currentClk === 0);

          if (isTriggered) {
            const inVal = packBus(inputs);
            const outVal = packBus(outputs);

            // Streamlined history object
            history.push({
              cycle: cycleCount,
              decimalInput: inVal,
              decimalOutput: outVal
            });

            cycleCount++;
          }

          lastClk = currentClk;

          if (cycleCount >= numCycles) {
            sim.ontimestep = null;
            sim.setSimRunning(false);
            resolve({ type: "digital", table: history, totalCycles: cycleCount });
          }
        } catch (err) {
          sim.ontimestep = null;
          reject(`Digital Capture failed: ${err.message}`);
        }
      };
    });
  }
};