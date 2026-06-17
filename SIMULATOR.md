# Simulator API Integration Guide (CircuitJS1)

This document provides an overview of the Falstad Circuit Simulator (CircuitJS1), its architecture, and how it is integrated into the Ohmify project.

## 1. Background: How it was written
[CircuitJS1](https://github.com/pfalstad/circuitjs1) is an electronic circuit simulator that runs in the browser. It is a JavaScript port of Paul Falstad's original Java-based circuit simulator. 

Instead of being written in raw JavaScript from scratch, the port was created using **GWT (Google Web Toolkit)**. The core simulation engine and UI logic are written in Java, and GWT compiles this Java codebase into highly optimized JavaScript. The `/public/circuitAPI` directory contains this compiled output.

## 2. Architecture & How it works
At its core, CircuitJS1 is a time-domain circuit simulator. 
- **MNA (Modified Nodal Analysis)**: The simulator formulates the circuit as a matrix of equations based on Kirchhoff's laws and solves for the voltages at every node and currents through voltage sources.
- **Non-linear components**: Devices like diodes and transistors are modeled using iterative numerical methods (like Newton-Raphson) to find a solution for each time step.
- **Time Stepping**: It uses numerical integration methods (such as the Trapezoidal rule) to model capacitors and inductors over time.
- **JS Interface**: The `jsinterface.html` (and the `CircuitJS1` object exposed to the window) acts as a bridge. It allows external JavaScript to invoke the internal Java methods that have been exposed via JSNI (JavaScript Native Interface).

## 3. Core API Functions
The Ohmify project interacts with the simulator via the `CircuitJS1` object attached to the iframe's `contentWindow`. Key functions utilized include:

- `sim.importCircuit(circuitString, false)`: Loads a text-based circuit definition into the simulator.
- `sim.setSimRunning(boolean)`: Pauses or resumes the simulation clock.
- `sim.getTime()`: Returns the current elapsed simulation time.
- `sim.getTimeStep()`: Returns the delta time (`dt`) used for each simulation step.
- `sim.getElements()`: Returns an array of all components currently on the canvas.
- `elm.getInfo()`: Retrieves a string array describing the component (useful for identifying components like the "Voltmeter" or "Square Wave Gen").
- `elm.getType()`: Returns the internal type name (e.g., `LabeledNodeElm`).
- `elm.getLabelName()`: Returns the assigned label (e.g., "Input0", "Output1").
- `sim.getNodeVoltage(label)`: Retrieves the instantaneous voltage at a labeled node.
- `sim.ontimestep`: A callback hook that fires exactly once per simulation calculation step, allowing external scripts to record data or pause the simulation at exact moments.

## 4. How Ohmify is Using It
Ohmify embeds the simulator as a core educational and grading engine. It runs the simulator headlessly (or semi-headlessly via an iframe) to validate student circuit designs against expected behaviors.

### The Wrapper (`components/Simulator.jsx`)
An iframe points to `/circuitAPI/circuitjs.html`. A React component waits for the iframe to load and then accesses the `CircuitJS1` global object.

### Data Extraction (`lib/samplingUtils.js`)
Instead of just visually verifying a circuit, Ohmify hooks into `sim.ontimestep` to extract precise telemetry:
- **Analog Validation**: Ohmify searches the component list for a `Voltmeter` and an `input` node. As the simulation steps, it records an array of input and output voltages. After collecting a fixed number of samples (e.g., 30720), it halts the simulation and yields the data for grading.
- **Digital Validation**: For logic circuits, Ohmify finds a clock generator and parses inputs/outputs (e.g., `Input0`, `Output1`). On every rising clock edge, it reads the node voltages, converting voltages > 2.5V into binary `1`s and packing them into integer buses.

## 5. Future Usage & Enhancements
Going forward, the integration can be expanded to support:
- **Interactive Tooling**: Directly injecting faults into the circuit (e.g., changing resistor values dynamically via `elm.setResistance()`) and asking the user to debug.
- **Component Limitation**: Programmatically analyzing `sim.getElements()` before running the simulation to enforce constraints (e.g., "Build a full adder using only NAND gates").
- **Performance Profiling**: Using the captured analog samples to generate Bode plots or perform FFT (Fast Fourier Transform) analysis to grade AC frequency responses natively.
- **Headless Grading Pipeline**: Moving the simulation completely out of the UI layer for backend or CI validation, provided a Node-compatible DOM environment (like JSDOM) is used to load the GWT output.
