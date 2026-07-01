import React, { useState } from 'react';
import { SolutionSection } from 'scope.io';

const base = {
  testType: 'signal',
  simulatorType: 'circuitjs',
  templateCircuit: '',
  starterCode: '',
  solutions: {},
  captureRates: {},
  decimations: {},
  decimationErrors: {},
  testConfig: { isSignal: true },
  sampleCount: 30720,
  timeStep: 5e-6,
};

export const SignalMode = () => {
  const [problem, setProblem] = useState(base);
  return (
    <div style={{ height: 560 }}>
      <SolutionSection problem={problem} updateProblem={(u: object) => setProblem((p: typeof base) => ({ ...p, ...u }))} />
    </div>
  );
};

export const LoadMode = () => {
  const [problem, setProblem] = useState({
    ...base,
    testType: 'load',
    solutions: { test1: 'AAAA' },
    testConfig: { rMax: 100, rMin: 10 },
  });
  return (
    <div style={{ height: 560 }}>
      <SolutionSection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />
    </div>
  );
};

export const DigitalMode = () => {
  const [problem, setProblem] = useState({
    ...base,
    testType: 'digital',
    testConfig: { payload1: '0: 0 17 33\n8: 110 120', payload2: '', payload3: '' },
    solutions: { test1: '0\n1\n2\n3', test2: '', test3: '' },
  });
  return (
    <div style={{ height: 560 }}>
      <SolutionSection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />
    </div>
  );
};
