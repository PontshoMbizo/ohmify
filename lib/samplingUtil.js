/* lib/samplingUtil.js */
export const samplingUtil = {
  /**
   * Captures multiple labeled nodes simultaneously.
   * @param {Object} sim - Falstad instance.
   * @param {string[]} nodes - Array of labels to probe, e.g., ["input", "output"].
   * @param {number} numSamples - Number of points to capture.
   */
  captureNodes: (sim, nodes = ["output"], numSamples = 3072) => {
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
              data: buffers, // e.g., { input: [...], output: [...] }
              sampleRate: 1 / dt,
              dt: dt,
              labels: buffers[nodes[0]].map((_, i) => (i * dt * 1000).toFixed(4))
            });
          }
        } catch (err) {
          sim.ontimestep = null;
          reject(`Capture failed. Verify all nodes (${nodes.join(", ")}) exist.`);
        }
      };
    });
  }
};