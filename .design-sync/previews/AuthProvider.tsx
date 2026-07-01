import React from 'react';
import { AuthProvider } from 'scope.io';

// AuthProvider is the root auth context — render it wrapping a UI sample.
// In preview mode, Firebase is stubbed so user is always null (logged-out state).
const ChildUI = () => (
  <div style={{ padding: 24, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
    <p style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>AuthProvider active</p>
    <p style={{ fontSize: 13, color: '#15803d' }}>
      Provides auth context to the component tree. In preview: user = null (logged-out).
    </p>
  </div>
);

export const Default = () => (
  <AuthProvider>
    <ChildUI />
  </AuthProvider>
);
