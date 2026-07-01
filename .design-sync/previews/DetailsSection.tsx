import React, { useState } from 'react';
import { DetailsSection } from 'scope.io';

const baseProblem = {
  title: 'RC Low-Pass Filter',
  difficulty: 'Easy',
  topics: ['Signal Processing'],
  description: '',
};

export const Default = () => {
  const [problem, setProblem] = useState(baseProblem);
  return <DetailsSection problem={problem} updateProblem={(updates: object) => setProblem((p: typeof baseProblem) => ({ ...p, ...updates }))} />;
};

export const WithContent = () => {
  const [problem, setProblem] = useState({
    title: 'Buck Converter Design',
    difficulty: 'Medium',
    topics: ['Power Electronics'],
    description: 'Design a buck converter with 5V input, 3.3V output, and 500 mA load current.',
  });
  return <DetailsSection problem={problem} updateProblem={(u: object) => setProblem((p: typeof problem) => ({ ...p, ...u }))} />;
};
