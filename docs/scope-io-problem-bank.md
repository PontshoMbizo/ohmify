# Scope.io Problem Bank — Full Saturated List

**Platform:** Electronics engineering interview prep with three simulators:
- **CircuitJS** — in-browser analog/digital/mixed-signal schematic simulator
- **STM32 (Blue Pill) / QEMU** — bare-metal C firmware compiled with `arm-none-eabi-gcc`, run in sandboxed QEMU ARM emulator
- **FPGA / HDL Simulator** — in-browser Verilog/VHDL synthesis and simulation

Each entry lists the **original source concept** (with domain tag) and the **reworded application-specific problem** formatted for the platform.

---

## Legend

| Tag | Simulator |
|-----|-----------|
| `[CJS]` | CircuitJS |
| `[MCU]` | STM32 / QEMU |
| `[FPGA]` | FPGA / HDL |
| `[CJS+MCU]` | Cross-simulator (analog front-end + firmware) |
| `[CJS+FPGA]` | Cross-simulator (analog circuit + FPGA control) |

---

## I. POWER ELECTRONICS & POWER MANAGEMENT

---

**P-01** `[CJS]`
**Source:** Buck converter duty-cycle and output voltage calculation (power electronics interview staple)
**Problem — EV On-Board Charger Pre-Regulator:**
The on-board charger of a battery electric vehicle uses a synchronous buck stage to step the 400 V DC bus down to a 48 V auxiliary rail for HVAC and lighting. The input is 390–410 V, the target output is 48 V ± 2 %, and the inductor is 100 µH at 50 kHz switching. During a sudden load step from 5 A to 20 A the output sags briefly and a current-limit fault trips. Implement the buck converter in CircuitJS, reproduce the fault condition, and modify the compensation network and/or inductor value so the output recovers within three switching cycles without tripping the 25 A current limit.

---

**P-02** `[CJS]`
**Source:** Boost converter topology, duty cycle vs. output voltage (power electronics fundamentals)
**Problem — MPPT Solar Boost Stage:**
A rooftop photovoltaic panel outputs 18–36 V depending on irradiance and temperature. The inverter DC bus requires a stable 400 V input. A boost converter is used as the MPPT front-end. Your task: design the boost stage in CircuitJS for a nominal 28 V input, 400 V output at 500 W. Verify that the duty cycle is within the safe range (D < 0.9) at minimum panel voltage. Then identify the peak switch voltage stress and suggest an appropriate MOSFET V_DS rating with margin.

---

**P-03** `[CJS]`
**Source:** Flyback converter transformer design, isolation, snubber requirements
**Problem — Industrial 24 V Isolated PSU:**
A programmable logic controller requires a galvanically isolated 24 V / 2 A supply from a 230 V AC mains input. The design uses a flyback converter. In CircuitJS, implement the primary switch, flyback transformer (model with a coupled inductor), and an RCD snubber to clamp the switch voltage spike when the transformer demagnetises. Measure the peak drain voltage at the MOSFET with and without the snubber. Size the snubber resistor and capacitor so the clamp voltage stays below 650 V for a 600 V rated switch.

---

**P-04** `[CJS]`
**Source:** LDO regulator dropout voltage, PSRR, pass transistor headroom (analog/power interview questions)
**Problem — Precision Sensor Rail in an Automotive ECU:**
An automotive ECU contains a sensitive pressure sensor whose 5 V analogue rail must have less than 100 µV of ripple at 10 kHz (engine ignition switching). The upstream DC-DC provides 5.5 V with 200 mV_pp ripple at 200 kHz. An LDO is placed between them. Model the LDO in CircuitJS using an op-amp, PMOS pass transistor, and resistor divider. Determine the minimum PSRR the LDO needs to meet the ripple budget, and verify your design meets the requirement in simulation.

---

**P-05** `[CJS]`
**Source:** H-bridge / full-bridge inverter, dead-time, shoot-through prevention (motor-drive interview classic)
**Problem — Brushed DC Motor Reversal in an RC Submarine:**
An underwater ROV uses a 12 V brushed DC motor to drive its horizontal thruster. The motor must reverse direction within 20 ms for manoeuvring. An H-bridge is used. Without dead-time between turning off the high-side and turning on the low-side transistor on the same leg, shoot-through destroys the FETs. In CircuitJS, build the H-bridge with adjustable dead-time, demonstrate shoot-through when dead-time = 0, and find the minimum dead-time that prevents it while keeping the motor current continuous during reversal.

---

**P-06** `[CJS]`
**Source:** Battery State-of-Charge coulomb counting, cell balancing, over-voltage protection (BMS design)
**Problem — Drone Flight Pack BMS Fault Isolation:**
A 4S LiPo pack powers a racing drone. During aggressive manoeuvres the pack discharges unevenly: cells 2 and 3 reach 3.0 V while cells 1 and 4 are still at 3.5 V. Without cell-level monitoring the pack hits an under-voltage cutoff and the drone falls. In CircuitJS, model the 4-cell pack with a resistor-divider cell-voltage monitor and comparators. Design the protection circuit so that when any single cell drops below 3.1 V the FET disconnects the load within 1 ms, while allowing normal operation at pack level above 12.4 V.

---

**P-07** `[CJS]`
**Source:** Power factor correction, PFC boost stage, input current THD (power electronics interview)
**Problem — USB-C 65 W Laptop Charger with PFC:**
Cheap laptop chargers draw pulsed current from the mains, creating harmonic pollution that causes neutral-conductor overheating in office buildings. A 65 W charger must meet IEC 61000-3-2 Class D limits, requiring PF > 0.9 and THD < 30 %. Design a continuous-conduction-mode PFC boost stage in CircuitJS. Compare the input current waveform and power factor with and without PFC, and verify the output capacitor sizing holds the 400 V DC bus within ± 5 V during a 20 ms mains half-cycle dropout.

---

**P-08** `[MCU]`
**Source:** Battery voltage monitoring via ADC, SOC estimation using OCV (BMS firmware questions)
**Problem — Li-ion Fuel Gauge for a Wireless Sensor Node:**
A wireless sensor node for an industrial IoT deployment runs from a single 18650 Li-ion cell. Battery percentage must be reported via UART every 10 s. The STM32 ADC reads cell voltage through a resistor divider. Implement bare-metal firmware that: (1) reads the ADC with DMA, (2) averages 16 samples to reduce noise, (3) maps the voltage to SoC using a piece-wise linear OCV–SoC table for LiCoO₂, and (4) sends a JSON string over UART. The QEMU testbench injects a simulated voltage decay curve; your firmware must track SoC to within ± 3 % across the discharge range.

---

**P-09** `[MCU]`
**Source:** PWM generation, duty cycle control, dead-band insertion for motor drives (embedded interview)
**Problem — Soft-Start Ramp for a Fan Controller:**
A server rack fan controller uses the STM32's TIM1 advanced timer to drive a 24 V brushless fan via a gate driver. If the fan is commanded to full speed immediately on power-up, the inrush current trips the 2 A fuse. Implement bare-metal firmware that: (1) uses TIM1 in centre-aligned PWM mode at 20 kHz, (2) generates complementary outputs with 500 ns dead-time, and (3) ramps the duty cycle from 10 % to 90 % over 2 seconds. The QEMU testbench verifies the dead-time and ramp profile via GPIO toggle measurements.

---

**P-10** `[MCU]`
**Source:** SMPS digital control loop, PID implementation on MCU (power electronics + embedded)
**Problem — Digital Voltage Regulator for a CNC Spindle Drive:**
A CNC machine spindle motor requires a regulated 36 V supply. The STM32 implements a digital voltage-mode control loop: it samples the output voltage via ADC, computes the PID correction, and updates the PWM duty cycle via timer compare register, all within one switching period (100 µs). Implement the ISR-driven control loop in C. The QEMU simulation injects a load-step disturbance; your controller must recover the output voltage to within ±1 V within 5 switching cycles.

---

## II. ANALOG CIRCUIT DESIGN

---

**A-01** `[CJS]`
**Source:** Op-amp inverting/non-inverting amplifier, gain-bandwidth product, slew rate (analog fundamentals)
**Problem — Hydrophone Pre-Amplifier for an Underwater Acoustic Sensor:**
A hydrophone in an oceanographic buoy produces a 1 mV peak signal in the 100 Hz–10 kHz band. It must be amplified to 1 V before the ADC. A two-stage op-amp circuit is required. The first stage provides gain of 20 dB; the second provides gain of 20 dB. Stray capacitance on the PCB limits bandwidth. In CircuitJS, verify the frequency response is flat ±1 dB from 100 Hz to 10 kHz and that the output does not clip for a 2 mV input. Identify which stage limits the bandwidth and justify your op-amp gain-bandwidth product selection.

---

**A-02** `[CJS]`
**Source:** Instrumentation amplifier design, CMRR, bridge sensor interface (analog interview classic)
**Problem — Strain Gauge Bridge in a Smart Scale:**
A postal scale uses a Wheatstone bridge of four 350 Ω strain gauges. At full load the bridge outputs a differential voltage of 5 mV on a 5 V common-mode. Mains-induced 50 Hz interference appears as a 100 mV common-mode noise on the signal leads. A standard op-amp amplifier saturates due to the high common-mode voltage. In CircuitJS, implement an instrumentation amplifier (3 op-amps) with CMRR > 80 dB to amplify the 5 mV differential to 2.5 V while rejecting the 50 Hz noise. Measure the output noise floor and verify the 50 Hz tone is attenuated below 1 mV.

---

**A-03** `[CJS]`
**Source:** Sallen-Key active low-pass filter design, Q factor, pole placement (filter design interview)
**Problem — Anti-Aliasing Filter for an Audio DAQ System:**
A vibration analysis tool samples audio-band data at 48 kHz using a 16-bit ADC. Without an anti-aliasing filter, signals above 24 kHz fold into the measurement band. Design a 4th-order Butterworth low-pass filter at 20 kHz using two cascaded Sallen-Key stages in CircuitJS. Verify the attenuation is > 60 dB at 48 kHz and the passband ripple is < 0.5 dB. Also verify that Q is correctly set to 0.541 and 1.306 for the two stages to maintain Butterworth response.

---

**A-04** `[CJS]`
**Source:** Comparator with hysteresis (Schmitt trigger), noise immunity, switching threshold (analog questions)
**Problem — Zero-Crossing Detector for a TRIAC Dimmer:**
A light dimmer controls mains AC power to a lamp. The firing angle of the TRIAC must be referenced to the zero-crossing of the mains sine wave. A comparator detects the zero crossing, but mains noise causes multiple spurious trigger edges near the crossing point, causing the lamp to flicker visibly. In CircuitJS, implement a comparator with hysteresis (Schmitt trigger configuration) sized so the threshold band is ±8 V (preventing false triggers from ±5 V noise) while still detecting the actual zero crossing within ±2° of the 50 Hz cycle.

---

**A-05** `[CJS]`
**Source:** Transimpedance amplifier (TIA) design, photodiode, bandwidth vs. noise trade-off (optical sensing)
**Problem — Photodiode Receiver for a LiDAR Time-of-Flight Module:**
An automotive LiDAR module uses a reverse-biased PIN photodiode to receive reflected 905 nm laser pulses. Pulse widths are as short as 5 ns (200 MHz bandwidth required). The photodiode has 10 pF junction capacitance. An op-amp TIA converts current to voltage. In CircuitJS, size the transimpedance resistor (R_F) so the output is 200 mV for a 200 µA photodiode pulse, and compute the feedback capacitor C_F needed to prevent peaking and keep bandwidth at 200 MHz. Show the step response in simulation.

---

**A-06** `[CJS]`
**Source:** PLL (Phase-Locked Loop) design, VCO, loop filter, lock time (RF and clocking interview)
**Problem — Frequency Synthesiser for a 433 MHz Remote Control:**
A low-cost remote keyless entry fob must transmit at exactly 433.92 MHz. An on-chip RC oscillator has ±10 % accuracy — far too imprecise. A PLL is used to lock a VCO to a crystal reference. In CircuitJS, simulate the PLL charge-pump, loop filter (second-order passive), and a simple VCO model. Verify the PLL locks within 1 ms of power-up, that the output frequency is within 10 kHz of target, and that the loop filter sufficiently attenuates reference spurs.

---

**A-07** `[CJS]`
**Source:** Differential amplifier, current sense, high-side vs. low-side measurement (hardware interview)
**Problem — High-Side Current Sensing in an E-Bike Battery Pack:**
An e-bike BMS must measure pack current (up to 40 A) on the positive rail (high-side) without breaking the ground reference. A shunt resistor (1 mΩ) is in the high-side path, and the common-mode voltage is 48 V. A standard op-amp with ±15 V supply cannot handle 48 V common mode. In CircuitJS, implement a difference amplifier with appropriate resistor ratios and supply rails to measure the shunt voltage (40 mV full scale) with at least 60 dB CMRR, and convert it to a 0–3.3 V output for the MCU ADC.

---

**A-08** `[CJS]`
**Source:** Crystal oscillator design, load capacitance, motional impedance (RF and clock design)
**Problem — Crystal Clock Source for a GPS Receiver:**
A GPS receiver module requires an accurate 16 MHz clock. The on-chip RC oscillator drifts 2 % with temperature, causing position fix errors. An external 16 MHz crystal with 20 pF load capacitance specification is used. In CircuitJS, model the crystal as a series RLC with parallel capacitance, and design the Pierce oscillator circuit around it. Verify that the oscillator starts reliably and that the load capacitance seen by the crystal matches the 20 pF spec, then explain the consequence of using the wrong load capacitors.

---

**A-09** `[CJS]`
**Source:** Sample-and-hold circuit design, aperture time, droop rate (ADC front-end design)
**Problem — Sample-and-Hold for a High-Voltage Power Analyser:**
A power analyser samples 230 V AC (scaled to ±3 V) at 1 MHz to compute harmonics up to the 50th. If the sample-and-hold does not acquire the voltage fast enough, the effective number of bits (ENOB) degrades. In CircuitJS, design the S&H using a JFET switch and hold capacitor. Calculate and verify the acquisition time for 12-bit accuracy at 1 MHz sampling rate, and measure the droop rate during the hold phase for a 100 ms hold time. Identify what limits ENOB.

---

**A-10** `[CJS]`
**Source:** Lowpass filter pole-zero placement, group delay, phase distortion (DSP/analog interview)
**Problem — Anti-Phase-Distortion Filter for a Digital Audio DAC:**
A 24-bit DAC in a high-fidelity audio system outputs a reconstructed audio waveform at 192 kHz. The reconstruction filter must pass 0–20 kHz with flat group delay (linear phase). A standard Butterworth filter introduces significant group-delay variation near cut-off, causing audible pre-ringing on transients. In CircuitJS, implement a Bessel filter and compare its group delay vs. that of an equivalent-order Butterworth across 0–20 kHz. Verify the Bessel variant has < 10 µs group-delay variation across the audio band.

---

## III. DIGITAL LOGIC & FPGA DESIGN

---

**D-01** `[FPGA]`
**Source:** FSM design (traffic light controller, sequence detector — classic digital design question)
**Problem — PCIe Link Training FSM:**
PCIe devices go through a defined link training state machine (LTSSM) before data can flow: Detect → Polling → Configuration → L0 (active). If the receiver detects no signal for more than 24 ms in Polling.Active, it must return to Detect. Implement a simplified 5-state LTSSM in Verilog: Detect, Polling, Configuration, L0, and Recovery. The testbench drives RX-detect pulses and timeout events. Your FSM must correctly navigate all legal state transitions and flag an error if an illegal transition is attempted.

---

**D-02** `[FPGA]`
**Source:** Synchronous FIFO design, read/write pointer management, full/empty flags (VLSI interview staple)
**Problem — DMA Burst Buffer Between CPU and Ethernet MAC:**
An Ethernet MAC receives 1 Gbps bursts of 64-byte frames. The DMA engine posts data at 200 MHz in 32-bit words, while the Ethernet SERDES reads at 125 MHz in 8-bit symbols. A FIFO decouples the two rates. Implement a synchronous FIFO in Verilog that is 256 entries × 32 bits wide. It must assert `full` when 252/256 entries are occupied (leaving a 4-entry safety margin) and `empty` when the read pointer matches the write pointer. The testbench runs simultaneous random reads and writes and checks for data corruption.

---

**D-03** `[FPGA]`
**Source:** Asynchronous FIFO with Gray-code pointers, clock domain crossing (CDC) — top ASIC/FPGA interview topic
**Problem — Sensor Data FIFO Crossing from 72 MHz ADC Clock to 100 MHz DSP Clock:**
A radar system digitises IF samples at 72 MHz and feeds them to a DSP core running at 100 MHz. A binary-pointer FIFO between these domains would produce metastable full/empty flags, causing dropped samples and false detections. Implement an asynchronous FIFO in Verilog using Gray-coded read and write pointers. Each pointer must be synchronised through a 2-FF synchroniser before being used in the opposite domain. The testbench injects random 100-sample bursts and verifies no data is lost or corrupted across 10 million cycles.

---

**D-04** `[FPGA]`
**Source:** Priority encoder, MSB-first encoding (combinational logic design question)
**Problem — Hardware Interrupt Arbiter for a Multi-Core SoC:**
A 4-core processor SoC has 8 interrupt sources. When multiple interrupts are asserted simultaneously, the interrupt controller must select the highest-priority one (lowest index wins) and present its 3-bit encoded source index to the CPU within one clock cycle. Implement an 8-to-3 priority encoder in Verilog that resolves simultaneous assertions combinatorially, drives a `valid` output when any interrupt is pending, and asserts `ack` for one cycle after the CPU clears the interrupt. The testbench checks all 255 non-zero input combinations.

---

**D-05** `[FPGA]`
**Source:** UART receiver/transmitter design, baud rate generation, start/stop bit detection (digital comms design)
**Problem — UART Bootloader Interface for a Safety Relay Module:**
A safety relay for an industrial press must be field-reprogrammable via RS-485 (UART-framed) at 115200 baud from a 100 MHz FPGA clock. Design a UART RX module in Verilog that: (1) detects the start bit edge, (2) samples each bit in the middle of its period, (3) assembles the 8-bit word with 1 stop bit, and (4) flags a framing error if the stop bit is not high. The testbench injects 100 random bytes including one deliberately corrupted frame to verify error detection.

---

**D-06** `[FPGA]`
**Source:** SPI master controller design, CPOL/CPHA modes, CS timing (digital interface design)
**Problem — SPI Master for a High-Speed 16-bit ADC in an EEG Headset:**
An EEG headset samples 32 channels at 1 kHz each via a 16-bit SAR ADC with SPI interface (CPOL=0, CPHA=1, 10 MHz SCLK). The conversion triggers on CS falling edge; data is valid 400 ns after the last SCLK rising edge. A late CS de-assertion corrupts the next conversion. Implement an SPI master in Verilog that drives CS, SCLK, and captures MISO for a 16-bit word. The testbench verifies that CS is held for at least 5 ns after the 16th SCLK falling edge before de-asserting, and that captured data matches the injected ADC response.

---

**D-07** `[FPGA]`
**Source:** I2C controller master, clock stretching, multi-master arbitration (interface design interview)
**Problem — I2C Master for a Multi-Sensor Environmental Logger:**
An environmental logger reads temperature (TMP117), humidity (SHT40), and pressure (BMP388) sensors over a shared I2C bus at 400 kHz. The BMP388 uses clock stretching (holds SCL low for up to 3 ms during a pressure conversion). An I2C master that ignores clock stretching will corrupt the data bus. Implement a byte-level I2C master in Verilog that correctly detects SCL held low by a slave and pauses its internal bit timer. The testbench models a slave that stretches for 1500 cycles and verifies the master recovers the correct 24-bit pressure word.

---

**D-08** `[FPGA]`
**Source:** CRC computation, shift-register-based CRC16/32 implementation (data integrity design)
**Problem — CRC-32 Engine for a Streaming Flash Memory Controller:**
A NAND flash controller writes 4 KB pages with an appended CRC-32 checksum to detect write errors. The interface provides bytes sequentially at 250 MHz; the CRC must be computed in real time (one byte per clock). Implement a parallel CRC-32 (IEEE 802.3 polynomial 0x04C11DB7) module in Verilog that processes one byte per clock cycle. The testbench feeds a known 256-byte message and verifies the output matches a reference CRC computed offline. Also verify that a single bit-flip in the message changes the CRC.

---

**D-09** `[FPGA]`
**Source:** AXI4-Stream interface design, TVALID/TREADY handshake, backpressure (SoC interconnect)
**Problem — AXI4-Stream Rate Adapter Between a Video Sensor and an FPGA DSP Pipeline:**
A 1080p60 camera sensor produces pixels at 165 MHz over a 16-bit parallel bus. The FPGA DSP pipeline runs at 200 MHz but can only accept data on 70 % of cycles (TREADY deasserts when the pipeline stalls). An AXI4-Stream skid buffer must absorb bursts without dropping pixels. Implement a 2-entry AXI4-Stream skid buffer in Verilog. The testbench randomly deasserts TREADY for up to 4 consecutive cycles and verifies no TDATA values are dropped across 10,000 transfers.

---

**D-10** `[FPGA]`
**Source:** Pipeline register insertion, critical path analysis, retiming (FPGA/ASIC timing closure)
**Problem — 32-bit Multiply-Accumulate Pipeline for a FIR Filter in a Software-Defined Radio:**
A 16-tap FIR filter for an SDR must produce one output sample per clock at 250 MHz. A naive single-cycle multiply-accumulate takes 6 ns — too long for a 4 ns period. Add pipeline stages to the MAC chain in Verilog so the critical path is under 4 ns. The testbench verifies that the filter coefficients produce the correct frequency response on a swept sine input (verifying the pipeline does not alter the arithmetic result, only adds latency).

---

**D-11** `[FPGA]`
**Source:** BRAM inference vs. distributed RAM, read latency, initialisation (FPGA architecture question)
**Problem — Look-Up Table for a QAM-64 Symbol Mapper in a Cable Modem:**
A cable modem maps 6-bit symbols to I/Q constellation points at 50 Msymbols/s. A 64-entry LUT stores the I and Q values (8 bits each). If implemented in flip-flops, it consumes 64 × 16 = 1024 LUT resources; if inferred as BRAM, it uses one 18Kb block. Implement the symbol mapper in Verilog with BRAM inference and handle the 1-cycle read latency correctly (output is valid one cycle after address). The testbench verifies all 64 symbol mappings match the QAM-64 constellation table.

---

**D-12** `[FPGA]`
**Source:** Clock gating, power-down regions, DVFS (low-power FPGA/ASIC design)
**Problem — Clock Gating for a Low-Power Sensor Hub Fabric:**
A wearable health monitor FPGA contains separate PPG, ECG, and accelerometer processing cores. When the user is stationary, only the accelerometer core is needed. Activating all three clocks wastes power. Implement an enable-based clock gate for the PPG and ECG clocks in Verilog using flip-flop-based gating (not combinational gating to avoid glitches). The testbench verifies that the gated core registers do not toggle during the gated period and that re-enabling the clock resumes correct operation without data corruption.

---

**D-13** `[FPGA]`
**Source:** Gray code counter, metastability-safe pointer (standard CDC problem)
**Problem — Gray-Coded Sector Address Counter for a Hard Disk Drive Read Head:**
A hard disk read channel tracks sector positions using a counter that increments at 100 MHz. The sector address is read asynchronously by the disk controller running at 133 MHz. A binary counter would produce glitchy multi-bit transitions visible across the clock domain. Implement a 10-bit Gray-code counter in Verilog. Verify that only one bit changes on every increment (testbench checks transitions for 1024 consecutive cycles) and that the Gray-to-binary decoder recovers the correct sector count.

---

**D-14** `[FPGA]`
**Source:** LFSR (linear-feedback shift register) for PRBS generation, BER testing (digital comms)
**Problem — PRBS-31 Pattern Generator for PCIe Gen4 Link Validation:**
A PCIe Gen4 test set must generate a PRBS-31 sequence (x³¹ + x²⁸ + 1) at 16 Gbps to stress-test receiver equalisers. The PRBS pattern must be generated in hardware to avoid the latency of software. Implement a parallel 32-bit-wide PRBS-31 generator in Verilog that unrolls 32 iterations per clock at 500 MHz (32 × 500 MHz = 16 Gbps effective). The testbench verifies that the generated sequence matches a reference software PRBS-31 for 2^31 − 1 bits before repeating.

---

**D-15** `[FPGA]`
**Source:** Barrel shifter, shifter optimisation, logarithmic shift (arithmetic/RTL design)
**Problem — Hardware Alignment Unit for a Floating-Point Adder in a Custom AI Accelerator:**
In an FP32 adder, the smaller exponent operand must have its mantissa right-shifted by the exponent difference (0–127 bits) before addition. A sequential shift of one bit per cycle takes up to 127 cycles. A barrel shifter does it in one cycle. Implement a 23-bit barrel shifter in Verilog that shifts right by an amount specified by a 7-bit control word. The testbench verifies 1000 random shift amounts for all possible values and also checks that a shift of 0 passes the data unchanged.

---

## IV. MICROCONTROLLER / EMBEDDED SYSTEMS

---

**M-01** `[MCU]`
**Source:** GPIO debouncing, hardware vs. software debounce, contact bounce timing (embedded hardware interview)
**Problem — Mechanical Keypad Interface for a Vending Machine:**
A beverage vending machine uses 12 tactile push-buttons connected directly to STM32 GPIO pins. Button bouncing causes spurious multiple-press detections: one press can register 5–20 transitions within 10 ms. Implement bare-metal firmware that: (1) uses a SysTick-driven 1 ms timer to sample each GPIO, (2) requires 10 consecutive consistent samples to confirm a press, and (3) generates one rising-edge event per valid press. The QEMU testbench injects a bounce sequence and verifies exactly one event is generated per press.

---

**M-02** `[MCU]`
**Source:** UART framing, ring buffer implementation, interrupt-driven RX (embedded C question)
**Problem — GPS NMEA Parser for a Fleet Tracker:**
A vehicle fleet tracker reads NMEA-0183 sentences from a u-blox GPS module at 9600 baud via UART. Sentences arrive at irregular intervals (1 Hz) but can be up to 82 bytes long. A blocking read loop misses CAN bus data arriving simultaneously on a second UART. Implement bare-metal firmware using UART RX interrupts that push bytes into a 256-byte ring buffer. A main-loop parser extracts complete `$GPRMC` sentences delimited by `\r\n` and parses the latitude and longitude fields. The QEMU testbench injects a stream of 20 NMEA sentences at 9600 baud and verifies the parsed co-ordinates.

---

**M-03** `[MCU]`
**Source:** ADC DMA circular buffer, overrun detection, sample rate accuracy (MCU peripheral design)
**Problem — Real-Time Vibration Monitor for a CNC Machine Spindle:**
A CNC spindle bearing failure detection system must sample a MEMS accelerometer (connected to ADC1 channel 0) at exactly 8 kHz. A polling-based ADC read in the main loop misses samples during SPI flash writes, creating gaps in the vibration spectrum. Implement bare-metal firmware using ADC in continuous DMA mode with a circular double buffer. The DMA half-transfer and transfer-complete interrupts flip the active buffer so the FFT computation (running in main) never reads a buffer being written. The QEMU testbench verifies sample count continuity and that no overrun flags are set.

---

**M-04** `[MCU]`
**Source:** Timer input capture, period measurement, frequency calculation (MCU peripherals interview)
**Problem — Tachometer for a Wind Turbine Generator:**
A small wind turbine has a Hall-effect sensor that pulses once per revolution. Blade speed ranges from 50 to 3000 RPM. At 50 RPM (0.83 Hz) a simple timer overflow occurs before the next pulse unless the prescaler is set correctly; at 3000 RPM the pulse period is only 20 ms. Implement bare-metal firmware using TIM2 input capture mode to measure the period of the Hall pulse. Compute RPM in the capture ISR and send it over UART. The QEMU testbench injects test pulse periods corresponding to 50, 500, and 3000 RPM and verifies the reported values.

---

**M-05** `[MCU]`
**Source:** I2C master driver, repeated start condition, clock stretching recovery (embedded systems question)
**Problem — EEPROM Logging System for an Aircraft Data Recorder:**
A flight data recorder writes telemetry records to an Atmel AT24C256 EEPROM over I2C at 400 kHz. Page writes (64 bytes) require a 5 ms write cycle during which the EEPROM does not respond to I2C. If the MCU immediately attempts the next page write, it receives a NACK and corrupts the log. Implement bare-metal I2C firmware that polls the EEPROM after each write using a repeated-start ACK poll, retrying every 500 µs until the device acknowledges. The QEMU testbench models the 5 ms write delay and verifies the driver does not proceed until the EEPROM acknowledges.

---

**M-06** `[MCU]`
**Source:** SPI with DMA, CS timing, full-duplex simultaneous TX/RX (MCU SPI interview)
**Problem — IMU Data Burst for a Quadrotor Flight Controller:**
A quadrotor uses an ICM-42688 IMU connected via SPI at 24 MHz. The flight controller reads 14 bytes of gyro, accelerometer, and temperature data every 1 ms (1 kHz loop). Polling SPI in the main loop burns 12 µs of the 1 ms budget. Implement bare-metal SPI+DMA firmware: assert CS, trigger a TX DMA burst (dummy bytes), and simultaneously receive 14 bytes via RX DMA. A transfer-complete interrupt clears CS and copies the buffer. The QEMU testbench verifies that the CPU is not stalled during the DMA transfer and that all 14 bytes are received correctly.

---

**M-07** `[MCU]`
**Source:** Watchdog timer (IWDG vs. WWDG), window watchdog, safe state transition (embedded safety)
**Problem — Fail-Safe Watchdog for a Medical Infusion Pump:**
An infusion pump dispenses insulin at a precise rate. If firmware hangs in an ISR due to a peripheral fault, the pump motor must stop within 500 ms to prevent overdose. Implement the WWDG (Window Watchdog) in bare-metal C so that: (1) the watchdog resets if the main loop takes longer than 200 ms, (2) it also resets if the main loop kicks it too early (before 100 ms), forcing the refresh to happen in a 100 ms window. The QEMU testbench deliberately delays the kick to trigger a reset and verifies the reset flag is set.

---

**M-08** `[MCU]`
**Source:** RTOS-like priority and ISR latency, critical section, race condition prevention (embedded C interview)
**Problem — Safe Shared Buffer Between ISR and Main Loop in a Gas Analyser:**
A gas detection instrument collects sensor readings in a UART RX ISR and processes them in the main loop. Without proper critical sections, a context switch mid-copy produces a reading where the first byte is from packet N and the last byte is from packet N+1, causing a false alarm. Implement bare-metal C using `__disable_irq()` / `__enable_irq()` guards around a double-buffer swap, and a volatile flag to signal the main loop. The QEMU testbench verifies no torn reads occur when ISR and main loop race on the shared buffer.

---

**M-09** `[MCU]`
**Source:** Low-power sleep modes, RTC wake-up, peripheral shutdown (power-optimised embedded design)
**Problem — Ultra-Low-Power Soil Moisture Sensor for Smart Agriculture:**
A wireless soil sensor node must run from a single AA battery for 5 years. It wakes from STM32 Stop mode every 15 minutes, takes an ADC reading via a resistive moisture sensor, transmits over LoRa, then sleeps again. Any peripheral left running during sleep drains the battery in days. Implement bare-metal firmware that: (1) powers up the sensor via a GPIO-controlled MOSFET switch, (2) takes 4 ADC samples, (3) transmits over UART (simulating LoRa), and (4) enters Stop mode with RTC wakeup at 15-minute interval. The QEMU testbench verifies the peripheral power sequence and sleep entry.

---

**M-10** `[MCU]`
**Source:** Encoder quadrature decoding, direction detection, count roll-over (motor control embedded)
**Problem — Position Tracking for a Surgical Robotic Arm Joint:**
A surgical robot arm uses a 4096 PPR quadrature encoder on its elbow joint. The MCU must track absolute position from power-up, detect direction, and flag an error if the encoder transitions from channel-A-only events (missing channel B indicates encoder fault). Implement bare-metal firmware using TIM3 in encoder mode (both channels) that: (1) reads the 16-bit counter register, (2) accumulates a 32-bit signed position counter handling roll-over, and (3) sets an error flag if the input pattern `00 → 11 → 00` occurs (channel skipping, indicating a faulty encoder disc). The QEMU testbench injects encoder quadrature sequences including a fault.

---

**M-11** `[MCU]`
**Source:** CAN bus message framing, ID filtering, error-handling states (automotive embedded interview)
**Problem — ECU CAN Node for Engine Knock Detection:**
An automotive engine knock sensor module communicates engine knock events to the main ECU via CAN at 1 Mbit/s. If the knock sensor reports `0x3A2` frame ID more than 5 times per 100 ms, the ECU must request ignition retard. Implement bare-metal CAN firmware on the STM32 that: (1) configures CAN1 at 1 Mbit/s with acceptance filter for IDs 0x3A0–0x3AF, (2) counts frames in a 100 ms window using TIM6, (3) transmits a `0x100` frame with payload byte `0x01` (retard request) if the threshold is exceeded, and resets the count. The QEMU testbench injects 6 knock frames within 80 ms.

---

**M-12** `[MCU]`
**Source:** DFU (Device Firmware Update) over UART/CAN, flash write, sector erase (embedded bootloader)
**Problem — OTA Firmware Update for a Smart Meter:**
A deployed electricity smart meter needs over-the-air firmware updates without physical access. The STM32 bootloader receives a new firmware image (up to 64 KB) in 128-byte blocks over UART, writes each block to the upper half of flash, verifies a CRC-32 over the image, then jumps to the new application if the CRC passes. Implement bare-metal C that: (1) erases the target flash sector, (2) writes received blocks using the FLASH HAL registers, (3) computes CRC-32 over the written region, and (4) sets the boot address and resets. The QEMU testbench injects the firmware image and verifies the CRC check and jump.

---

## V. MIXED-SIGNAL DESIGN

---

**X-01** `[CJS+MCU]`
**Source:** ADC full-scale range, signal conditioning, anti-aliasing filter (mixed-signal design interview)
**Problem — ECG Front-End for a Wearable Cardiac Monitor:**
A wearable ECG patch captures the cardiac signal using two Ag/AgCl electrodes. The differential signal is 1–5 mV with a 100 mV DC offset (electrode polarisation) and 50 Hz mains interference. The STM32 ADC has a 3.3 V unipolar input range. In CircuitJS, design the analog front end: an INA (3 op-amps) at gain 500×, a high-pass filter (0.5 Hz cut-off) to remove the DC offset, and a 50 Hz notch filter. In the MCU simulator, write firmware to read the ADC in DMA mode at 1 kHz, apply an IIR high-pass in software as a secondary filter, and send 1-second windows over UART. Verify the R-peak amplitude is > 2 V in simulation.

---

**X-02** `[CJS+MCU]`
**Source:** DAC waveform generation, DMA-driven arbitrary waveform output (mixed-signal MCU)
**Problem — Arbitrary Waveform Generator for Cable Fault Testing:**
A time-domain reflectometer (TDR) for finding breaks in underground cables sends calibrated pulse shapes into the cable and analyses reflections. The pulse shape is stored as a 256-point waveform table. Implement CircuitJS DAC RC output filter (to smooth DAC glitches) and bare-metal STM32 firmware that uses TIM6 as a DAC trigger at 1 MHz sample rate with DMA circular mode. The testbench verifies that the output frequency matches the expected waveform period and that glitch magnitude is below 5 % of full scale after the RC filter.

---

**X-03** `[CJS+MCU]`
**Source:** Temperature sensor linearisation, thermistor NTC, Steinhart-Hart equation (sensor conditioning)
**Problem — Precision Temperature Controller for a Chemical Reactor:**
A laboratory chemical reactor must hold temperature at 85.0 °C ± 0.1 °C. An NTC thermistor (10 kΩ at 25 °C, β = 3950 K) is used in a voltage divider with a 10 kΩ resistor. At 85 °C the thermistor is ~2.1 kΩ, producing a voltage that varies non-linearly. In CircuitJS, simulate the divider and verify the voltage at 80, 85, and 90 °C. In the MCU simulator, implement bare-metal C that uses the Steinhart-Hart equation to convert ADC counts to temperature in 0.01 °C units. A PID loop adjusts a PWM heater output. The testbench verifies the PID reaches set-point within 30 s.

---

**X-04** `[CJS+FPGA]`
**Source:** Sigma-delta ADC architecture, oversampling and decimation, sinc filter (data converter design)
**Problem — High-Resolution Audio ADC Interface for a Studio Mixing Desk:**
A professional audio interface uses a 4th-order sigma-delta ADC running at 64× oversampling (64 × 48 kHz = 3.072 MHz bitstream). The FPGA must decimate the 1-bit bitstream to 24-bit words at 48 kHz. Implement a 3rd-order sinc (CIC) decimation filter in Verilog with a decimation ratio of 64. The testbench feeds a 1 kHz sine bitstream and verifies the decimated output matches a reference at 24-bit resolution. Also verify that a -60 dBFS tone is distinguishable above the noise floor.

---

**X-05** `[CJS+MCU]`
**Source:** Motor back-EMF, sensorless BLDC commutation, zero-crossing detection (motor control)
**Problem — Sensorless BLDC Commutation for a Drone Propeller:**
A 2204 BLDC motor in a racing drone ESC uses back-EMF zero-crossing detection for sensorless commutation. If the ADC reads the floating phase voltage while a complementary PWM phase is switching, the switching noise masks the zero-crossing and causes missed commutation steps at high RPM. In CircuitJS, model the three-phase back-EMF waveforms and low-pass RC filter (to remove switching noise before ADC input). In the MCU simulator, implement a sampling blanking window in the ADC ISR that masks samples during the first 10 µs after a commutation step. Verify commutation synchronisation at 50,000 RPM.

---

## VI. HIGH-SPEED DIGITAL / SIGNAL INTEGRITY

---

**S-01** `[CJS]`
**Source:** Transmission line theory, impedance matching, reflection coefficient (SI interview staple)
**Problem — USB 3.0 Trace Routing on a PCB:**
A USB 3.0 SuperSpeed pair must carry 5 Gbps. The signal appears on a 50 mm PCB trace that passes through a via to another layer where the reference plane is interrupted by a power cut-out. A TDR scan shows a 20 Ω impedance bump at the via. In CircuitJS, model the trace as a transmission line: 45 Ω before the discontinuity, 65 Ω at the discontinuity, 45 Ω after. Observe the voltage reflection at the source. Calculate the reflection coefficient and verify in simulation. Propose and simulate a mitigation (back-drilling, stitching capacitor, or plane repair) that reduces the impedance bump to < 5 Ω.

---

**S-02** `[CJS]`
**Source:** Differential pair routing, common-mode rejection, LVDS signalling (high-speed SI)
**Problem — LVDS Display Interface for an Automotive Infotainment Screen:**
An automotive infotainment display uses LVDS (Low Voltage Differential Signalling) at 300 Mbps. If the two traces of a differential pair are mismatched by 5 mm (34 ps skew at a 6.7 ps/mm dielectric), the common-mode rejection at the receiver falls and radiated emissions increase. In CircuitJS, model a differential LVDS pair with and without length mismatch, and show the eye diagram degradation. Calculate the maximum allowable skew for 12-bit BER performance and propose a meander compensation.

---

**S-03** `[CJS]`
**Source:** Crosstalk between PCB traces, aggressor/victim model, near-end vs. far-end crosstalk (SI design)
**Problem — Crosstalk Interference in a High-Speed Camera Parallel Bus:**
A machine-vision camera outputs a 12-bit pixel bus at 200 MHz. On the PCB, data lines D0 and D11 are routed in parallel for 30 mm with 100 µm spacing (below the 3× width rule). D0 is the aggressor; D11 is the victim. In CircuitJS, model the parallel coupled transmission lines and measure the near-end and far-end crosstalk voltage on D11 when D0 switches from 0 to 3.3 V. Verify the crosstalk exceeds the 200 mV noise margin. Increase trace spacing to 300 µm and verify the crosstalk falls below the margin.

---

**S-04** `[CJS]`
**Source:** Power delivery network (PDN) impedance, decoupling capacitor placement, IR drop (PI interview)
**Problem — Power Rail Droop on a GPU Core Power Plane:**
A discrete GPU's 1.0 V core rail powers 400 A of instantaneous draw during a compute burst. The PDN has 0.3 mΩ from the VRM to the die, plus a 2 nH package inductance. At 1 GHz switching the impedance is 12.6 Ω — far exceeding the 2.5 mΩ target. In CircuitJS, model the PDN as a lumped RLC ladder and add bulk, mid-frequency, and HF decoupling capacitors to flatten the impedance below 2.5 mΩ from DC to 1 GHz. Simulate the transient voltage droop for a 100 A step and verify it stays within ±50 mV of 1.0 V.

---

**S-05** `[CJS]`
**Source:** EMC conducted emissions, common-mode choke, ferrite bead selection (EMC design interview)
**Problem — EMC Filter Design for a 48 V GaN Charger:**
A 100 W GaN-based USB-C charger switches at 4 MHz and fails FCC Part 15 Class B radiated emissions by 8 dB in the 30–100 MHz band. The common-mode current on the output cable is measured at 12 µA (6 dB above the limit). In CircuitJS, model the common-mode path and design a two-stage CM filter (two common-mode chokes + Y-capacitors) to achieve 20 dB attenuation at 50 MHz. Verify the filter does not resonantly amplify the signal below 1 MHz.

---

## VII. RF & WIRELESS DESIGN

---

**R-01** `[CJS]`
**Source:** RF link budget, path loss, receiver sensitivity calculation (RF engineering interview)
**Problem — LoRa Link Budget for a Flooded Basement Sensor:**
A LoRa flood sensor in a basement must reliably reach a gateway 500 m away through a concrete wall (estimated 15 dB penetration loss) and 3 dB cable loss on the gateway antenna. The LoRa module outputs 20 dBm, the gateway antenna gain is 3 dBi, and the module antenna gain is 0 dBi. Free-space path loss at 868 MHz over 500 m is 86 dB. The LoRa receiver sensitivity at SF12, BW=125 kHz is −137 dBm. In CircuitJS, model the complete link budget as a cascaded gain/loss chain and verify the received power vs. sensitivity margin. Calculate the minimum achievable fade margin and determine if the link closes.

---

**R-02** `[CJS]`
**Source:** Impedance matching with L-network/Pi-network, Smith chart (RF design interview)
**Problem — 50 Ω Matching Network for a Chip Antenna in a BLE Wearable:**
A BLE chip antenna presents an impedance of 30 − j20 Ω at 2.45 GHz. The RF trace to the SoC is 50 Ω. Without matching, the reflected power from the mismatch lowers transmit range by 3 dB. In CircuitJS, design an L-network matching circuit (inductor + shunt capacitor) to transform 30 − j20 Ω to 50 Ω at 2.45 GHz. Simulate S11 (return loss) and verify it is better than −20 dB at the centre frequency, then verify the 3 dB bandwidth of the match.

---

**R-03** `[CJS]`
**Source:** Low-noise amplifier (LNA) noise figure, Friis cascade formula (RF receiver chain)
**Problem — GPS Receiver Front-End Noise Figure Budget:**
A GPS receiver requires a noise figure of < 3 dB at the LNA input to achieve −160 dBW sensitivity. The receive path consists of: an antenna connector (0.5 dB loss) → bandpass filter (2 dB insertion loss) → LNA (NF=0.6 dB, gain=18 dB) → mixer (NF=8 dB). Compute the system noise figure using the Friis formula. The filter before the LNA degrades system NF. In CircuitJS, model the receive chain as a noise-gain cascade. Determine whether moving the LNA before the filter improves system NF enough to close the GPS sensitivity budget, and calculate the trade-off in out-of-band blocking performance.

---

**R-04** `[CJS]`
**Source:** Band-pass filter design, coupled resonators, insertion loss (RF filter design)
**Problem — IF Band-Pass Filter for a Walkie-Talkie Superheterodyne Receiver:**
A VHF walkie-talkie uses a 455 kHz IF. The channel spacing is 25 kHz and a strong adjacent-channel signal at 480 kHz must be attenuated by 60 dB. A single-pole filter cannot achieve 60 dB at 25 kHz offset. In CircuitJS, design a 3-pole coupled-resonator band-pass filter centred at 455 kHz with 15 kHz bandwidth (−3 dB). Verify 60 dB attenuation at 480 kHz and less than 3 dB insertion loss in-band. Measure the group delay and confirm it is flat within the passband.

---

**R-05** `[CJS]`
**Source:** VCO/oscillator design, phase noise, FM deviation (RF oscillator interview)
**Problem — Phase Noise Impact on a 5G NR Sub-6 GHz Transmitter:**
A 5G NR base station transmits OFDM with 30 kHz subcarrier spacing. The local oscillator at 3.7 GHz contributes phase noise. If phase noise at 100 kHz offset is worse than −90 dBc/Hz, inter-carrier interference (ICI) exceeds the 3GPP EVM limit. In CircuitJS, model a Colpitts VCO at a scaled frequency and measure its phase noise spectrum. Add a varactor for tuning and verify that the phase noise at 100 kHz offset is below the requirement after a narrowband PLL loop filter is applied.

---

**R-06** `[CJS]`
**Source:** Mixer intermodulation distortion, third-order intercept point IP3 (RF linearity)
**Problem — Intermodulation Distortion in an 802.11ac Wi-Fi Receiver:**
A Wi-Fi receiver operating in the 5 GHz band receives two strong out-of-band interferers at 5.18 GHz and 5.22 GHz. Their third-order intermodulation product falls in-band at 5.26 GHz (= 2×5.22 − 5.18). The IIP3 of the LNA must be high enough to keep the IM3 product below the noise floor. In CircuitJS, model a two-tone test on a third-order polynomial nonlinearity and measure the IIP3. Verify that the LNA meets IIP3 > −10 dBm to keep IM3 below −100 dBm for two −30 dBm interferers.

---

**R-07** `[CJS]`
**Source:** Antenna radiation pattern, gain, and EIRP (antenna design interview)
**Problem — Patch Antenna for a Drone Uplink:**
An FPV drone command uplink operates at 2.4 GHz. The drone body blocks signals from below; only the upper hemisphere needs coverage. A patch antenna on top of the drone provides 5 dBi gain in the upper hemisphere. The transmitter output is 20 dBm after 2 dB cable loss. Calculate the EIRP and verify the link margin to a 2 km ground station assuming −95 dBm receiver sensitivity and a 3 dBi ground station antenna. In CircuitJS, model the antenna as an equivalent circuit (patch resonator) and verify the resonant frequency, bandwidth, and input impedance at 2.4 GHz.

---

## VIII. ASIC / CHIP DESIGN

---

**C-01** `[FPGA]`
**Source:** Static timing analysis, setup/hold time violation, slack calculation (ASIC/FPGA STA interview)
**Problem — Timing Closure for a PCIe Gen3 Physical Layer Block:**
A PCIe Gen3 PHY operates at 8 Gbps (4 GHz after 8b/10b). The critical path through the data recovery block is 240 ps, just 10 ps of positive setup slack above a 250 ps period. A fanout-of-8 clock buffer introduces 35 ps of clock skew, flipping the setup slack to −25 ps (a violation). Describe and implement (in Verilog + constraint file) the three mitigation strategies: buffer insertion on the data path, pipeline register insertion, and XDC/SDC multi-cycle path exception. The testbench verifies the data path still produces correct output after pipelining.

---

**C-02** `[FPGA]`
**Source:** CDC metastability, synchroniser MTBF calculation, resolution time (ASIC/digital design)
**Problem — Metastability Analysis for a USB 3.0 Insert-Detection Circuit:**
A USB 3.0 port controller detects cable insertion (a signal from the CC line of the USB-C connector) which is asynchronous to the 500 MHz PHY clock. If the synchroniser does not resolve within 2 ns (one clock period), the controller enters an undefined state and corrupts in-flight transactions. For a USB hub with 4 ports (each 500 MHz), what is the mean-time-between-failures (MTBF) for a single two-FF synchroniser? Implement the synchroniser in Verilog and the testbench must demonstrate that the output is stable after 2 clock cycles regardless of the input transition time.

---

**C-03** `[FPGA]`
**Source:** Scan chain insertion, DFT, ATPG, stuck-at fault coverage (ASIC test interview)
**Problem — Scan-Testable Register Bank for an Automotive Microcontroller:**
An automotive MCU must achieve 99 % stuck-at fault coverage for ISO 26262 ASIL-B. The design contains 128 flip-flops. Without scan, only 60 % coverage is achievable through functional vectors. By inserting a scan chain through all 128 flops, ATPG can generate 300 test vectors achieving 99 % coverage. Implement a muxed-scan flip-flop in Verilog and chain 8 of them into a single scan chain. The testbench applies the scan-enable signal and shifts a test pattern through the chain, then captures the response.

---

**C-04** `[FPGA]`
**Source:** Clock tree synthesis, skew, latency, buffering (physical design / backend interview)
**Problem — Clock Skew Minimisation for a 1 GHz RISC-V Core:**
A 5-stage RISC-V pipeline runs at 1 GHz. The clock is distributed to 6000 flip-flops. Without clock-tree buffering, the H-tree from the PLL to the flops has 200 ps of skew — enough to cause hold-time violations across the pipeline stages. In Verilog/SystemVerilog, implement a 3-level H-tree clock buffer model and demonstrate that balanced buffer insertion reduces skew from 200 ps to < 10 ps. The testbench measures the clock edge at leaf buffers and verifies skew.

---

**C-05** `[FPGA]`
**Source:** IR drop analysis, electromigration, power-grid stripes (ASIC physical design interview)
**Problem — Power Rail Integrity for an AI Inference Chip:**
An AI inference accelerator dissipates 80 W in a 10 mm × 10 mm die. The 0.8 V VDD rail must stay within ±50 mV under load. The power grid uses 4 µm wide top-metal stripes spaced every 100 µm. If the stripe resistance is 2 mΩ/µm and average current per stripe is 50 mA, calculate the IR drop per stripe. Implement a simplified PDN model in Verilog (an RLC power grid) and simulate a 50 A/ns transient. Verify that the decoupling capacitance is sufficient to keep the droop within ±50 mV.

---

**C-06** `[FPGA]`
**Source:** Multi-bit bus CDC, handshake protocol, Gray-coded pointers (ASIC design interview)
**Problem — AXI Write-Data Bus Crossing from a 300 MHz CPU to a 200 MHz DDR Controller:**
A 128-bit AXI write-data bus crosses from a 300 MHz CPU cluster to a 200 MHz DDR5 memory controller. Using a simple two-FF synchroniser on each of the 128 bits would produce skew; different bits may capture from different cycles of the write data. A handshake protocol or an asynchronous FIFO is needed. Implement a 4-entry asynchronous FIFO in Verilog with Gray-coded pointers for the 128-bit bus. The testbench writes 100 sequential 128-bit values and verifies correct ordering with no data corruption at the receiving domain.

---

**C-07** `[FPGA]`
**Source:** Power gating with isolation cells, retention flip-flops, wake-up sequence (low-power ASIC design)
**Problem — Power Domain Management for a Smartphone Application Processor:**
A mobile SoC has a Camera ISP power domain that must be shut off during calls to save 2 W. When the camera is turned off, flip-flops in the ISP lose state. When power returns, incorrect state causes the first frame to be corrupted. Implement power-gating logic in Verilog: (1) isolation cells clamp the domain outputs to a safe value before power is cut, (2) retention flip-flops save state before power-down, (3) a wake-up sequence restores state before un-isolating. The testbench verifies no glitches on the isolation boundary during power-up/down.

---

## IX. SENSOR INTERFACES & INSTRUMENTATION

---

**N-01** `[CJS+MCU]`
**Source:** Wheatstone bridge, instrumentation amplifier, RTD/thermocouple signal conditioning (instrumentation interview)
**Problem — PT100 RTD Conditioner for a Pharmaceutical Cold-Chain Monitor:**
A pharmaceutical cold-chain logger measures ambient temperature using a PT100 RTD (100 Ω at 0 °C, +0.385 Ω/°C). At −20 °C (storage temperature for some vaccines) the RTD is 92.3 Ω, varying 385 mΩ/°C. This tiny change must be resolved to 0.1 °C (38.5 mΩ resolution). In CircuitJS, design a constant-current excitation source (1 mA) and instrumentation amplifier to produce 0–3.3 V for −20 to +50 °C. In the MCU firmware, implement the Callendar-Van Dusen linearisation. The testbench verifies accuracy at −20, 0, and +50 °C.

---

**N-02** `[CJS]`
**Source:** Capacitive sensor interface, charge amplifier, electrostatic discharge protection (MEMS sensing)
**Problem — MEMS Microphone Preamplifier for a Noise-Cancelling Headset:**
A MEMS microphone presents a differential capacitive output of 1 pF with 100 fF variation per Pascal of acoustic pressure. A charge amplifier converts this to voltage. If the op-amp input bias current is too high, it discharges the sense capacitor and the sensitivity drops. In CircuitJS, design the charge amplifier with a feedback resistor sized to give 0.1 Hz low-frequency cut-off (preventing DC drift) while achieving 100 dB headroom above the thermal noise floor at 1 kHz. Verify the frequency response from 20 Hz to 20 kHz is flat ± 0.5 dB.

---

**N-03** `[MCU]`
**Source:** Encoder error detection, quadrature state machine, fault isolation (motor/robotics embedded)
**Problem — Fault-Tolerant Encoder Reader for a Factory Robot Arm:**
A delta robot arm has absolute magnetic encoders on each joint connected to the STM32 via SPI. During high-speed operation, SPI clock noise corrupts one in every 1000 position readings, causing the arm to jerk. Implement bare-metal SPI firmware that: (1) reads each encoder twice per control cycle, (2) if the two readings differ by more than 0.5° (hardware limit), it rejects the second reading and holds the previous position, (3) if three consecutive readings are suspect, it asserts an emergency stop via GPIO. The QEMU testbench injects random bit-flip errors.

---

**N-04** `[CJS+MCU]`
**Source:** Ultrasonic distance measurement, echo timing, temperature compensation (sensor firmware)
**Problem — ToF Distance Sensor for a Forklift Obstacle Avoidance System:**
A warehouse forklift uses an HC-SR04 ultrasonic sensor to detect obstacles. Speed of sound varies with temperature (c ≈ 331.4 + 0.6T m/s). At −10 °C the uncompensated distance reads 2 % high, potentially causing a collision at speed. In CircuitJS, model the ultrasonic transmit pulse and echo timing. In the STM32 firmware, use TIM2 input capture to measure echo pulse width, read ambient temperature from the I2C sensor, apply temperature compensation, and output range over UART. Verify < 1 % distance error from −10 °C to +40 °C.

---

## X. REAL-WORLD SYSTEM DESIGN (FULL PROBLEM)

These problems require designing across all three simulators.

---

**F-01** `[CJS + MCU + FPGA]`
**Source:** Full SDR receiver chain design (LNA → filter → ADC → digital baseband) combining RF, mixed-signal, and FPGA content
**Problem — Software-Defined Radio Weather-Satellite Receiver:**
An SDR receiver for NOAA weather satellite imagery (137.5 MHz, APT modulation) must be built from first principles. In CircuitJS: design a 137 MHz bandpass pre-filter (3 dB BW = 40 kHz), a 20 dB LNA stage, and an envelope detector. In the FPGA: implement a digital FM discriminator and a synchronous APT line sync detector using a matched filter. The full system must decode a simulated 2400 baud APT bitstream with fewer than 0.1 % bit errors in the presence of −90 dBm signal level.

---

**F-02** `[CJS + MCU]`
**Source:** Industrial 4–20 mA current loop, isolation, HART protocol (process instrumentation)
**Problem — Pressure Transmitter for a Chemical Process Line:**
A pressure transmitter in a chemical plant must send readings over a 4–20 mA loop to a SCADA system 200 m away (loop resistance 400 Ω). The transmitter uses an INA to read a piezoresistive bridge, and the STM32 converts the pressure to a proportional 4–20 mA current. Galvanic isolation (2500 V) is required for safety. In CircuitJS, design the 4–20 mA driver (transistor current sink controlled by DAC) and verify 4 mA at 0 bar and 20 mA at 100 bar with ±0.05 % accuracy across the 0–65 °C operating range.

---

**F-03** `[FPGA + CJS]`
**Source:** HDMI/DisplayPort transmitter physical layer, TMDS encoding, pixel clock (display interface design)
**Problem — HDMI 1.4 Transmitter Core for an FPGA Video Player:**
An FPGA-based media player must drive a 1080p60 HDMI display. The pixel clock is 148.5 MHz. HDMI uses TMDS (Transition Minimised Differential Signalling) encoding to reduce EMI: each 8-bit pixel is encoded into a 10-bit TMDS word. Implement the TMDS encoder in Verilog, including DC balance (tracking the running disparity) and the TERC4 encoding for the control and data island periods. The testbench feeds a 640 × 480 test pattern and verifies the TMDS output matches a reference encoder for 1000 pixels.

---

**F-04** `[MCU + CJS]`
**Source:** Motor FOC (Field-Oriented Control), Park/Clarke transforms, PI current loops (advanced motor control)
**Problem — Sensorless Field-Oriented Control for a Washing Machine Motor:**
A direct-drive washing machine motor uses a PMSM driven by FOC for quiet, efficient operation. The STM32 runs the FOC loop at 20 kHz. The Clarke transform converts three-phase currents (from two shunt resistors) to α-β frame; the Park transform converts to d-q frame; two PI loops regulate i_d (flux) and i_q (torque). Implement the Clarke and Park transforms in fixed-point C (Q15 format), the two PI current loops, and the inverse Park and space-vector PWM generation. The QEMU testbench verifies the d-axis current is held at zero and the q-axis current tracks a step demand within 5 ms.

---

**F-05** `[CJS + FPGA]`
**Source:** DDR4 memory controller timing, write-levelling, read-levelling (memory interface design)
**Problem — DDR4 Write-Levelling Calibration for an FPGA-Based Edge AI Inference Board:**
An FPGA-based AI accelerator uses a 16-bit DDR4 SDRAM at 3200 MT/s. The FPGA-to-DRAM trace length varies by ±5 mm between boards, causing 34 ps skew. Without write levelling the DQS strobe arrives at a different phase than the DQ signals, corrupting every write. Implement the write-levelling training sequence in Verilog: for each DQS lane, sweep delay tap values (0–127 ps) and check the DRAM acknowledgement pattern to find the eye centre. The testbench models a DRAM with adjustable DQS-to-DQ skew and verifies the calibration identifies the correct tap value.

---

## XI. NICHE / ADVANCED DOMAINS

---

**V-01** `[CJS]`
**Source:** High-voltage driver for piezoelectric actuator, charge-controlled amplifier (precision actuation)
**Problem — Piezo Inkjet Print-Head Drive Waveform:**
A precision inkjet print-head uses piezoelectric elements that require a specific trapezoidal drive waveform: 0 V → 40 V in 1 µs, hold for 3 µs, back to 0 V in 1 µs. The 40 V supply must not droop more than 2 V during the 200 mA peak drive current. In CircuitJS, design the high-side high-voltage driver (bootstrap gate drive) and verify the output waveform shape, slew rate, and supply droop during the pulse.

---

**V-02** `[CJS]`
**Source:** Class D amplifier efficiency, switching distortion, EMI filter (audio power amplifier)
**Problem — Class D Audio Amplifier for a Bluetooth Speaker:**
A 20 W Bluetooth speaker uses a Class D amplifier for efficiency (eliminating the heatsink of a Class AB design). But the PWM switching at 400 kHz causes conducted emissions that desense the BT receiver sharing the enclosure. In CircuitJS, implement the Class D output stage (H-bridge + LC reconstruction filter), verify THD < 0.05 % at 1 W/1 kHz, and design a CM filter on the speaker leads that reduces the 400 kHz switching spur by 40 dB without degrading audio bandwidth below 20 kHz.

---

**V-03** `[FPGA]`
**Source:** Systolic array design for matrix multiply, dataflow scheduling (neural network accelerator / TPU-like)
**Problem — 4×4 Systolic Array MAC Core for an Edge NPU:**
Google's TPU uses a systolic array to perform matrix-matrix multiplications for neural network inference. Implement a 4×4 systolic array in Verilog where each processing element (PE) receives data from its left neighbour (weight) and top neighbour (activation), performs a 16-bit × 16-bit multiply-accumulate, and passes the result down. The array computes C = A × B in 4 + 4 − 1 = 7 cycles (wave-front pipelining). The testbench verifies a 4×4 matrix product (16-bit inputs, 32-bit accumulators) against a software reference for 100 random matrix pairs.

---

**V-04** `[FPGA]`
**Source:** CORDIC algorithm, iterative rotation, fixed-point trigonometry (DSP hardware)
**Problem — CORDIC-Based Phase Rotator for a Direct Digital Synthesiser:**
An SDR transmitter uses a DDS to generate IF signals. The DDS needs a CORDIC block to compute sin and cos of a 32-bit phase accumulator, providing I/Q outputs at 200 Msps. A table-lookup consumes 4 MB of BRAM; a CORDIC uses only registers and shifters. Implement a 16-iteration CORDIC in Verilog (rotation mode). The testbench verifies sin/cos accuracy to 16-bit precision (SFDR > 96 dBc) for 1000 uniformly distributed phase values.

---

**V-05** `[FPGA]`
**Source:** Reed-Solomon FEC, Galois field arithmetic, error correction (coding theory / digital comms)
**Problem — RS(255,239) Forward Error Correction for a DVB-S2 Satellite Receiver:**
A DVB-S2 satellite receiver uses Reed-Solomon RS(255,239) to correct up to 8 symbol errors per 255-symbol block. Implement the RS(255,239) syndrome calculator in Verilog over GF(2^8) with polynomial x^8+x^4+x^3+x^2+1. The testbench injects 4-symbol errors at random positions within a 255-symbol block and verifies the syndrome vector is non-zero. The decoder outputs the corrected block identical to the original.

---

**V-06** `[CJS]`
**Source:** Switched-mode power supply for negative voltage generation (charge pump), bipolar op-amp supply
**Problem — Dual-Rail Supply for an Op-Amp in a Single-Supply Portable Device:**
A portable oscilloscope probe must measure signals referenced to any ground with an op-amp that needs ±5 V supplies. Only a 5 V USB battery is available. A charge pump inverter generates −5 V. In CircuitJS, implement the charge pump (two flying capacitors, 4 switches, 100 kHz oscillating control) and verify the negative rail settles to −5 V ± 5 % under a 20 mA load. Measure the output ripple and size the output reservoir capacitor to keep ripple below 100 mV.

---

**V-07** `[MCU]`
**Source:** CAN-FD protocol, bit-stuffing, error frames, bus-off recovery (automotive networking)
**Problem — CAN-FD Node for an ADAS Radar Module:**
An autonomous vehicle radar module communicates target data at 2 Mbit/s using CAN-FD (data phase). The radar shares the bus with 5 other modules. If the radar's termination resistor is missing, reflections cause bit errors, and after 128 consecutive errors the node enters bus-off state and stops transmitting — losing radar data at highway speed. Implement bare-metal CAN-FD firmware that: (1) monitors the BOFF flag in the CAN error-count register, (2) on bus-off detection, attempts automatic recovery after 128 × 11 recessive bits (as per ISO 11898), (3) logs the recovery attempt count via UART. The QEMU testbench injects bus error events.

---

**V-08** `[MCU]`
**Source:** USB CDC enumeration, control endpoint, descriptor tables (USB firmware interview)
**Problem — USB CDC Virtual COM Port for a Wireless Protocol Analyser:**
A BLE protocol analyser dongle appears to the PC as a virtual COM port (USB CDC class) for easy driver-free operation. The STM32F103 implements the USB peripheral. Enumeration requires the host to read Device, Configuration, Interface, and Endpoint descriptors. A wrong `bMaxPacketSize` in the descriptor causes the host to reject the device and display "Unknown Device" in Device Manager. Implement bare-metal USB CDC enumeration in C: define all required descriptors, handle the `GET_DESCRIPTOR` control transfer, and respond to the `SET_CONFIGURATION` request. The QEMU testbench simulates the USB host control sequence and verifies the device is successfully enumerated.

---

**V-09** `[FPGA]`
**Source:** FFT butterfly computation, fixed-point scaling, twiddle factor LUT (DSP architecture)
**Problem — 1024-Point FFT Engine for a Spectrum Analyser:**
A portable spectrum analyser needs to compute 1024-point FFTs on incoming ADC data at 10 MSPS (a new FFT every 102.4 µs). A software FFT on an MCU takes 1.2 ms — too slow. Implement a fully pipelined radix-2 DIT FFT in Verilog for a 1024-point transform with 16-bit fixed-point inputs and 32-bit accumulators. The twiddle factors are stored in BRAM. The testbench feeds a 1 kHz sine wave sampled at 10 MHz and verifies the FFT output has a peak bin within ±1 bin of the expected frequency, with all other bins below −60 dBFS.

---

**V-10** `[CJS + FPGA]`
**Source:** SerDes transceiver eye diagram, pre-emphasis, equalization (high-speed PHY design)
**Problem — Pre-Emphasis Tuning for a 10 Gbps SFP+ Module:**
A 10 Gbps SFP+ optical module drives a 20 cm PCB trace at 10 Gbps. The trace has 6 dB of insertion loss at 5 GHz (Nyquist), closing the eye at the receiver. Pre-emphasis in the transmitter boosts the high-frequency content to compensate. In CircuitJS, model the transmit driver with configurable first-cursor pre-emphasis (0, 3, 6 dB boost) and the lossy transmission line. Show the eye diagram with and without pre-emphasis. In the FPGA simulator, implement the digital pre-emphasis tap (FIR filter with one preceding tap) and verify the eye opening at the far end meets a 100 mV / 25 ps eye mask.

---

## XII. SOURCED PROBLEMS (WITH ORIGINALS)

This section tracks problems sourced directly from real interview questions found online, with attribution.

---

**SRC-01** `[FPGA]`
**Original (Qualcomm ASIC Interview):** "What does `set_clock_groups -asynchronous -group clk_a -group clk_b -group clk_c` indicate to the synthesis tool?"
**Reworded Problem — Multi-Clock Domain Constraints for a 5G Modem SoC:**
A 5G NR modem SoC has three independent clocks: `clk_rf` (122.88 MHz, from RF PLL), `clk_bb` (307.2 MHz, from baseband PLL), and `clk_sys` (200 MHz, from system PLL). The three domains communicate only through clock-domain-crossing bridges. Implement the three-domain design in Verilog with proper CDC synchronisers between each pair of domains. Write an XDC constraint file that declares all three clocks and sets them as mutually asynchronous. The testbench verifies that no data corruption occurs when all three domains transfer 10,000 tokens simultaneously.

---

**SRC-02** `[MCU]`
**Original (Apple Wireless firmware interview):** "Why do we need digital communication and coding? What are the benefits over analog?"
**Reworded Problem — Packet CRC vs. Analog SNR Trade-Off in a Zigbee Sensor:**
A Zigbee home automation sensor can either send raw ADC values as continuous voltage (analog) or send 11-byte framed packets with CRC-16 (digital). At −90 dBm received power (near the sensitivity floor), analog SNR is 3 dB; the Zigbee PHY with CRC achieves 0.1 % PER. Implement bare-metal firmware on the STM32 that: (1) computes CRC-16 (CCITT) over a 9-byte sensor payload, (2) frames the packet (preamble + SFD + length + payload + CRC), and (3) sends the frame via UART (simulating a Zigbee radio). The QEMU testbench introduces 1 random bit error per frame and verifies the CRC detects it 100 % of the time.

---

**SRC-03** `[FPGA]`
**Original (NVIDIA ASIC interview):** "Two flip-flops are placed far from each other with no combinational logic between them. Distance is 60 mm, data wire delay 400 ps/mm, clock wire delay 200 ps/mm. How many retiming flops are needed?"
**Reworded Problem — Retiming Registers in a Long-Haul PCB Data Path for a Data Centre Switch:**
A 400G Ethernet switch ASIC sends a signal across a 72 mm PCB trace at 10 Gbps (100 ps bit period). The data wire delay is 180 ps/mm; the clock wire delay is 110 ps/mm. Without retiming, the setup slack is deeply negative. How many retiming registers are needed, and where should they be inserted? Implement the retiming structure in Verilog and write the SDC constraint for the multi-cycle path. The testbench verifies data integrity after retiming for a 2^23 − 1 PRBS test sequence.

---

**SRC-04** `[CJS]`
**Original (RF interview):** "Where do you put the filter relative to the LNA in the receive chain, and why?"
**Reworded Problem — Out-of-Band Blocker Trade-Off in a Police Radio Receiver:**
A P25 police radio receiver operates at 700 MHz. A co-located TV broadcast tower transmits 35 dBm at 650 MHz (50 MHz away). The LNA has NF=1.2 dB, gain=15 dB, and IIP3=+5 dBm. A SAW bandpass filter (700 MHz ±5 MHz) has 3 dB insertion loss but 60 dB rejection at 650 MHz. Should the SAW filter go before or after the LNA? In CircuitJS, model both configurations: calculate system NF and output IM3 product level for each, and determine which configuration meets the −110 dBm receiver sensitivity while keeping the blocker below the compression point.

---

**SRC-05** `[MCU]`
**Original (embedded systems interview):** "Describe how ISRs work at the hardware and software levels. How do you keep ISRs short?"
**Reworded Problem — High-Rate LIDAR Data Stream Handler for an Autonomous Shuttle:**
An autonomous vehicle LIDAR generates 1.2 million range points per second (1.2 Mpps) via UART at 10 Mbaud. Each point is 6 bytes. The MCU must receive and buffer all points without dropping any. A 6 µs ISR that processes each point limits the MCU to < 160k pps before starving the main loop. Implement bare-metal UART RX firmware with: (1) a minimal ISR that only pushes bytes to a 8192-byte ring buffer, (2) a main-loop consumer that processes complete 6-byte packets from the ring buffer, and (3) an overflow flag if the ring fills. The QEMU testbench injects 10,000 points continuously at maximum rate and verifies zero drops.

---

**SRC-06** `[CJS]`
**Original (power electronics interview):** "What are switching losses, conduction losses, and how do you minimise them?"
**Reworded Problem — Efficiency Optimisation for a 48 V→12 V Synchronous Buck in a Server Rack:**
A hyperscale data centre converts 48 V to 12 V at 100 A per server tray. Each 1 % efficiency improvement saves megawatts across a 100,000-server deployment. The converter uses a 100 kHz synchronous buck with Si MOSFETs. Switch-on transition losses are 8 W; conduction losses are 6 W. Switching to GaN at 400 kHz reduces dead-time loss but increases gate-drive complexity. In CircuitJS, model both designs, measure efficiency (output power / input power) at 50 % and 100 % load, and determine the break-even point where GaN's lower conduction losses offset its higher gate-charge losses.

---

**SRC-07** `[FPGA]`
**Original (RTL interview):** "We have a shift register with 4 back-to-back flip-flops. Each flop has +ve clock-to-Q delay and +ve hold time. Is it possible for this path to have hold violations?"
**Reworded Problem — Hold Violation in a High-Speed Deserialiser Pipeline:**
A 10 Gbps SERDES deserialiser takes in 10-bit parallel data from the CDR and passes it through a 4-stage pipeline at 1 GHz. The clock-to-Q delay of each flip-flop is 80 ps; the hold time is 60 ps; clock skew between adjacent stages is 50 ps. Is there a hold violation? Implement the 4-stage register pipeline in Verilog, create the XDC constraint specifying the skew, and run the testbench against all-zeros, all-ones, and walking-one data patterns to observe if any hold violation manifests as a functional failure.

---

**SRC-08** `[CJS + MCU]`
**Original (hardware internship interview):** "Draw a circuit to connect a sensor to a microcontroller." / "Design a sample-and-hold circuit."
**Reworded Problem — 4-Channel Simultaneous-Sampling ADC Front-End for a Power Quality Analyser:**
A power quality analyser must simultaneously sample all three phases of voltage and current at 1 MSPS with less than 1 µs skew between channels (to measure phase angle). Sequential sampling introduces inter-channel skew proportional to the ADC conversion time, corrupting power factor calculations at 50 Hz. In CircuitJS, design four identical sample-and-hold circuits that all switch simultaneously on a common clock edge, then are read out sequentially by the STM32 ADC. In the MCU firmware, implement a 4-channel sequential read using DMA and verify channel-to-channel skew is < 100 ns in the QEMU testbench.

---

*End of Scope.io Problem Bank — v1 Extended*

**Total problems:** 80+ problems across 12 domains.
**Simulators covered:** CircuitJS (analog/power), STM32 QEMU (embedded firmware), FPGA/HDL (digital logic).
**Domains:** Power Electronics, Analog Design, Digital Logic, MCU/Embedded, Mixed-Signal, High-Speed SI, RF/Wireless, ASIC, Instrumentation, Full-System, Niche (NPU, SDR, CORDIC, RS FEC), and Sourced Interview Questions.
