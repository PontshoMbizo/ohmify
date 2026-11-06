# Simulator Testbench Technical Documentation

This document provides a comprehensive technical overview of the three simulation platforms present in this project directory: **CircuitJS1**, **fpgasim**, and **mcusim**. It details their internal architectures, simulation engines, capabilities, and limitations.

---

## 1. CircuitJS1 (Analog & Digital Circuit Simulator)

CircuitJS1 is an interactive, browser-based electronic circuit simulator. Originally developed as a Java applet, it has been modernized using the Google Web Toolkit (GWT) to cross-compile the Java simulation engine into client-side JavaScript.

### Architecture & Engine
*   **Core Engine**: Uses **Modified Nodal Analysis (MNA)** to construct and solve the matrix equation `X = A⁻¹B`.
*   **Linear Solving**: `A` represents the admittance matrix of the circuit's nodes, and `B` contains independent current and voltage sources. The matrix is factored via LU decomposition.
*   **Integration Methods**: Inductors and capacitors are modeled as current sources in parallel with resistors, integrated over time using either **Backward Euler** (stable) or **Trapezoidal** (accurate) methods.
*   **Non-Linear Devices**: Diodes and transistors use Newton-Raphson iterations. The engine linearizes their exponential response curves at a given operating point and recursively solves the matrix until voltages converge.
*   **Rendering**: Operates on a continuous `updateCircuit()` loop that analyzes the circuit, builds/stamps matrices, steps the simulation time, and draws an interactive animated schema using HTML5 Canvas.

### Capabilities
*   **Extensive Component Library**: Simulates passives, op-amps, logic gates, flip-flops, 555 timers, DACs/ADCs, transformers, and transmission lines.
*   **Signal Scope**: A built-in virtual oscilloscope that measures voltage, current, resistance, power, and frequency. Supports advanced XY plotting, I-V curves, and FFT (Fast Fourier Transform) spectrum analysis.
*   **Interactivity**: Real-time manipulation of switches, potentiometers, and component values with instant visual feedback (animated current dots).
*   **Integration**: Exposes a JavaScript API (`window.CircuitJS1`) to extract scope data, plot information, and control the simulator externally.

### Limitations
*   **Performance**: Large non-linear circuits require full matrix recreation and LU factorization multiple times per frame, which can bottleneck JavaScript engines.
*   **Fidelity**: Prioritizes interactive educational visualization over SPICE-level numerical precision. Some component models are simplified.

---

## 2. fpgasim (FPGA / Verilog Simulator)

fpgasim is an in-browser hardware description language (HDL) simulator specifically tailored for the **Sipeed Tang Nano 9K FPGA** (Gowin GW1NR-9). It allows users to write Verilog and physical constraints and see the results on a virtual devboard.

### Architecture & Engine
*   **Frontend**: Next.js 16 and React. Features a Monaco editor and a dual-pane UI for hardware visualization and waveform generation.
*   **Backend Execution**: Uses a "batch and scrub" execution model. The user's Verilog, `.cst` (physical pins), and `.sdc` (timing) files are bundled and sent to a Node.js backend (`/api/simulate`).
*   **Sandboxed Engine**: The simulation runs inside an ephemeral, locked-down Docker container executing **Icarus Verilog (`iverilog`)** and the `vvp` runtime.
*   **Data Pipeline**: The `vvp` runtime outputs a standard Value Change Dump (VCD). The backend parses this VCD using a custom JavaScript parser and sends a canonical JSON timeline to the React frontend, which interpolates physical pin states (HIGH/LOW/Z) at any given time cursor.

### Capabilities
*   **Board Harness**: Automatically generates a testbench and attaches behavioral peripheral models based on the user's `.cst` pin mappings.
*   **Peripheral Emulation**:
    *   **LEDs & Buttons**: Maps logical arrays to the Tang Nano's physical active-low components.
    *   **UART**: A `uart_monitor` model decodes 8N1 serial at the baud rate and prints to a virtual console.
    *   **SPI / SD**: Simulates SPI flash (W25Q32) and SD Card init/read sequences.
    *   **HDMI**: Captures parallel video sync/rgb signals and renders a single PPM frame for preview.
*   **Security Posture**: Highly secure sandbox. `--network none`, read-only filesystem, 64MB `tmpfs`, dropped capabilities, unprivileged user, and strict memory/CPU bounds.

### Limitations
*   **Functional Only**: The simulator performs logic simulation, not Static Timing Analysis (STA). It does not verify real-world setup/hold violations.
*   **Pre-scripted Stimulus**: Buttons pulse on a fixed, auto-generated schedule. There is no live, real-time interactivity while the simulation is running.
*   **Simulation Depth**: A 27 MHz clock generates vast amounts of VCD data very quickly. Runs are typically capped at a few milliseconds (or one HDMI frame) to prevent massive payloads.

---

## 3. mcusim (MCU / Bare-Metal C Simulator)

mcusim is the microcontroller analog to fpgasim. It provides an in-browser environment for writing bare-metal C code for the **STM32F103C8T6 "Blue Pill"** (Cortex-M3) and observing the hardware peripherals.

### Architecture & Engine
*   **Frontend**: Shares the Next.js / Monaco / Waveform UI lineage with fpgasim. Uses a custom SVG representation of the Blue Pill board.
*   **Toolchain**: Firmware is cross-compiled on the backend using `arm-none-eabi-gcc` with a custom linker script (`stm32f103.ld`) and a minimal `startup.c` (handling `.bss` zeroing and the vector table).
*   **Emulation Engine**: Runs the compiled ELF inside **QEMU** (`qemu-system-arm`). It utilizes the `stm32vldiscovery` machine model.
*   **Observability (Semihosting)**: Because QEMU's mainline STM32 GPIO models are incomplete, the simulator injects a lightweight ARM Semihosting shim (`trace.h`). As the C code toggles registers (e.g., `GPIOC->ODR`), it calls `trace_pin()`, which emits text via `SYS_WRITE0`.
*   **Data Pipeline**: The QEMU stdout trace (e.g., `#0 PC13 1`) is parsed into a timeline model structurally identical to nikaV's VCD, allowing the waveform UI to be reused.

### Capabilities
*   **Bare-Metal Development**: Supports direct memory-mapped register manipulation without requiring a HAL (Hardware Abstraction Layer).
*   **Peripheral Visualization**: GPIO trace events map directly to the interactive SVG board, lighting up the on-board LED (PC13) and external pins.
*   **Sandboxing**: Inherits the exact same defense-in-depth container lockdown as fpgasim to safely execute untrusted C code.

### Limitations
*   **Intrusive Tracing**: In the mainline engine, pin observation requires explicit trace calls in the user's C code; it does not automatically snoop peripheral memory writes.
*   **Execution Model**: Like the FPGA simulator, it uses a batch "run, capture, scrub" model. Real-time debugging (GDB stepping) or live external inputs are not supported.
*   **Incomplete Peripherals**: Heavily bottlenecked by QEMU's stock support for STM32 peripherals. Workarounds (like the xPack GNU ARM Eclipse fork) are being explored to provide deeper peripheral fidelity without manual tracing.
