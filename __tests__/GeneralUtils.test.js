import { describe, it, expect } from "vitest";
import { GeneralUtils } from "../lib/GeneralUtils.js";

// ─── isDigitalProblem ────────────────────────────────────────────────────────

describe("GeneralUtils.isDigitalProblem", () => {
  it("returns true for a known digital topic", () => {
    expect(GeneralUtils.isDigitalProblem(["Digital Systems"])).toBe(true);
    expect(GeneralUtils.isDigitalProblem(["Combinational CCT"])).toBe(true);
    expect(GeneralUtils.isDigitalProblem(["Sequential CCT"])).toBe(true);
  });

  it("returns true when digital topic is mixed with analog ones", () => {
    expect(GeneralUtils.isDigitalProblem(["Power Electronics", "Digital Systems"])).toBe(true);
  });

  it("returns false for purely analog topics", () => {
    expect(GeneralUtils.isDigitalProblem(["Power Electronics", "Signal Processing"])).toBe(false);
  });

  it("returns false for an empty topics array", () => {
    expect(GeneralUtils.isDigitalProblem([])).toBe(false);
  });

  it("returns false for null", () => {
    expect(GeneralUtils.isDigitalProblem(null)).toBe(false);
  });

  it("returns false for a non-array value", () => {
    expect(GeneralUtils.isDigitalProblem("Digital Systems")).toBe(false);
  });
});

// ─── toHex ───────────────────────────────────────────────────────────────────

describe("GeneralUtils.toHex", () => {
  it("converts a decimal to uppercase hex string with 0x prefix", () => {
    expect(GeneralUtils.toHex(255)).toBe("0xFF");
    expect(GeneralUtils.toHex(16)).toBe("0x10");
    expect(GeneralUtils.toHex(1)).toBe("0x1");
  });

  it("treats 0 as 0x0", () => {
    expect(GeneralUtils.toHex(0)).toBe("0x0");
  });

  it("treats falsy values (null, undefined) as 0", () => {
    expect(GeneralUtils.toHex(null)).toBe("0x0");
    expect(GeneralUtils.toHex(undefined)).toBe("0x0");
  });
});

// ─── toDB ────────────────────────────────────────────────────────────────────

describe("GeneralUtils.toDB", () => {
  it("returns 0 dB for a magnitude of 1.0", () => {
    expect(GeneralUtils.toDB(1)).toBeCloseTo(0, 5);
  });

  it("returns 20 dB for a magnitude of 10", () => {
    expect(GeneralUtils.toDB(10)).toBeCloseTo(20, 5);
  });

  it("returns -20 dB for a magnitude of 0.1", () => {
    expect(GeneralUtils.toDB(0.1)).toBeCloseTo(-20, 4);
  });

  it("floors at -100 dB for zero input", () => {
    expect(GeneralUtils.toDB(0)).toBe(-100);
  });

  it("floors at -100 dB for negative input", () => {
    expect(GeneralUtils.toDB(-5)).toBe(-100);
  });

  it("floors at -100 dB for values yielding less than -100 dB", () => {
    // 1e-6 → 20*log10(1e-6) = -120 dB → should clamp to -100
    expect(GeneralUtils.toDB(1e-6)).toBe(-100);
  });
});

// ─── formatSpectrumData ──────────────────────────────────────────────────────

describe("GeneralUtils.formatSpectrumData", () => {
  it("returns empty array when either argument is null", () => {
    expect(GeneralUtils.formatSpectrumData(null, [1, 2])).toEqual([]);
    expect(GeneralUtils.formatSpectrumData(["1", "2"], null)).toEqual([]);
  });

  it("converts magnitude values to dB and parses labels as floats", () => {
    const labels = ["10", "100"];
    const data = [1, 10];
    const result = GeneralUtils.formatSpectrumData(labels, data);
    expect(result[0].x).toBe(10);
    expect(result[0].y).toBeCloseTo(0, 5);
    expect(result[1].x).toBe(100);
    expect(result[1].y).toBeCloseTo(20, 5);
  });

  it("filters out points where x <= 0", () => {
    const labels = ["0", "-5", "50"];
    const data = [1, 1, 1];
    const result = GeneralUtils.formatSpectrumData(labels, data);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(50);
  });
});
