import React, { useState } from 'react';
import { TemplateSection } from 'scope.io';

const base = {
  testType: 'load',
  simulatorType: 'circuitjs',
  templateCircuit: '',
  starterCode: '',
};

export const NotCaptured = () => {
  const [problem, setProblem] = useState(base);
  return (
    <div style={{ height: 560 }}>
      <TemplateSection problem={problem} updateProblem={(u: object) => setProblem((p: typeof base) => ({ ...p, ...u }))} />
    </div>
  );
};

export const Captured = () => {
  const [problem, setProblem] = useState({
    ...base,
    templateCircuit: '$ 1 0.0000050 ...',
  });
  return (
    <div style={{ height: 560 }}>
      <TemplateSection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />
    </div>
  );
};

export const SignalType = () => {
  const [problem, setProblem] = useState({
    ...base,
    testType: 'signal',
    templateCircuit: '$ 1 0.0000050 ...',
  });
  return (
    <div style={{ height: 560 }}>
      <TemplateSection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />
    </div>
  );
};
