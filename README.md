# Simulator Component (CircuitJS Integration)

This React component embeds the **CircuitJS (Falstad) simulator** in an iframe and provides programmatic access to the simulation for **automated signal capture and analysis**.

## Overview

The component:
- Loads a CircuitJS instance inside an iframe
- Imports a circuit netlist programmatically
- Controls simulation execution (run / pause)
- Samples circuit output deterministically using simulation time steps
- Exports captured waveform data as CSV for offline analysis

It is designed for **repeatable, tool-driven circuit evaluation**, rather than interactive probing.

## Key Features

- **Programmatic Circuit Loading**  
  Automatically imports a supplied CircuitJS netlist on iframe load.

- **Deterministic Sampling**  
  Pauses the simulator, advances it by a single timestep, samples the output, then resumes—ensuring time-aligned data capture.

- **Waveform Capture**  
  Records `(time, value)` pairs directly from CircuitJS internal state.

- **CSV Export**  
  Captured data is exported as a standards-compliant CSV file for plotting or comparison.

- **Unit Normalization**  
  Voltage samples exceeding the known supply voltage are interpreted as millivolts and normalized to volts.

## Typical Use Cases

- Comparing simulated outputs against expected waveforms
- Automated testing of analogue or mixed-signal circuits
- Educational tooling for electronics and signal processing
- Generating reproducible datasets from CircuitJS

## Assumptions

- The measured signal is a **voltage**
- The circuit supply voltage is known
- Values exceeding the supply voltage are assumed to be reported in millivolts

These assumptions are explicitly documented in the exported data.

## Limitations

- Depends on CircuitJS internal APIs (`CircuitJS1`)
- Output identification relies on CircuitJS element metadata
- Intended for offline analysis, not real-time visualization

## Summary

This component bridges **interactive circuit simulation** and **automated engineering analysis**, enabling deterministic, scriptable waveform extraction from CircuitJS within a modern React application.

# Adding Problems



# Grader Component

