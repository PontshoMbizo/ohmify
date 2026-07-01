import React, { useState } from 'react';
import { AutoMarker } from 'scope.io';

export const AwaitingCapture = () => {
  const [testSuite, setTestSuite] = useState({});
  const [activeTestTab, setActiveTestTab] = useState('test1');
  return (
    <AutoMarker
      onBack={() => {}}
      capturedData={null}
      topics={['Power Electronics']}
      testType="load"
      testbench={{}}
      simulatorType="circuitjs"
      activeTestTab={activeTestTab}
      setActiveTestTab={setActiveTestTab}
      testSuite={testSuite}
      setTestSuite={setTestSuite}
      problemId="preview-123"
      onCompleted={() => {}}
    />
  );
};

export const SignalAnalysis = () => {
  const [testSuite, setTestSuite] = useState({});
  const [activeTestTab, setActiveTestTab] = useState('test1');
  return (
    <AutoMarker
      onBack={() => {}}
      capturedData={null}
      topics={['Signal Processing']}
      testType="signal"
      testbench={{}}
      simulatorType="circuitjs"
      activeTestTab={activeTestTab}
      setActiveTestTab={setActiveTestTab}
      testSuite={testSuite}
      setTestSuite={setTestSuite}
      problemId="preview-456"
      onCompleted={() => {}}
    />
  );
};

export const DigitalVerification = () => {
  const [testSuite, setTestSuite] = useState({});
  const [activeTestTab, setActiveTestTab] = useState('test1');
  return (
    <AutoMarker
      onBack={() => {}}
      capturedData={null}
      topics={['Digital Systems']}
      testType="digital"
      testbench={{}}
      simulatorType="circuitjs"
      activeTestTab={activeTestTab}
      setActiveTestTab={setActiveTestTab}
      testSuite={testSuite}
      setTestSuite={setTestSuite}
      problemId="preview-789"
      onCompleted={() => {}}
    />
  );
};
