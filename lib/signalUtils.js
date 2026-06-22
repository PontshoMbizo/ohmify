import { fft } from "fft-js";

/* -------------------- Helpers -------------------- */

function applyHann(signal) {
  const N = signal.length;
  return signal.map((x, n) =>
    x * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (N - 1)))
  );
}

const mag = ([re, im]) => Math.sqrt(re * re + im * im);
const phase = ([re, im]) => Math.atan2(im, re);

/* -------------------- Main -------------------- */

export const signalUtils = {
  /**
   * Aligned single-sided magnitude spectrum (no bin skipping), used by the
   * hybrid grade's frequency term. Two equal-length signals yield the same N
   * and therefore directly comparable bins — unlike getFrequencyData, which
   * drops near-zero bins and so can misalign between two calls.
   */
  getMagnitudeSpectrum: (signal) => {
    if (!signal || signal.length < 2) return [];
    const N = 1 << Math.floor(Math.log2(signal.length));
    const y = applyHann(signal.slice(0, N));
    const Y = fft(y);
    const out = [];
    for (let k = 1; k < N / 2; k++) out.push((2 * mag(Y[k])) / N);
    return out;
  },

  getFrequencyData: (vin, vout, sampleRate) => {
    if (!vin || !vout || vin.length < 2 || vin.length !== vout.length) {
      return { freq: [], inputSpectrum: [], outputSpectrum: [], spectrumPhase: [], bodeMag: [], bodePhase: [] };
    }

    const N = 1 << Math.floor(Math.log2(vout.length));
    let x = vin.slice(0, N);
    let y = vout.slice(0, N);

    x = applyHann(x);
    y = applyHann(y);

    const X = fft(x);
    const Y = fft(y);

    const freq = [];
    const inputSpectrum = [];
    const outputSpectrum = [];
    const spectrumPhase = []; // NEW: Absolute phase of output
    const bodeMag = [];
    const bodePhase = [];

    const EPS = 1e-10;

    for (let k = 1; k < N / 2; k++) {
      const f = (k * sampleRate) / N;

      const Xk = X[k];
      const Yk = Y[k];

      const Xmag = mag(Xk);
      const Ymag = mag(Yk);

      if (Ymag < EPS) continue;

      /* Spectrum Phase (Absolute phase of Vout) */
      let Yphase_rad = phase(Yk);
      
      /* Transfer Function H(f) = Y(f) / X(f) */
      const Hmag_db = 20 * Math.log10(Ymag / Xmag);
      let Hphase_rad = phase(Yk) - phase(Xk);

      // Normalize phases to [-PI, PI]
      const wrap = (rad) => {
        while (rad > Math.PI) rad -= 2 * Math.PI;
        while (rad < -Math.PI) rad += 2 * Math.PI;
        return rad;
      };

      freq.push(f);
      inputSpectrum.push((2 * Xmag) / N);
      outputSpectrum.push((2 * Ymag) / N);
      
      // Convert absolute phase to degrees
      spectrumPhase.push((wrap(Yphase_rad) * 180) / Math.PI);
      
      bodeMag.push(Hmag_db);
      bodePhase.push((wrap(Hphase_rad) * 180) / Math.PI);
    }

    return { freq, inputSpectrum, outputSpectrum, spectrumPhase, bodeMag, bodePhase };
  },
};