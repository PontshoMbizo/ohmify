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
      "Power Electronics": 30.0,
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
  },

  /**
   * SUITE AGGREGATOR: Calculates the final status based on the 3-test suite.
   * @param {Object} testSuite - The state object from AutoMarker {test1, test2, test3}
   * @returns {Object} - The global pass/fail status and completion data.
   */
  calculateFinalVerdict: (testSuite) => {
    const tests = [testSuite.test1, testSuite.test2, testSuite.test3];
    
    // 1. Check how many tests have actually been executed
    const completedTests = tests.filter(t => t !== null);
    const totalExecuted = completedTests.length;
    
    // 2. Check how many of those executed tests passed
    const passedTests = completedTests.filter(t => t.verdict.passed);
    const passCount = passedTests.length;

    // 3. Calculate Global Score (Average of the 3 test scores)
    let globalScore = 0;
    if (totalExecuted > 0) {
      const sumScores = completedTests.reduce((acc, t) => acc + parseFloat(t.verdict.score), 0);
      globalScore = (sumScores / 3).toFixed(2); // Divide by 3 because we expect 3 tests
    }

    // 4. Final Requirement: Must have run 3 tests AND all 3 must pass
    const isFullyComplete = totalExecuted === 3;
    const allPassed = passCount === 3;

    let statusMessage = "Pending Tests";
    if (!isFullyComplete) {
      statusMessage = `${totalExecuted}/3 Tests Run`;
    } else if (allPassed) {
      statusMessage = "All Tests Passed";
    } else {
      statusMessage = `${3 - passCount} Test(s) Failed`;
    }

    return {
      isAccepted: allPassed,
      progress: totalExecuted, // 0, 1, 2, or 3
      passCount: passCount,
      globalScore,
      statusMessage,
      isFullyComplete
    };
  }
};