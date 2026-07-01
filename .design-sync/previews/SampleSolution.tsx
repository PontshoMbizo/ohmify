import { SampleSolution } from 'scope.io';

// SampleSolution with no stored waveform data shows the "No Reference Waveforms" placeholder.
// This is the correct render for a problem where no golden has been recorded yet.
export const NoData = () => (
  <SampleSolution problem={{ title: 'RC Low-Pass Filter', testType: 'analog', solutions: {} }} />
);

// A problem that has never had a solution recorded — common during problem creation.
export const EmptyProblem = () => (
  <SampleSolution problem={{ title: 'Buck Converter', testType: 'load', solutions: {} }} />
);
