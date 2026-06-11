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
    // For AC signals use peak-to-peak range. For DC (max === min) fall back to
    // the peak absolute value so a -5V flat line normalises against 5, not 1.
    const range = (max - min) || Math.max(Math.abs(max), Math.abs(min)) || 1;

    const nrmsePercent = (rmse / range) * 100; 
    return nrmsePercent;
  },

  /**
   * DIGITAL GRADING
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
   * UNIFIED VERDICT ENGINE
   */
  getVerdict: (metric, topics = [], isDigital = false) => {
    const thresholds = {
      "Power Electronics": 30.0,
      "Combinational CCT": 0.05, 
      "Sequential CCT": 0.05,
      "Digital Systems": 0.05,
      "Signal Processing": 10.0,
      "Control Systems": 8.0,
      "RF Electronics": 12.0
    };

    let threshold = 5.0; 
    
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

    const score = Math.max(0, 100 - metric).toFixed(2);
    const passed = metric <= threshold;

    return {
      passed,
      score,
      message: passed ? "Accepted" : "Inaccurate"
    };
  },

  /**
   * SUITE AGGREGATOR: Updated to handle testType logic
   * @param {Object} testSuite - {test1, test2, test3}
   * @param {String} testType - 'digital', 'load', or 'signal'
   */
  calculateFinalVerdict: (testSuite, testType = "load") => {
    const isSignalType = testType === "signal";
    
    // For signal types, we only care about test1. For others, we check all 3.
    const tests = isSignalType ? [testSuite.test1] : [testSuite.test1, testSuite.test2, testSuite.test3];
    const requiredCount = isSignalType ? 1 : 3;

    const completedTests = tests.filter(t => t !== null && t !== undefined);
    const totalExecuted = completedTests.length;
    
    const passedTests = completedTests.filter(t => t.verdict?.passed);
    const passCount = passedTests.length;

    // Global Score Calculation
    let globalScore = 0;
    if (totalExecuted > 0) {
      const sumScores = completedTests.reduce((acc, t) => acc + parseFloat(t.verdict.score), 0);
      globalScore = (sumScores / requiredCount).toFixed(2);
    }

    const isFullyComplete = totalExecuted === requiredCount;
    const allPassed = passCount === requiredCount;

    let statusMessage = "Pending Tests";
    if (!isFullyComplete) {
      statusMessage = isSignalType ? "Capture Required" : `${totalExecuted}/3 Tests Run`;
    } else if (allPassed) {
      statusMessage = "Challenge Completed";
    } else {
      statusMessage = isSignalType ? "Signal Inaccurate" : `${requiredCount - passCount} Test(s) Failed`;
    }

    return {
      isAccepted: allPassed,
      progress: totalExecuted, 
      requiredCount,
      passCount: passCount,
      globalScore,
      statusMessage,
      isFullyComplete
    };
  }
};