import { ProblemDescription } from 'scope.io';

const problem = {
  title: 'RC Low-Pass Filter',
  difficulty: 'Easy',
  topics: ['Signal Processing', 'Analog-Digital'],
  testType: 'signal',
  simulatorType: 'circuitjs',
  description: `## Objective

Design a first-order **RC low-pass filter** with a -3dB cutoff frequency of exactly **1 kHz**.

### Requirements

- The output is measured across the capacitor
- Cutoff frequency: \\(f_c = \\frac{1}{2\\pi RC} = 1\\text{ kHz}\\)
- Use a 10 nF capacitor

### Hint

Choose your resistor value to achieve the target frequency. Standard E24 resistors are acceptable.

| Property | Value |
|----------|-------|
| Frequency | 1 kHz |
| Capacitor | 10 nF |
| Expected R | ≈ 15.9 kΩ |
`,
};

export const Default = () => <ProblemDescription problem={problem} />;

const hardProblem = {
  ...problem,
  title: 'Active Butterworth Filter',
  difficulty: 'Hard',
  topics: ['Analog-Digital', 'Signal Processing'],
  description: `## Objective\n\nDesign a 2nd-order active Butterworth low-pass filter using an op-amp.\nTarget cutoff: **10 kHz** with -40 dB/decade roll-off.\n\nUse standard Sallen-Key topology.`,
};

export const HardProblem = () => <ProblemDescription problem={hardProblem} />;
