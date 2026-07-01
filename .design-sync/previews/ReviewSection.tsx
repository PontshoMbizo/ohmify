import React from 'react';
import { ReviewSection } from 'scope.io';

const baseProblem = {
  testType: 'load',
  simulatorType: 'circuitjs',
  title: 'Buck Converter Design',
  difficulty: 'Medium',
  topics: ['Power Electronics', 'Analog-Digital'],
  description: 'Design a synchronous buck converter with 12V input and 3.3V output at 1A.',
  templateCircuit: '$ 1 0.0000050 ...',
  starterCode: '',
  solutions: { test1: 'AAAA', test2: 'BBBB', test3: 'CCCC' },
  testConfig: { rMax: 100, rMin: 10 },
  captureRates: {},
  decimations: {},
  decimationErrors: {},
  sampleCount: 30720,
  timeStep: 5e-6,
};

export const AllPass = () => (
  <ReviewSection
    problem={baseProblem}
    statusMessage={null}
    goToStep={() => {}}
  />
);

const incompleteProblem = {
  ...baseProblem,
  topics: [],
  description: '',
  templateCircuit: '',
  solutions: {},
  testConfig: { rMax: 0, rMin: 0 },
};

export const WithErrors = () => (
  <ReviewSection
    problem={incompleteProblem}
    statusMessage={{ type: 'error', text: 'Missing required fields — fix the items marked in red before publishing.' }}
    goToStep={() => {}}
  />
);

export const Published = () => (
  <ReviewSection
    problem={baseProblem}
    statusMessage={{ type: 'success', text: 'Problem published to the challenge library!' }}
    goToStep={() => {}}
  />
);
