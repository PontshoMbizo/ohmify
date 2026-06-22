import { describe, it, expect } from "vitest";
import {
  encodeWaveform,
  decodeWaveform,
  isPacked,
  decimate,
  computeDecimation,
} from "../lib/waveformCodec.js";

describe("waveformCodec round-trip", () => {
  it("encodes then decodes within Float32 precision", () => {
    const original = [0, 1.5, -2.25, 1000.5, -0.0009765625, 12345.678];
    const decoded = decodeWaveform(encodeWaveform(original));
    expect(decoded).toHaveLength(original.length);
    for (let i = 0; i < original.length; i++) {
      // relative tolerance — Float32 has ~7 significant digits
      expect(decoded[i]).toBeCloseTo(original[i], 2);
    }
  });

  it("produces a packed string detectable by isPacked", () => {
    const enc = encodeWaveform([1, 2, 3]);
    expect(enc.startsWith("f32:")).toBe(true);
    expect(isPacked(enc)).toBe(true);
    expect(isPacked("1\n2\n3")).toBe(false);
  });

  it("handles an empty array", () => {
    expect(decodeWaveform(encodeWaveform([]))).toEqual([]);
  });
});

describe("waveformCodec legacy / edge decoding", () => {
  it("decodes the legacy newline-text format", () => {
    expect(decodeWaveform("1\n2.5\n-3")).toEqual([1, 2.5, -3]);
  });

  it("ignores blank / non-numeric lines in legacy text", () => {
    expect(decodeWaveform("1\n\n2\nNaN\n3")).toEqual([1, 2, 3]);
  });

  it("returns [] for empty / nullish input", () => {
    expect(decodeWaveform("")).toEqual([]);
    expect(decodeWaveform(undefined)).toEqual([]);
    expect(decodeWaveform(null)).toEqual([]);
  });
});

describe("waveformCodec.decimate", () => {
  it("keeps every Dth sample", () => {
    expect(decimate([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 2)).toEqual([0, 2, 4, 6, 8]);
    expect(decimate([0, 1, 2, 3, 4, 5], 3)).toEqual([0, 3]);
  });

  it("is a no-op for D <= 1", () => {
    const arr = [1, 2, 3];
    expect(decimate(arr, 1)).toBe(arr);
    expect(decimate(arr, 0)).toBe(arr);
  });
});

describe("waveformCodec.computeDecimation", () => {
  it("decimates long load captures toward the target ceiling", () => {
    expect(computeDecimation(30720, "load")).toBe(4); // ceil(30720/8192)
  });

  it("never decimates signal problems (spectral fidelity)", () => {
    expect(computeDecimation(30720, "signal")).toBe(1);
  });

  it("does not decimate captures at or under the ceiling", () => {
    expect(computeDecimation(5000, "load")).toBe(1);
    expect(computeDecimation(8192, "load")).toBe(1);
  });
});
