import React, { useState } from 'react';
import { StrategySection } from 'scope.io';

export const Default = () => {
  const [problem, setProblem] = useState({
    testType: '',
    simulatorType: '',
  });
  return <StrategySection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />;
};

export const LoadSelected = () => {
  const [problem, setProblem] = useState({
    testType: 'load',
    simulatorType: 'circuitjs',
  });
  return <StrategySection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />;
};

export const DigitalSelected = () => {
  const [problem, setProblem] = useState({
    testType: 'digital',
    simulatorType: 'circuitjs',
  });
  return <StrategySection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />;
};
