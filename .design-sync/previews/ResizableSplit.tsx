import React from 'react';
import { ResizableSplit } from 'scope.io';

const LeftPane = () => (
  <div style={{ height: '100%', padding: 24, background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
    <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Problem Description</h2>
    <p style={{ color: '#475569', lineHeight: 1.6 }}>
      Design a low-pass RC filter with a cutoff frequency of 1 kHz.
      Connect the output voltmeter labeled &ldquo;output&rdquo; and submit your solution.
    </p>
  </div>
);

const RightPane = () => (
  <div style={{ height: '100%', padding: 24, background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: '#555', fontSize: 13 }}>Simulator pane</span>
  </div>
);

export const Default = () => (
  <div style={{ height: 400, display: 'flex' }}>
    <ResizableSplit left={<LeftPane />} right={<RightPane />} initial={45} />
  </div>
);

export const NarrowLeft = () => (
  <div style={{ height: 400, display: 'flex' }}>
    <ResizableSplit left={<LeftPane />} right={<RightPane />} initial={30} />
  </div>
);
