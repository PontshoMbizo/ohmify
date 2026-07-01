import { ProblemList } from 'scope.io';

const problems = [
  { id: 'p1', title: 'RC Low-Pass Filter', difficulty: 'Easy', topics: ['Signal Processing'] },
  { id: 'p2', title: 'Buck Converter', difficulty: 'Medium', topics: ['Power Electronics'] },
  { id: 'p3', title: 'Full-Wave Rectifier', difficulty: 'Easy', topics: ['Power Electronics', 'Analog-Digital'] },
  { id: 'p4', title: '4-Bit Ripple Counter', difficulty: 'Medium', topics: ['Digital Systems', 'Combinational CCT'] },
  { id: 'p5', title: 'Active Butterworth Filter', difficulty: 'Hard', topics: ['Signal Processing', 'Analog-Digital'] },
  { id: 'p6', title: 'Boost Converter', difficulty: 'Hard', topics: ['Power Electronics'] },
];

export const Default = () => (
  <ProblemList
    allProblems={problems}
    isLoading={false}
    completedIds={new Set(['p1', 'p3'])}
    onLoadMore={() => {}}
    hasMore={false}
    loadingMore={false}
  />
);

export const Loading = () => (
  <ProblemList
    allProblems={[]}
    isLoading={true}
    completedIds={new Set()}
    onLoadMore={() => {}}
    hasMore={false}
    loadingMore={false}
  />
);
