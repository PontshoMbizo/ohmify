import { DigitalDataBlock } from 'scope.io';

const digitalProblem = {
  testType: 'digital',
  testbench: {
    payload1: '0101 1001 1110 0011',
    payload2: '0110 1010 0001 1111',
    payload3: '1100 0111 1010 1001',
  },
};

export const Default = () => <DigitalDataBlock problem={digitalProblem} />;

const singlePayload = {
  testType: 'digital',
  testbench: { payload1: 'FF A3 12 B7 09 C1 34 5E' },
};

export const SingleCase = () => <DigitalDataBlock problem={singlePayload} />;
