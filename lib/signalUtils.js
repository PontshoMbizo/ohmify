import { fft } from "fft-js";

/* -------------------- Helpers -------------------- */

function applyHann(signal) {
  const N = signal.length;
  // Hann window helps prevent spectral leakage
  return signal.map((x, n) =>
    x * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (N - 1)))
  );
}

function removeDC(signal) {
  const mean = signal.reduce((sum, v) => sum + v, 0) / signal.length;
  return signal.map(v => v - mean);
}

const mag = ([re, im]) => Math.sqrt(re * re + im * im);
const phase = ([re, im]) => Math.atan2(im, re);

/* -------------------- Main -------------------- */

export const signalUtils = {
  getFrequencyData: (vin, vout, sampleRate) => {
    if (!vin || !vout || vin.length < 2 || vin.length !== vout.length) {
      return { freq: [], inputSpectrum: [], outputSpectrum: [], bodeMag: [], bodePhase: [] };
    }

    // 1. Force Power of Two for fft-js
    const N = 1 << Math.floor(Math.log2(vin.length));
    let x = vin.slice(0, N);
    let y = vout.slice(0, N);

    // 2. Preprocessing
    // Removing DC is vital so the 0Hz bin doesn't drown out low frequencies
    // x = applyHann(removeDC(x));
    // y = applyHann(removeDC(y));

    x=applyHann(x);
    y=applyHann(y);

    // 3. FFT (Returns complex pairs [[re, im], ...])
    const X = fft(x);
    const Y = fft(y);

    const freq = [];
    const inputSpectrum = [];
    const outputSpectrum = [];
    const bodeMag = [];
    const bodePhase = [];

    // Noise floor threshold
    const EPS = 1e-10;

    // 4. Analyze One-Sided Spectrum (up to Nyquist)
    for (let k = 1; k < N / 2; k++) {
      const f = (k * sampleRate) / N;

      const Xk = X[k];
      const Yk = Y[k];

      const Xmag = mag(Xk);
      const Ymag = mag(Yk);

      // We only compute the Bode plot for frequencies present in the input
      if (Xmag < EPS) continue;

      /* Transfer Function H(f) = Y(f) / X(f) */
      // Magnitude in dB: 20 * log10(|Y| / |X|)
      const Hmag_db = 20 * Math.log10(Ymag / Xmag);

      // Phase difference: arg(Y) - arg(X)
      let Hphase_rad = phase(Yk) - phase(Xk);

      // Wrap phase to keep it between -PI and PI
      while (Hphase_rad > Math.PI) Hphase_rad -= 2 * Math.PI;
      while (Hphase_rad < -Math.PI) Hphase_rad += 2 * Math.PI;

      freq.push(f);
      inputSpectrum.push((2 * Xmag) / N); // Scaled for physical units
      outputSpectrum.push((2 * Ymag) / N);
      bodeMag.push(Hmag_db);
      bodePhase.push((Hphase_rad * 180) / Math.PI);
    }

    return { freq, inputSpectrum, outputSpectrum, bodeMag, bodePhase };
  },
};