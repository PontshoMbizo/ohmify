import { Results } from 'scope.io';

// Sinusoidal waveform data for analog chart preview
const N = 60;
const solutionData = Array.from({ length: N }, (_, i) => +(3.3 * Math.sin(2 * Math.PI * i / N)).toFixed(4));
const userData = Array.from({ length: N }, (_, i) => +(3.3 * Math.sin(2 * Math.PI * i / N) * 0.95 + 0.05 * Math.random()).toFixed(4));
const timeLabels = Array.from({ length: N }, (_, i) => (i * 0.1667).toFixed(3));

const freqLabels = Array.from({ length: 30 }, (_, i) => String((i + 1) * 100));
const solutionSpectrum = Array.from({ length: 30 }, (_, i) => i === 5 ? 3.3 : 0.01);
const userSpectrum = Array.from({ length: 30 }, (_, i) => i === 5 ? 3.1 : 0.02 * Math.random());

const analogPassed: {
  verdict: { passed: boolean; score: number; message: string; nrmse: string };
  type: string;
  timeLabels: string[];
  solutionData: number[];
  userData: number[];
  freqLabels: string[];
  solutionSpectrum: number[];
  userSpectrum: number[];
  isSignalOnly: boolean;
  resistance: number;
} = {
  verdict: { passed: true, score: 94, message: 'Excellent — Signal matches golden', nrmse: '0.0312' },
  type: 'analog',
  timeLabels,
  solutionData,
  userData,
  freqLabels,
  solutionSpectrum,
  userSpectrum,
  isSignalOnly: true,
  resistance: 1e12,
};

const analogFailed = {
  ...analogPassed,
  verdict: { passed: false, score: 52, message: 'Waveform mismatch — check your filter', nrmse: '0.2801' },
  userData: Array.from({ length: N }, (_, i) => +(2.0 * Math.sin(2 * Math.PI * i / N) + 0.3).toFixed(4)),
};

const digitalData = Array.from({ length: 16 }, (_, i) => ({ cycle: i + 1, expected: i % 4, actual: i < 12 ? i % 4 : (i % 4 + 1) % 4, passed: i < 12 }));

const digitalResult = {
  verdict: { passed: false, score: 75, message: 'Partial match — 12/16 cycles correct', nrmse: '0' },
  type: 'digital',
  table: digitalData,
};

export const AnalogPass = () => <Results chartData={analogPassed} />;
export const AnalogFail = () => <Results chartData={analogFailed} />;
export const Digital = () => <Results chartData={digitalResult} />;
