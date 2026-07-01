import { ProblemWindow } from 'scope.io';

const problem = {
  id: 'preview-problem',
  title: 'RC Low-Pass Filter',
  difficulty: 'Easy',
  topics: ['Signal Processing'],
  testType: 'signal',
  simulatorType: 'circuitjs',
  description: `## Objective\n\nDesign a low-pass RC filter with cutoff at **1 kHz**.\n\nMeasure the output voltage across the capacitor and submit your waveform.`,
  editorial: `The cutoff frequency is \\(f_c = \\frac{1}{2\\pi RC}\\). With C = 10 nF, choose R ≈ 15.9 kΩ.`,
  solutions: {},
  testbench: {},
};

export const Default = () => <ProblemWindow problem={problem} />;

const digitalProblem = {
  ...problem,
  id: 'preview-digital',
  title: '4-Bit Ripple Counter',
  difficulty: 'Medium',
  topics: ['Digital Systems'],
  testType: 'digital',
  description: `## Objective\n\nBuild a 4-bit ripple counter using JK flip-flops.\nVerify the binary counting sequence from 0000 to 1111.`,
  testbench: { payload1: '0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15' },
};

export const DigitalProblem = () => <ProblemWindow problem={digitalProblem} />;
