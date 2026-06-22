import { describe, it, expect } from "vitest";
import { gradingUtils } from "../lib/gradingUtils.js";

// ─── calculateNormalizedRMSE ──────────────────────────────────────────────────

describe("gradingUtils.calculateNormalizedRMSE", () => {
  it("returns 0 for a perfect match", () => {
    const sig = [1, 2, 3, 4, 5];
    expect(gradingUtils.calculateNormalizedRMSE(sig, sig)).toBe(0);
  });

  it("returns Infinity for empty user array", () => {
    expect(gradingUtils.calculateNormalizedRMSE([], [1, 2, 3])).toBe(Infinity);
  });

  it("returns Infinity for null inputs", () => {
    expect(gradingUtils.calculateNormalizedRMSE(null, [1])).toBe(Infinity);
    expect(gradingUtils.calculateNormalizedRMSE([1], null)).toBe(Infinity);
  });

  it("uses the shorter array length when arrays differ in size", () => {
    // user has extra samples — only first 3 compared
    const user = [1, 2, 3, 99, 99];
    const expected = [1, 2, 3];
    expect(gradingUtils.calculateNormalizedRMSE(user, expected)).toBe(0);
  });

  it("normalises against the expected range", () => {
    // expected range = 10 - 0 = 10, user is off by 1 at each of 4 points
    // rmse = 1, nrmse = 1/10 * 100 = 10%
    const expected = [0, 0, 10, 10];
    const user = [1, 1, 11, 11];
    expect(gradingUtils.calculateNormalizedRMSE(user, expected)).toBeCloseTo(10, 5);
  });

  it("handles a flat expected signal (range = 0) without dividing by zero", () => {
    const flat = [5, 5, 5, 5];
    const user = [6, 6, 6, 6];
    const result = gradingUtils.calculateNormalizedRMSE(user, flat);
    expect(Number.isFinite(result)).toBe(true);
  });
});

// ─── signalRange / isDeadOutput ───────────────────────────────────────────────

describe("gradingUtils.signalRange", () => {
  it("returns peak-to-peak range", () => {
    expect(gradingUtils.signalRange([1, 5, 3, -2])).toBe(7);
  });

  it("returns 0 for empty / invalid input", () => {
    expect(gradingUtils.signalRange([])).toBe(0);
    expect(gradingUtils.signalRange(null)).toBe(0);
  });

  it("ignores non-finite values", () => {
    expect(gradingUtils.signalRange([0, NaN, 4, Infinity])).toBe(4);
  });
});

describe("gradingUtils.isDeadOutput", () => {
  it("flags a flat user output against a varying golden (miswired)", () => {
    const golden = [0, 5, 10, 5, 0]; // range 10
    const user = [0, 0, 0, 0, 0];    // range 0
    expect(gradingUtils.isDeadOutput(user, golden)).toBe(true);
  });

  it("does not flag a user output that varies meaningfully", () => {
    const golden = [0, 5, 10, 5, 0];
    const user = [0, 4, 9, 5, 0];
    expect(gradingUtils.isDeadOutput(user, golden)).toBe(false);
  });

  it("never flags when the golden itself is flat (legitimate DC problem)", () => {
    const golden = [5, 5, 5, 5];
    const user = [0, 0, 0, 0];
    expect(gradingUtils.isDeadOutput(user, golden)).toBe(false);
  });

  it("handles empty arrays without flagging", () => {
    expect(gradingUtils.isDeadOutput([], [])).toBe(false);
  });
});

// ─── hybrid analog grading ────────────────────────────────────────────────────

describe("gradingUtils.extractFeatures", () => {
  it("computes RMS and peak", () => {
    const f = gradingUtils.extractFeatures([3, -4, 3, -4], 1);
    expect(f.rms).toBeCloseTo(Math.sqrt((9 + 16 + 9 + 16) / 4), 5);
    expect(f.peak).toBe(4);
  });

  it("reports a settling time for a signal that starts off its final value", () => {
    // off-value for the first three samples, then holds at 10 → last out-of-band
    // sample is index 2 → settlingTime = 2 * dt > 0
    const settled = gradingUtils.extractFeatures([0, 0, 0, 10, 10, 10, 10, 10, 10, 10], 1e-3);
    expect(settled.settlingTime).toBeCloseTo(2e-3, 9);
    // already-flat signal never leaves its band
    const flat = gradingUtils.extractFeatures([5, 5, 5, 5], 1e-3);
    expect(flat.settlingTime).toBe(0);
  });

  it("handles empty input", () => {
    expect(gradingUtils.extractFeatures([], 1)).toEqual({ rms: 0, peak: 0, settlingTime: 0 });
  });
});

describe("gradingUtils.featureError", () => {
  it("is 0 for identical features", () => {
    const f = { rms: 2, peak: 5, settlingTime: 0.01 };
    expect(gradingUtils.featureError(f, f)).toBe(0);
  });

  it("skips settling time when the golden has no transient", () => {
    const user = { rms: 2, peak: 5, settlingTime: 0.5 };
    const golden = { rms: 2, peak: 5, settlingTime: 0 };
    // only rms+peak compared (both equal) → 0, despite the settling mismatch
    expect(gradingUtils.featureError(user, golden)).toBe(0);
  });
});

describe("gradingUtils.calculateHybridError", () => {
  it("is 0 for a perfect match", () => {
    const sig = [0, 1, 2, 3, 2, 1, 0, -1];
    const r = gradingUtils.calculateHybridError({
      user: sig, golden: sig, userSpectrum: [1, 2], goldenSpectrum: [1, 2], dt: 1,
    });
    expect(r.error).toBeCloseTo(0, 6);
  });

  it("combines components with the 70/20/10 weighting", () => {
    const r = gradingUtils.calculateHybridError({
      user: [1, 1, 1, 1], golden: [0, 0, 0, 0],
      userSpectrum: [3, 1], goldenSpectrum: [1, 1], dt: 1,
    });
    const expected = 0.7 * r.timeError + 0.2 * r.freqError + 0.1 * r.featureError;
    expect(r.error).toBeCloseTo(expected, 6);
  });

  it("falls back to the time error for the freq term when no spectrum is given", () => {
    const r = gradingUtils.calculateHybridError({
      user: [1, 2, 3], golden: [1, 2, 0], userSpectrum: [], goldenSpectrum: [], dt: 1,
    });
    expect(r.freqError).toBe(r.timeError);
  });
});

describe("gradingUtils.decimationError", () => {
  it("is 0 when D <= 1", () => {
    expect(gradingUtils.decimationError([1, 2, 3, 4], 1)).toBe(0);
  });

  it("is 0 for a constant signal (nothing lost)", () => {
    expect(gradingUtils.decimationError([5, 5, 5, 5, 5, 5], 2)).toBe(0);
  });

  it("is positive for a varying signal decimated below its detail", () => {
    expect(gradingUtils.decimationError([0, 5, 0, 5, 0, 5, 0, 5], 2)).toBeGreaterThan(0);
  });
});

// ─── gradeDigital ────────────────────────────────────────────────────────────

describe("gradingUtils.gradeDigital", () => {
  it("returns zero match for empty tables", () => {
    const result = gradingUtils.gradeDigital([], []);
    expect(result.matchRatio).toBe(0);
    expect(result.totalCycles).toBe(0);
  });

  it("returns zero match when goldenTable is null", () => {
    const result = gradingUtils.gradeDigital(null, null);
    expect(result.matchRatio).toBe(0);
  });

  it("scores 1.0 when all cycles match", () => {
    const table = [
      { decimalOutput: 3 },
      { decimalOutput: 7 },
    ];
    const result = gradingUtils.gradeDigital(table, table);
    expect(result.matchRatio).toBe(1);
    expect(result.correctCount).toBe(2);
  });

  it("scores 0.5 when half of cycles match", () => {
    const golden = [{ decimalOutput: 1 }, { decimalOutput: 2 }];
    const user = [{ decimalOutput: 1 }, { decimalOutput: 99 }];
    const result = gradingUtils.gradeDigital(user, golden);
    expect(result.matchRatio).toBe(0.5);
    expect(result.correctCount).toBe(1);
  });

  it("marks cycle as failed when user row is missing (shorter user table)", () => {
    const golden = [{ decimalOutput: 1 }, { decimalOutput: 2 }];
    const user = [{ decimalOutput: 1 }]; // missing second cycle
    const result = gradingUtils.gradeDigital(user, golden);
    expect(result.details[1].passed).toBe(false);
    expect(result.details[1].actual).toBeNull();
  });

  it("details array length equals goldenTable length", () => {
    const golden = [{ decimalOutput: 0 }, { decimalOutput: 1 }, { decimalOutput: 2 }];
    const user = [{ decimalOutput: 0 }, { decimalOutput: 1 }, { decimalOutput: 2 }];
    const result = gradingUtils.gradeDigital(user, golden);
    expect(result.details).toHaveLength(3);
  });
});

// ─── getVerdict ───────────────────────────────────────────────────────────────

describe("gradingUtils.getVerdict", () => {
  describe("analog mode", () => {
    it("passes when NRMSE is below the default threshold (5%)", () => {
      const v = gradingUtils.getVerdict(3.0, [], false);
      expect(v.passed).toBe(true);
      expect(v.message).toBe("Accepted");
    });

    it("fails when NRMSE is above the default threshold", () => {
      const v = gradingUtils.getVerdict(6.0, [], false);
      expect(v.passed).toBe(false);
      expect(v.message).toBe("Inaccurate");
    });

    it("uses the topic-specific threshold when topics are provided", () => {
      // Power Electronics threshold = 30%
      const pass = gradingUtils.getVerdict(25.0, ["Power Electronics"], false);
      expect(pass.passed).toBe(true);

      const fail = gradingUtils.getVerdict(31.0, ["Power Electronics"], false);
      expect(fail.passed).toBe(false);
    });

    it("picks the strictest threshold when multiple topics are provided", () => {
      // Signal Processing = 10, Control Systems = 8 → threshold = 8
      const v = gradingUtils.getVerdict(9.0, ["Signal Processing", "Control Systems"], false);
      expect(v.passed).toBe(false);
    });

    it("score is 100 - metric (clamped at 0)", () => {
      expect(gradingUtils.getVerdict(20, [], false).score).toBe("80.00");
      expect(gradingUtils.getVerdict(110, [], false).score).toBe("0.00");
    });
  });

  describe("digital mode", () => {
    it("passes only when matchRatio is exactly 1.0", () => {
      expect(gradingUtils.getVerdict(1.0, [], true).passed).toBe(true);
      expect(gradingUtils.getVerdict(0.99, [], true).passed).toBe(false);
    });

    it("reports score as percentage of matchRatio", () => {
      const v = gradingUtils.getVerdict(0.75, [], true);
      expect(v.score).toBe("75.00");
    });

    it("includes match percentage in the message when failing", () => {
      const v = gradingUtils.getVerdict(0.5, [], true);
      expect(v.message).toContain("50.00%");
    });
  });
});

// ─── calculateFinalVerdict ───────────────────────────────────────────────────

describe("gradingUtils.calculateFinalVerdict", () => {
  const makeTest = (passed, score) => ({ verdict: { passed, score: String(score) } });

  describe("load type (3 tests required)", () => {
    it("returns Challenge Completed when all 3 tests pass", () => {
      const suite = {
        test1: makeTest(true, 95),
        test2: makeTest(true, 92),
        test3: makeTest(true, 88),
      };
      const v = gradingUtils.calculateFinalVerdict(suite, "load");
      expect(v.isAccepted).toBe(true);
      expect(v.statusMessage).toBe("Challenge Completed");
      expect(v.isFullyComplete).toBe(true);
    });

    it("fails when any test fails", () => {
      const suite = {
        test1: makeTest(true, 95),
        test2: makeTest(false, 60),
        test3: makeTest(true, 88),
      };
      const v = gradingUtils.calculateFinalVerdict(suite, "load");
      expect(v.isAccepted).toBe(false);
      expect(v.statusMessage).toBe("1 Test(s) Failed");
    });

    it("reports partial progress when tests are missing", () => {
      const suite = { test1: makeTest(true, 90), test2: null, test3: null };
      const v = gradingUtils.calculateFinalVerdict(suite, "load");
      expect(v.isFullyComplete).toBe(false);
      expect(v.statusMessage).toBe("1/3 Tests Run");
    });

    it("averages score across the required 3 slots (not just executed)", () => {
      // 2 of 3 tests run: scores 90 + 60, third slot missing
      // globalScore = (90 + 60) / 3 = 50
      const suite = { test1: makeTest(true, 90), test2: makeTest(false, 60), test3: null };
      const v = gradingUtils.calculateFinalVerdict(suite, "load");
      expect(parseFloat(v.globalScore)).toBeCloseTo(50, 1);
    });
  });

  describe("signal type (1 test required)", () => {
    it("accepts with only test1 passing", () => {
      const suite = { test1: makeTest(true, 95), test2: null, test3: null };
      const v = gradingUtils.calculateFinalVerdict(suite, "signal");
      expect(v.isAccepted).toBe(true);
      expect(v.requiredCount).toBe(1);
      expect(v.statusMessage).toBe("Challenge Completed");
    });

    it("fails when test1 does not pass", () => {
      const suite = { test1: makeTest(false, 50), test2: null, test3: null };
      const v = gradingUtils.calculateFinalVerdict(suite, "signal");
      expect(v.isAccepted).toBe(false);
      expect(v.statusMessage).toBe("Signal Inaccurate");
    });

    it("shows Capture Required when test1 is missing", () => {
      const suite = { test1: null, test2: null, test3: null };
      const v = gradingUtils.calculateFinalVerdict(suite, "signal");
      expect(v.statusMessage).toBe("Capture Required");
    });
  });
});
