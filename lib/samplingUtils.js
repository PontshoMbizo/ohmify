/**
 * samplingUtils.js
 * Specialized utility for Analog Waveforms and Digital Logic bit-packing.
 */

export const samplingUtils = {

  captureAnalog: (sim, numSamples = 3072) => {
    return new Promise((resolve, reject) => {
      const buffers = { output: [], input: [] };
      const dt = sim.getTimeStep();
      // Discovery: Find the Voltmeter and the Input Source
      const elms = sim.getElements();
      let voltmeter = null;
      let inputSource = null;

      elms.forEach(elm => {
        const info = elm.getInfo();

        // Find the voltmeter for the differential output
        if (info && info[0] && info[0].toLowerCase().includes("voltmeter")) {
          voltmeter = elm;
        }
        
        // Find the input (usually a Voltage Source or Labeled Node)
        if (elm.getType() === "LabeledNodeElm" && elm.getLabelName() === "input") {
          inputSource = "input";
        }
      });

      if (!voltmeter) {
        reject("Analog Discovery Failed: No 'Voltmeter' found in the circuit.");
        return;
      }

      sim.ontimestep = () => {
        try {
          // 1. Capture Differential Output from Voltmeter
          const vOut = voltmeter.getVoltageDiff();
          buffers.output.push(vOut !== undefined ? vOut : 0);
          // 2. Capture Input (Reference for Bode Plots)
          const vIn = inputSource ? sim.getNodeVoltage("input") : 0;
          buffers.input.push(vIn !== undefined ? vIn : 0);

          if (buffers.output.length >= numSamples) {
            sim.ontimestep = null;
            sim.setSimRunning(false);
            resolve({
              type: "analog",
              data: buffers,
              timeStep: dt,
              timeLabels: buffers.output.map((_, i) => (i * dt * 1000).toFixed(4))
            });
          }
        } catch (err) {
          sim.ontimestep = null;
          reject(`Analog Capture failed: ${err.message}`);
        }
      };
    });
  },

  captureDigital: (sim, { inputs = [], outputs = [], numCycles = 330 }) => {
    return new Promise((resolve, reject) => {
      const history = [];
      let lastClk = 0;
      let cycleCount = 0;
      const dt = sim.getTimeStep();
      // Helper to pack multiple labeled bits into a single decimal integer
      const packBus = (labels) => {
        if (!labels || labels.length === 0) return 0;
        let val = 0;
        labels.forEach((label, index) => {
          // Digital threshold at 2.5V
          const bit = sim.getNodeVoltage(label) > 2.5 ? 1 : 0;
          val |= (bit << index);
        });
        return val;
      };

      sim.ontimestep = () => {
        try {
          // DIRECT ACCESS via label name "clk"
          const clkVoltage = sim.getNodeVoltage("clk");
          
          if (clkVoltage === undefined) {
            throw new Error("Clock node 'clk' not found in circuit.");
          }

          const currentClk = clkVoltage > 2.5 ? 1 : 0;

          // Detect Rising Edge (last was 0, current is 1)
          const isTriggered = (lastClk === 0 && currentClk === 1);

          if (isTriggered) {
            const inVal = packBus(inputs);
            const outVal = packBus(outputs);
            console.log(`Cycle ${cycleCount}: Input=${inVal}, Output=${outVal}`); //adds a small delay
            
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
            resolve({ 
              type: "digital", 
              table: history, 
              totalCycles: cycleCount,
              timeStep: dt
            });
          }
        } catch (err) {
          sim.ontimestep = null;
          reject(`Digital Capture failed: ${err.message}`);
        }
      };
    });
  }
};