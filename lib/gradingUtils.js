export const gradingUtils = {

  /**
   * Peak-to-peak range of a signal. Returns 0 for empty/invalid input.
   */
  signalRange: (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    let min = Infinity;
    let max = -Infinity;
    for (const v of arr) {
      if (typeof v !== "number" || !isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!isFinite(min) || !isFinite(max)) return 0;
    return max - min;
  },

  /**
   * Detects an obviously-miswired capture: the expected (golden) waveform
   * varies meaningfully but the user's output is essentially flat — a floating
   * output, a probe on the wrong node, or an open circuit. Lets the grader
   * return an actionable message instead of an opaque NRMSE miss.
   *
   * Returns false when the golden itself is flat (legitimate DC problems), so a
   * correct flat answer is never rejected by this check.
   */
  isDeadOutput: (user, expected) => {
    const SOLUTION_FLOOR = 1e-3; // golden must move at least this much (V) to judge
    const expectedRange = gradingUtils.signalRange(expected);
    if (expectedRange <= SOLUTION_FLOOR) return false; // flat/DC golden — not judged
    const userRange = gradingUtils.signalRange(user);
    const deadThreshold = Math.max(1e-6, 0.01 * expectedRange);
    return userRange < deadThreshold;
  },

  // Relative weights of the hybrid analog grade (must sum to 1).
  HYBRID_WEIGHTS: { time: 0.7, freq: 0.2, feature: 0.1 },

  /**
   * Time-domain features used by the hybrid grade:
   *  - rms:  root-mean-square amplitude
   *  - peak: max |x|
   *  - settlingTime: time (s) the signal last sat outside a ±2% band around its
   *    final value (mean of the last 5% of samples); 0 if it never leaves it.
   * `dt` is the per-sample step (seconds).
   */
  extractFeatures: (signal, dt = 1) => {
    if (!Array.isArray(signal) || signal.length === 0) {
      return { rms: 0, peak: 0, settlingTime: 0 };
    }
    const n = signal.length;
    let sumSq = 0;
    let peak = 0;
    for (const v of signal) {
      sumSq += v * v;
      const a = Math.abs(v);
      if (a > peak) peak = a;
    }
    const rms = Math.sqrt(sumSq / n);

    const tailStart = Math.max(0, Math.floor(n * 0.95));
    let finalSum = 0;
    let finalCount = 0;
    for (let i = tailStart; i < n; i++) { finalSum += signal[i]; finalCount++; }
    const finalVal = finalCount ? finalSum / finalCount : 0;
    const band = Math.max(0.02 * Math.abs(finalVal), 1e-9);
    let settleIdx = 0;
    for (let i = 0; i < n; i++) {
      if (Math.abs(signal[i] - finalVal) > band) settleIdx = i;
    }
    return { rms, peak, settlingTime: settleIdx * dt };
  },

  /**
   * Percentage error between two feature sets, averaged over the available
   * features. Each feature is a clamped relative error (capped at 100%).
   * Settling time only counts when the golden actually has a transient.
   */
  featureError: (user, golden) => {
    const rel = (u, g) => Math.min(100, (Math.abs(u - g) / (Math.abs(g) || 1)) * 100);
    const errs = [rel(user.rms, golden.rms), rel(user.peak, golden.peak)];
    if (golden.settlingTime > 0) errs.push(rel(user.settlingTime, golden.settlingTime));
    return errs.reduce((a, b) => a + b, 0) / errs.length;
  },

  /**
   * HYBRID ANALOG ERROR — a single percentage error (same units as NRMSE, so it
   * feeds getVerdict with the existing topic thresholds) blending:
   *   70% time-domain NRMSE (on the decimated waveform),
   *   20% frequency-domain NRMSE (aligned magnitude spectra),
   *   10% key-feature error (RMS / peak / settling time).
   * Spectra are passed in (computed by signalUtils in the route) to keep this
   * pure. Falls back to the time error for the freq term if no spectrum exists
   * (e.g. a capture too short to FFT).
   */
  calculateHybridError: ({ user, golden, userSpectrum = [], goldenSpectrum = [], dt = 1 }) => {
    const timeError = gradingUtils.calculateNormalizedRMSE(user, golden);
    const freqError = (userSpectrum.length && goldenSpectrum.length)
      ? gradingUtils.calculateNormalizedRMSE(userSpectrum, goldenSpectrum)
      : timeError;
    const featureError = gradingUtils.featureError(
      gradingUtils.extractFeatures(user, dt),
      gradingUtils.extractFeatures(golden, dt)
    );
    const w = gradingUtils.HYBRID_WEIGHTS;
    const error = w.time * timeError + w.freq * freqError + w.feature * featureError;
    return { error, timeError, freqError, featureError };
  },

  /**
   * The NRMSE introduced purely by decimating a golden by stride D — measured
   * between the full signal and the decimated signal sample-held back to full
   * length. Quantifies how much the stored (decimated) reference deviates from
   * the true waveform; used as grading headroom so a solver isn't penalised for
   * error the decimation itself injects. 0 when D <= 1.
   */
  decimationError: (full, D) => {
    if (!Array.isArray(full) || D <= 1 || full.length === 0) return 0;
    const recon = full.map((_, i) => full[Math.min(Math.floor(i / D) * D, full.length - 1)]);
    return gradingUtils.calculateNormalizedRMSE(recon, full);
  },

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

    // Loop instead of Math.max(...expected): spreading a full-resolution
    // capture (publish-time decimationError path) exceeds the engine's
    // argument limit and throws RangeError.
    let max = -Infinity;
    let min = Infinity;
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] > max) max = expected[i];
      if (expected[i] < min) min = expected[i];
    }
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
   * SEQUENCE GRADING (FPGA/MCU): exact match of an ordered value-change list
   * (`[{t, v}, ...]`, the configured signal/pin extracted client-side from a
   * VCD or pin trace) against a golden captured at problem-creation time.
   * Same return shape as gradeDigital so getVerdict(..., isDigital=true) and
   * the existing Results UI need no changes. Values are compared as
   * lowercased strings so numeric (trace `0`/`1`) and hex-string (VCD bus)
   * encodings both compare correctly.
   */
  gradeSequence: (userChanges, goldenChanges) => {
    if (!Array.isArray(userChanges) || !Array.isArray(goldenChanges) || goldenChanges.length === 0) {
      return { matchRatio: 0, details: [], total: 0, correctCount: 0 };
    }

    const total = goldenChanges.length;
    let correctCount = 0;

    const details = goldenChanges.map((goldenEntry, i) => {
      const userEntry = userChanges[i];
      const actualVal = userEntry ? userEntry.v : null;
      const expectedVal = goldenEntry.v;

      const isMatch = userEntry != null && String(actualVal).toLowerCase() === String(expectedVal).toLowerCase();
      if (isMatch) correctCount++;

      return { index: i, expected: expectedVal, actual: actualVal, passed: isMatch };
    });

    return { matchRatio: correctCount / total, details, total, correctCount };
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