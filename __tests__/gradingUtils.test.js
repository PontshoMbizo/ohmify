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
