/**
 * gradingUtils.js
 * Specialized scoring logic for Analog (RMSE) and Digital (Exact Match) results.
 */

export const gradingUtils = {
  
  /**
   * ANALOG GRADING: Calculates Root Mean Square Error.
   * Compares the user's voltage waveform against the solution array.
   */
  calculateRMSE: (user, expected) => {
    if (!user || !expected || user.length === 0) return Infinity;
    
    // Ensure we only compare over the overlapping length
    const n = Math.min(user.length, expected.length);
    let sumSquaredError = 0;

    for (let i = 0; i < n; i++) {
      const error = user[i] - expected[i];
      sumSquaredError += error * error;
    }

    return Math.sqrt(sumSquaredError / n);
  },

  /**
   * DIGITAL GRADING: Compares cycle-accurate decimal output vectors.
   * Works with the streamlined { cycle, decimalInput, decimalOutput } history.
   */
  gradeDigital: (userTable, goldenTable) => {
    if (!userTable || !goldenTable || goldenTable.length === 0) {
      return { matchRatio: 0, details: [], totalCycles: 0, correctCount: 0 };
    }

    const totalCycles = goldenTable.length;
    let correctCycles = 0;

    // Map through the golden table to ensure we grade against the intended sequence
    const details = goldenTable.map((goldenRow, i) => {
      const userRow = userTable[i];
      
      // If user simulation ended early, it counts as a fail for remaining cycles
      const actualVal = userRow ? userRow.decimalOutput : null;
      const expectedVal = goldenRow.decimalOutput;
      
      const isMatch = actualVal === expectedVal;
      if (isMatch) correctCycles++;

      return {
        cycle: i,
        expected: expectedVal, // Stored as decimal for Results.jsx to format
        actual: actualVal,
        passed: isMatch
      };
    });

    return {
      matchRatio: correctCycles / totalCycles,
      details: details,
      totalCycles: totalCycles,
      correctCount: correctCycles
    };
  },

  /**
   * UNIFIED VERDICT ENGINE: Converts raw metrics into Pass/Fail and Scores.
   */
  getVerdict: (metric, topics = [], isDigital = false) => {
    // Topic-specific RMSE thresholds for Analog problems
    const thresholds = {
      "Power Electronics": 0.60,
      "Combinational CCT": 0.05,
      "Sequential CCT": 0.05,
      "Digital Systems": 0.05,
      "Signal Processing": 0.15,
      "LF analog": 0.10,
      "Control Systems": 0.20,
      "RF Electronics": 0.40
    };

    let threshold = 0.2; // Default fallback
    if (Array.isArray(topics) && topics.length > 0) {
      const activeThresholds = topics
        .map(t => thresholds[t])
        .filter(val => val !== undefined);
      
      if (activeThresholds.length > 0) {
        threshold = Math.min(...activeThresholds);
      }
    }

    // Branch logic based on domain
    if (isDigital) {
      const score = (metric * 100).toFixed(2);
      const passed = metric >= 1.0; // Digital requires 100% truth-table match
      
      return {
        passed,
        score,
        message: passed ? "Accepted" : `Inaccurate (${score}% Match)`
      };
    }

    // Analog logic: Lower RMSE is better. Score = 100 - (RMSE * 100)
    const score = Math.max(0, 100 - (metric * 100)).toFixed(2);
    const passed = metric < threshold;

    return {
      passed,
      score,
      message: passed ? "Accepted" : "Inaccurate"
    };
  }
};