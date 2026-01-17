export const gradingUtils = {
  
  /**
   * ANALOG GRADING: Calculates Normalized RMSE as a Percentage.
   */
  calculateNormalizedRMSE: (user, expected) => {
    if (!user || !expected || user.length === 0) return Infinity;

    const n = Math.min(user.length, expected.length);
    let sumSquaredError = 0;

    for (let i = 0; i < n; i++) {
        const error = user[i] - expected[i];
        sumSquaredError += error * error;
    }

    const rmse = Math.sqrt(sumSquaredError / n);

    const max = Math.max(...expected);
    const min = Math.min(...expected);
    const range = max - min || Math.abs(max) || 1; // Prevent division by zero

    // Return as a percentage (0-100) to match thresholds table
    const nrmsePercent = (rmse / range) * 100; 
  
    return nrmsePercent;
  },

  /**
   * DIGITAL GRADING: Compares cycle-accurate decimal output vectors.
   */
  gradeDigital: (userTable, goldenTable) => {
    if (!userTable || !goldenTable || goldenTable.length === 0) {
      return { matchRatio: 0, details: [], totalCycles: 0, correctCount: 0 };
    }

    const totalCycles = goldenTable.length;
    let correctCycles = 0;

    const details = goldenTable.map((goldenRow, i) => {
      const userRow = userTable[i];
      const actualVal = userRow ? userRow.decimalOutput : null;
      const expectedVal = goldenRow.decimalOutput;
      
      const isMatch = actualVal === expectedVal;
      if (isMatch) correctCycles++;

      return {
        cycle: i,
        expected: expectedVal,
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
    const thresholds = {
      "Power Electronics": 15.0,
      "Combinational CCT": 0.05, // Changed from 0.0 to 0.05 for floating point safety
      "Sequential CCT": 0.05,
      "Digital Systems": 0.05,
      "Signal Processing": 10.0,
      "Control Systems": 8.0,
      "RF Electronics": 12.0
    };

    let threshold = 5.0; // Default fallback (5%)
    
    if (Array.isArray(topics) && topics.length > 0) {
      const activeThresholds = topics
        .map(t => thresholds[t])
        .filter(val => val !== undefined);
      
      if (activeThresholds.length > 0) {
        threshold = Math.min(...activeThresholds);
      }
    }

    if (isDigital) {
      const score = (metric * 100).toFixed(2);
      const passed = metric >= 1.0; 
      return {
        passed,
        score,
        message: passed ? "Accepted" : `Inaccurate (${score}% Match)`
      };
    }

    // Analog logic: metric is now a percentage (0-100)
    const score = Math.max(0, 100 - metric).toFixed(2);
    const passed = metric <= threshold;

    return {
      passed,
      score,
      message: passed ? "Accepted" : "Inaccurate"
    };
  }
};