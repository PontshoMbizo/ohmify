import { Simulator } from 'scope.io';

export const Default = () => (
  <div style={{ height: 600, background: '#070707' }}>
    <Simulator circuit="" onSubmit={() => {}} />
  </div>
);

export const Running = () => (
  <div style={{ height: 600, background: '#070707' }}>
    <Simulator circuit="" onSubmit={() => {}} mode="sample" sampleCount={30720} timeStep={5e-6} />
  </div>
);
