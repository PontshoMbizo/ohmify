import { describe, it, expect } from "vitest";
import { signalUtils } from "../lib/signalUtils.js";

// Helper: generate a pure sine wave at a given frequency
function makeSine(freq, sampleRate, N) {
  return Array.from({ length: N }, (_, i) => Math.sin(2 * Math.PI * freq * (i / sampleRate)));
}

// ─── Input validation ─────────────────────────────────────────────────────────

describe("signalUtils.getFrequencyData — input validation", () => {
  const empty = { freq: [], inputSpectrum: [], outputSpectrum: [], spectrumPhase: [], bodeMag: [], bodePhase: [] };

  it("returns empty structure for null inputs", () => {
    expect(signalUtils.getFrequencyData(null, null, 1000)).toEqual(empty);
  });

  it("returns empty structure when vin is shorter than 2 samples", () => {
    expect(signalUtils.getFrequencyData([1], [1], 1000)).toEqual(empty);
  });

  it("returns empty structure when vin and vout lengths differ", () => {
    expect(signalUtils.getFrequencyData([1, 2, 3], [1, 2], 1000)).toEqual(empty);
  });
});

// ─── Output shape ─────────────────────────────────────────────────────────────

describe("signalUtils.getFrequencyData — output shape", () => {
  it("all output arrays have the same length", () => {
    const N = 256;
    const sampleRate = 1000;
    const vin = makeSine(50, sampleRate, N);
    const vout = makeSine(50, sampleRate, N);
    const result = signalUtils.getFrequencyData(vin, vout, sampleRate);

    const len = result.freq.length;
    expect(len).toBeGreaterThan(0);
    expect(result.inputSpectrum).toHaveLength(len);
    expect(result.outputSpectrum).toHaveLength(len);
    expect(result.spectrumPhase).toHaveLength(len);
    expect(result.bodeMag).toHaveLength(len);
    expect(result.bodePhase).toHaveLength(len);
  });

  it("all freq values are positive", () => {
    const N = 256;
    const sampleRate = 1000;
    const sig = makeSine(100, sampleRate, N);
    const { freq } = signalUtils.getFrequencyData(sig, sig, sampleRate);
    expect(freq.every(f => f > 0)).toBe(true);
  });

  it("truncates input to the largest power-of-2 ≤ signal length", () => {
    // 300 samples → FFT uses 256
    const N = 300;
    const sampleRate = 1000;
    const sig = makeSine(50, sampleRate, N);
    const result = signalUtils.getFrequencyData(sig, sig, sampleRate);
    // 256 points → N/2 - 1 = 127 bins max (some filtered out by EPS check)
    expect(result.freq.length).toBeLessThanOrEqual(127);
  });
});

// ─── Spectral accuracy ────────────────────────────────────────────────────────

describe("signalUtils.getFrequencyData — spectral content", () => {
  it("output spectrum peak frequency matches the generated sine frequency", () => {
    const sampleRate = 4096;
    const N = 4096;
    const targetFreq = 200;  // Hz
    const sig = makeSine(targetFreq, sampleRate, N);
    const { freq, outputSpectrum } = signalUtils.getFrequencyData(sig, sig, sampleRate);

    const peakIdx = outputSpectrum.indexOf(Math.max(...outputSpectrum));
    const peakFreq = freq[peakIdx];

    // Allow ±1 bin of tolerance
    const binWidth = sampleRate / N;
    expect(Math.abs(peakFreq - targetFreq)).toBeLessThanOrEqual(binWidth);
  });

  it("unity gain filter (vin == vout) produces bode magnitude near 0 dB at the peak", () => {
    const sampleRate = 4096;
    const N = 4096;
    const sig = makeSine(100, sampleRate, N);
    const { freq, bodeMag, outputSpectrum } = signalUtils.getFrequencyData(sig, sig, sampleRate);

    const peakIdx = outputSpectrum.indexOf(Math.max(...outputSpectrum));
    expect(bodeMag[peakIdx]).toBeCloseTo(0, 0); // within ±1 dB
  });

  it("unity gain filter has near-zero bode phase at peak", () => {
    const sampleRate = 4096;
    const N = 4096;
    const sig = makeSine(100, sampleRate, N);
    const { outputSpectrum, bodePhase } = signalUtils.getFrequencyData(sig, sig, sampleRate);

    const peakIdx = outputSpectrum.indexOf(Math.max(...outputSpectrum));
    expect(Math.abs(bodePhase[peakIdx])).toBeCloseTo(0, 0); // within ±1 degree
  });
});
