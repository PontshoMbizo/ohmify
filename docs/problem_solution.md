# Scope.io Problem & Solution Set

Twenty-six problems across two batches, curated from `scope-io-problem-bank.md` and `scope-io-community-sourced-ideas.md`, rephrased in the house style and filtered for what CircuitJS, mcusim (QEMU/Blue Pill), and fpgasim (Tang Nano 9K) can actually run and grade. Model solutions are design walkthroughs: architecture, sizing math, and pass criteria — no netlists or code.

## Batch 1 (Problems 1–9)

| # | Simulator | Title | Source |
| --- | --- | --- | --- |
| 1 | CircuitJS | Buck Converter for a Warehouse Inspection Rover | Bank P-01 + Community Sources 11, 13 |
| 2 | CircuitJS | Three-Band Audio Filter Bank for a Music-Reactive LED Cube | Community Source 6 + Bank A-03 |
| 3 | CircuitJS | High-Side Current Sensing for an E-Bike Battery Pack | Bank A-07 |
| 4 | MCU | Keypad Debounce for a Vending Machine | Bank M-01 (adapted for QEMU) |
| 5 | MCU | Soft-Start Fan Controller | Bank M-09 / P-09 (adapted for QEMU) |
| 6 | MCU | Torn-Read-Proof Shared Buffer for a Gas Analyser | Bank M-08 |
| 7 | FPGA | UART Telemetry Transmitter at 27 MHz | Bank D-05 (flipped RX→TX) |
| 8 | FPGA | Gray-Coded Event Counter Across Clock Domains | Bank D-13 / D-03 |
| 9 | FPGA | Pedestrian Crossing Controller on the Tang Nano 9K | Community Sources 2, 17 |

---

# 1. Buck Converter for a Warehouse Inspection Rover `[CJS]`

## Overview

A small warehouse inspection rover runs from a single 3S LiPo pack (9.0–12.6 V across the discharge range). One 5 V rail must power both the control board (100 mA) and a small brushed DC drive motor (180 mA running). Motor start-up draws 4–5× the running current, and a poorly sized converter lets the rail collapse at every pull-away — resetting the controller mid-mission. Your task is the most common beginner question on the forums, made concrete: pick the inductor, pick the capacitor, close the loop.

## System Objective

The system must step the battery voltage down to a stable 5 V rail that survives motor inrush without browning out the controller.

The system must:

* **Regulate the Output:** Hold 5 V ± 5 % across the full 9.0–12.6 V input range.
* **Limit Ripple:** Keep steady-state output ripple below 50 mV peak-to-peak.
* **Survive Inrush:** Keep the rail above 4.75 V during a 1.0 A, 50 ms motor start transient.

## Operating Principle

1. **Switching:** A high-side switch chops the battery voltage at a fixed frequency; a freewheel path carries inductor current when the switch is off.
2. **Filtering:** The LC output stage averages the chopped waveform into DC.
3. **Feedback:** An error amplifier compares the output against a reference and adjusts the duty cycle to hold regulation as the load changes.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Input Source | 3S LiPo, 9.0–12.6 V |
| Output | 5 V ± 5 % |
| Steady Load | 280 mA (controller + motor running) |
| Inrush Transient | 1.0 A for 50 ms (motor start) |
| Switching Frequency | $f_{sw} = 100\,kHz$ |
| Inductor Ripple | $\Delta I_L \le 100\,mA$ |
| Output Ripple | $\le 50\,mV_{pp}$ |

## Model Solution — Design Walkthrough

**Duty cycle.** $D = V_o/V_{in}$: 0.56 at 9.0 V, 0.45 at 11.1 V, 0.40 at 12.6 V. Comfortably inside the controllable range at both extremes — no boost or buck-boost needed.

**Inductor.** Ripple is worst at maximum input. From $\Delta I_L = \dfrac{V_o(1-D)}{L f_{sw}}$ with $V_{in}=12.6\,V$: solving for $\Delta I_L = 100\,mA$ gives $L = 302\,\mu H$; the next standard value **330 µH** yields $\Delta I_L = 91\,mA$. Sanity check: ripple is ~33 % of the 280 mA load, so the converter stays in continuous conduction at full load but will go discontinuous at light load (controller only, 100 mA) — worth observing in the scope, not a failure.

**Output capacitor — two competing requirements.** Steady-state ripple needs only $C \ge \dfrac{\Delta I_L}{8 f_{sw} \Delta V} = \dfrac{0.091}{8 \cdot 10^5 \cdot 0.05} \approx 2.3\,\mu F$. The inrush transient dominates: a 0.72 A load step serviced by a loop with ~5 kHz crossover droops $\Delta V \approx \dfrac{\Delta I_{step}}{2\pi f_c C}$, so holding 250 mV requires $C \approx 92\,\mu F$ → use **100 µF**. The teaching point: transient response, not ripple, sizes the capacitor.

**Feedback.** A CircuitJS-friendly loop mirrors the sPWM exemplar: an op-amp error amplifier (reference 2.5 V from a divider, output divider 2:1) compared against a 100 kHz triangle carrier to generate the duty cycle. A slower alternative that also passes: hysteretic control with a comparator and ~50 mV hysteresis band.

**Motor model for the testbench.** Running motor ≈ 28 Ω resistive load; start-up ≈ 6.2 Ω (stall) switched in for 50 ms, then stepped to 28 Ω.

**Verification.** Scope 1: $V_{out}$ ripple at 280 mA steady load — pass if < 50 mV pp. Scope 2: switch the stall load in; pass if $V_{out}$ minimum ≥ 4.75 V and recovery to ±5 % within 5 ms of the load returning to 28 Ω. Scope 3: inductor current — confirm $\Delta I_L \le 100\,mA$ and no saturation-style runaway during inrush.

---

# 2. Three-Band Audio Filter Bank for a Music-Reactive LED Cube `[CJS]`

## Overview

An 8×8×8 LED cube reacts to music: bass drives one animation layer, mids another, treble a third. The audio source is a line-level signal of ±1.5 V, but the microcontroller ADC reading the three band levels accepts only 0–5 V. A single RC per band was tried first and the bands bled into each other — a real forum poster was told exactly why: first-order roll-off is far too gradual. You will build the analog front end properly.

## System Objective

The system must split a ±1.5 V audio signal into three level-shifted band outputs sized for a 0–5 V ADC.

The system must:

* **Separate Three Bands:** Bass (≤ 500 Hz), mid (500 Hz–4 kHz), treble (≥ 4 kHz).
* **Achieve Steep Roll-Off:** At least third-order (Butterworth) band edges: ≥ 18 dB attenuation one octave outside each edge.
* **Fit the ADC Window:** Bias every output to 2.5 V and scale so the full audio swing spans 0.25–4.75 V without clipping.

## Operating Principle

1. **Bias and Scale:** AC-couple the input onto a 2.5 V mid-rail reference and set the gain budget so downstream filter gain does not overflow the ADC window.
2. **Filter:** Route the biased signal into three parallel filter paths — low-pass, band-pass (cascaded high-pass + low-pass), high-pass.
3. **Drive the ADC:** Each path ends in an op-amp output presenting a low source impedance to its ADC channel.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Input Signal | ±1.5 V audio, 20 Hz–20 kHz |
| Band Edges | 500 Hz and 4 kHz |
| Edge Steepness | ≥ 18 dB one octave beyond each edge (3rd order) |
| Output Window | 0.25–4.75 V, centred on 2.5 V |
| Supply | Single 5 V rail |

## Model Solution — Design Walkthrough

**Topology per edge.** A third-order Butterworth factors into one real pole plus a complex pair with $Q = 1$: implement as a passive RC section feeding an equal-component Sallen-Key stage. For equal-R, equal-C Sallen-Key, $Q = \dfrac{1}{3-K}$, so $Q = 1$ requires stage gain $K = 2$ (feedback divider with two equal resistors). This is the compact answer to "how do I get a sharp cutoff" from the source thread — verified: 3rd order gives 18.1 dB at $2f_c$ vs 7.0 dB for the single RC the poster started with.

**Bass path (LP, 500 Hz).** Real pole: $C = 100\,nF$, $R = \dfrac{1}{2\pi f_c C} = 3.18\,k\Omega$ → 3.3 kΩ. Sallen-Key pair: $C = 47\,nF$, $R = 6.77\,k\Omega$ → 6.8 kΩ, $K = 2$.

**Treble path (HP, 4 kHz).** Mirror the topology (swap R↔C positions): $C = 10\,nF$, $R = 3.98\,k\Omega$ → 3.9 kΩ throughout, $K = 2$.

**Mid path.** Cascade a 3rd-order HP at 500 Hz into a 3rd-order LP at 4 kHz. With band edges 3 octaves apart the cascade's centre loss is negligible; geometric centre $\approx 1.4\,kHz$ is where you verify ~0 dB.

**Gain budget.** Each Sallen-Key contributes ×2 (bass/treble) or ×4 (mid, two stages). Scale the front end so total path gain is 1.5: ±1.5 V × 1.5 = ±2.25 V about the 2.5 V bias → 0.25–4.75 V exactly. Bass/treble front attenuator: 0.75; mid path: 0.375 (or drop one SK stage to unity-gain Q via unequal components — acceptable alternative).

**Bias network.** 100 kΩ/100 kΩ divider to 2.5 V, buffered; input coupling capacitor against the 50 kΩ Thevenin resistance: $C = 330\,nF$ puts the coupling pole at ~10 Hz, a decade below the audio band.

**Verification.** Drive a swept or stepped sine (100 Hz, 1.4 kHz, 8 kHz at ±1.5 V). Pass criteria: each tone appears ≥ 0 dB on exactly one output; on adjacent bands it is down ≥ 18 dB; no output leaves 0.25–4.75 V; 1 kHz on the bass output reads −18 dB relative to 250 Hz.

---

# 3. High-Side Current Sensing for an E-Bike Battery Pack `[CJS]`

## Overview

An e-bike BMS must measure pack current up to 40 A on the positive rail — low-side sensing would break the ground reference shared with the charger and controller. The shunt is 1 mΩ, so full scale is only 40 mV riding on a 48 V common mode, while the measurement must land in a 0–3.3 V ADC window. The naive difference amplifier hides a trap this problem is designed to expose.

## System Objective

The system must translate a 0–40 mV high-side shunt voltage at ~48 V common mode into a ground-referenced 0–3.3 V signal.

The system must:

* **Reject Common Mode:** Output shift < 1 % of full scale as the pack swings 36–54 V.
* **Scale Accurately:** Gain 82.5 (40 mV → 3.3 V), linearity error < 2 % of full scale.
* **Filter Switching Noise:** Attenuate motor-controller PWM ripple above ~200 Hz on the output.

## Operating Principle

1. **Sense:** Pack current develops $V_{shunt} = I \cdot 1\,m\Omega$ across the high-side shunt.
2. **Convert to Current:** A feedback loop impresses $V_{shunt}$ across a gain-set resistor, producing a small current proportional to pack current.
3. **Translate Down:** That current flows down to a ground-referenced output resistor, re-creating the signal as 0–3.3 V regardless of the 48 V rail.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Shunt | $1\,m\Omega$, high-side |
| Current Range | 0–40 A (40 mV full scale) |
| Common-Mode Voltage | 36–54 V |
| Output | 0–3.3 V, ground-referenced |
| CM-Induced Error | < 1 % FS over 36–54 V |
| Output Bandwidth | ~200 Hz (filtered) |

## Model Solution — Design Walkthrough

**Why the textbook difference amplifier fails here.** With gain 82.5 (e.g. 1 kΩ/82.5 kΩ), the op-amp's non-inverting node sits at $48 \cdot \frac{82.5}{83.5} \approx 47\,V$ — far outside any low-voltage op-amp's input range. Attenuating first (divider ratios reversed) keeps the op-amp alive but hands CMRR to resistor matching: for a low-gain four-resistor stage, worst-case CMRR ≈ $(1+A_d)/4t$, roughly 54–60 dB with 0.1 % parts. Even at an optimistic 60 dB, 48 V of common mode leaks 48 mV input-referred — larger than the 40 mV full-scale signal itself. This calculation is the heart of the problem.

**Working topology: op-amp + PNP current conveyor.** Tie $R_{in} = 100\,\Omega$ from the shunt's load side to a PNP emitter; the op-amp (powered from the 48 V rail) drives the base so its inputs equalise, forcing $V_{R_{in}} = V_{shunt}$. Emitter current is then $I_e = V_{shunt}/R_{in}$ = 0–400 µA, which the collector delivers to a grounded $R_{out}$:

$$V_{out} = V_{shunt}\cdot\frac{R_{out}}{R_{in}}, \qquad R_{out} = \frac{3.3\,V}{400\,\mu A} = 8.25\,k\Omega$$

Common-mode immunity is now structural — the 48 V rail is only a supply, not part of the signal divider — so CM error collapses to op-amp CMRR and Early-effect leakage, easily < 1 % FS.

**Error terms worth stating.** Base current steals $I_e/\beta$ from the collector: with $\beta = 100$ that is a 1 % gain error — acceptable here, or replace the PNP with a PMOS for ~0 %. $R_{in}$ and $R_{out}$ tolerance enter the gain directly: 1 % parts meet the 2 % linearity budget.

**Filtering.** 100 nF across $R_{out}$: $f_c = \dfrac{1}{2\pi \cdot 8.25\,k\Omega \cdot 100\,nF} = 193\,Hz$.

**Verification.** Sweep a load current source 0→40 A: output must track 0→3.3 V within 2 % FS (check 10 A → 825 mV, 20 A → 1.65 V). Step the pack source 36→54 V at constant 20 A: output shift must stay < 33 mV. Superimpose a 16 kHz, 5 A pp ripple: output ripple < 25 mV confirms the filter.

---

# 4. Keypad Debounce for a Vending Machine `[MCU]`

## Overview

A beverage vending machine's tactile buttons bounce: one physical press produces 5–20 electrical transitions inside 10 ms, and naive edge-triggered code vends five drinks for one coin. Because the simulator has no live inputs, the recorded bounce waveform is supplied to your firmware as a sampled GPIO vector — your job is the debounce state machine that turns that mess into exactly one event per press.

## System Objective

The system must convert a bouncing key signal into clean single-press events using time-based sampling.

The system must:

* **Sample Periodically:** Read the key state on a 1 ms SysTick interrupt, never in a busy loop.
* **Confirm by Consensus:** Declare a state change only after 10 consecutive identical samples.
* **Emit One Event per Press:** Pulse the event output exactly once per physical press, visible on the trace timeline.

## Operating Principle

1. **Tick:** SysTick fires at 1 kHz; the ISR reads the next key sample (from the supplied bounce vector standing in for the GPIO input register).
2. **Integrate:** A per-key counter increments while the raw sample disagrees with the debounced state and resets on agreement.
3. **Commit:** When the counter reaches 10, the debounced state flips; a rising flip emits a one-tick event pulse via `trace_pin()`.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Sample Rate | 1 kHz (SysTick) |
| Confirmation Window | $N = 10$ consecutive samples |
| Bounce Duration | ≤ 10 ms either edge |
| Detection Latency | ≤ 20 ms from first clean contact |
| Keys | 12, independent state |
| Observability | `trace_pin()` on the event output |

## Model Solution — Design Walkthrough

**Timer setup.** With the 8 MHz default clock, SysTick reload $= 8\,MHz / 1\,kHz - 1 = 7999$. All timing derives from tick counts, never busy-wait loops — QEMU virtualises time, so cycle-burning delays are both untestable and wrong.

**Debounce structure.** Per key: one byte of counter, one bit of debounced state. On each tick: if `raw != stable`, increment the counter; else reset it to 0. On counter reaching 10, set `stable = raw`, reset the counter, and if the new state is *pressed*, pulse the event pin for one tick. This is the counting/integrator debouncer — unlike a fixed lockout delay it re-arms cleanly and rejects noise bursts shorter than 10 ms in either direction.

**Latency math (worth asking learners to state).** A press is confirmed 10 samples after the last bounce transition: worst case = 10 ms bounce + 10 ms confirmation = 20 ms, meeting spec. Minimum detectable press ≈ 10 ms — fine for humans (> 50 ms typical).

**Why not EXTI edge interrupts.** Each bounce edge would fire the ISR (5–20 interrupts per press, an interrupt storm at scale), and the "debounce delay in the ISR" fix blocks the CPU. Periodic sampling costs a fixed, tiny budget: 12 keys × a few cycles at 1 kHz.

**Memory/CPU budget.** 12 counters + 2 bytes of packed state ≈ 14 bytes; ISR work is O(keys), microseconds per tick.

**Verification.** The harness's bounce vector contains 3 presses (one with 18 transitions, one clean, one 8 ms noise burst that must be rejected). Pass: the trace timeline shows exactly 3 event pulses, each 10–20 ms after its press onset, and zero pulses for the noise burst.

---

# 5. Soft-Start Fan Controller `[MCU]`

## Overview

A server-rack fan tray trips its 2 A fuse when the fan is commanded to full speed from standstill — locked-rotor inrush. The fix is firmware: ramp the drive duty cycle so the motor spins up gently. Stock QEMU does not model the STM32 hardware timers' PWM outputs, so this problem is deliberately specified as *software* PWM scheduled off SysTick — slower, but observable on the pin trace and exactly the same control logic you would later point at TIM1.

## System Objective

The system must generate a software PWM signal whose duty cycle ramps linearly at power-up.

The system must:

* **Generate PWM:** 100 Hz output with 1 % duty resolution, bit-banged from a 10 kHz SysTick schedule.
* **Ramp the Duty:** 10 % → 90 % linearly over 2 s (one 1 % step every 25 ms).
* **Hold at Target:** Remain at 90 % after the ramp with no glitches or missed periods.

## Operating Principle

1. **Tick Base:** SysTick at 10 kHz gives 100 ticks per PWM period → 1 % duty granularity.
2. **Modulate:** Within each 100-tick period the output is high while `tick_in_period < duty`, low otherwise.
3. **Ramp:** A 25 ms scheduler (250 ticks) increments `duty` from 10 to 90.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Tick Rate | 10 kHz (SysTick reload 799 @ 8 MHz) |
| PWM Frequency | 100 Hz |
| Duty Resolution | 1 % |
| Ramp | 10 % → 90 % in 2 s, linear |
| Output | GPIO via `trace_pin()` |

## Model Solution — Design Walkthrough

**Arithmetic first.** 10 kHz / 100 ticks = 100 Hz PWM. Ramp spans 80 steps over 2 s → one step per 25 ms = every 250 ticks. Everything is integer-derived from one tick counter — the intended lesson is deriving multiple time bases from a single interrupt without nested timers.

**ISR structure.** One counter `t` modulo 100 for the PWM phase; compare against `duty` to set the pin (state-change-only calls to `trace_pin()` keep the semihosting log small — an mcusim-specific practice worth teaching). A second counter modulo 250 advances the ramp while `duty < 90`.

**Glitch-free updates.** Change `duty` only at period boundaries (`t == 0`). Mid-period increments can emit a runt pulse (e.g. pin falls, duty rises, pin rises again) — the testbench looks for exactly one rising and one falling edge per 10 ms period, so boundary-synchronised update is required to pass.

**Why the fuse survives.** Duty maps ~linearly to average motor voltage; ramping over 2 s (≫ the motor's electrical time constant, ≈ ms) keeps current near the running envelope instead of the 4–5× locked-rotor spike. A one-line RC analogy in the solution ties this back to Problem 1's inrush spec.

**Verification.** From the pin trace: (a) exactly one high pulse per 10 ms period throughout; (b) pulse width 1.0 ms ± one tick at t = 0, 5.0 ms at t = 1.0 s, 9.0 ms from t = 2.0 s on; (c) monotonic width growth, no missing periods, no runt pulses.

---

# 6. Torn-Read-Proof Shared Buffer for a Gas Analyser `[MCU]`

## Overview

A gas detection instrument assembles 8-byte sensor records in an interrupt handler and processes them in the main loop. Under load, the alarm fires falsely: the main loop occasionally reads a record whose first bytes belong to sample N and last bytes to sample N+1 — a torn read. The bug is invisible in code review and intermittent at runtime, which is precisely why it is a classic interview question. You will build the failure, observe it, then fix it.

## System Objective

The system must share data between an ISR producer and a main-loop consumer with no torn reads.

The system must:

* **Produce Deterministically:** A 1 kHz SysTick ISR fills an 8-byte record where every byte equals the low byte of the sample number (self-checking payload).
* **Consume Safely:** The main loop copies and validates records via a guarded double-buffer swap.
* **Prove Both Cases:** Run once with guards compiled out (torn reads traced) and once with guards in (zero torn reads).

## Operating Principle

1. **Double Buffer:** The ISR writes into the *back* buffer; the consumer reads the *front*.
2. **Swap Under Guard:** The consumer swaps front/back inside a `__disable_irq()` / `__enable_irq()` critical section lasting only the pointer exchange.
3. **Signal:** A `volatile` flag set by the ISR tells the consumer a fresh record exists; the consumer validates all 8 bytes are identical and pulses a TORN trace pin on mismatch.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Producer | SysTick ISR, 1 kHz, 8-byte records |
| Payload | All 8 bytes = sample number (mod 256) |
| Critical Section | ≤ a few µs (pointer swap only) |
| Flags | `volatile` new-data flag; TORN trace pin |
| Deliverable | Guarded and unguarded builds, both traced |

## Model Solution — Design Walkthrough

**Anatomy of the tear.** The consumer's byte-copy loop takes tens of cycles; the 1 kHz ISR can preempt it mid-copy and overwrite the same memory. The self-checking payload converts this timing bug into a visible data bug: any record whose bytes disagree was torn. Deliberately padding the consumer copy (e.g. copying one byte per main-loop pass in the unguarded build) makes tears frequent enough for QEMU's virtual clock to catch within a short run.

**Why double-buffer + swap beats a lock on the data.** Disabling interrupts around the whole copy works but stretches the critical section (8 bytes here, but records grow); interrupt latency then bleeds into every other ISR. Swapping two pointers under guard bounds the critical section to ~2 instructions regardless of record size — the design principle being graded.

**The `volatile` half of the bug.** Without `volatile`, the compiler may cache the new-data flag in a register and the consumer never sees updates — a second, distinct failure worth one paragraph in the solution: `volatile` fixes *visibility*, the critical section fixes *atomicity*; neither substitutes for the other.

**ISR-side rule.** The ISR must check that the consumer is not mid-swap — with a single consumer and pointer swap under disabled interrupts this is guaranteed; state why (the swap cannot be preempted, and the ISR never runs during it).

**Verification.** Unguarded build: TORN pin pulses at least once within the run (harness asserts ≥ 1). Guarded build: zero TORN pulses across ≥ 5000 records, and the consumed sequence numbers are monotonically non-decreasing with no gaps larger than expected from consumer pacing.

---

# 7. UART Telemetry Transmitter at 27 MHz `[FPGA]`

## Overview

A machine-status board built on the Tang Nano 9K must stream telemetry to a factory PC over a serial line — no soft CPU, pure logic. The board's oscillator is 27 MHz, which does not divide evenly into any standard baud rate; part of the exercise is proving your imperfect divider is still safely inside the 8N1 timing budget. The simulator's UART monitor decodes your TX pin and prints what you actually sent — there is nowhere to hide a framing bug.

## System Objective

The system must transmit framed serial data at 115200 baud, 8N1, from a 27 MHz clock.

The system must:

* **Generate the Baud Tick:** Derive 115200 Hz from 27 MHz and justify the frequency error.
* **Frame Correctly:** Idle-high line, start bit, 8 data bits LSB-first, stop bit.
* **Pace Telemetry:** Transmit one incrementing byte every 1 ms, back-to-back frames never overlapping.

## Operating Principle

1. **Divide:** A counter generates one baud-tick per bit period.
2. **Sequence:** An FSM walks IDLE → START → DATA×8 → STOP, driving the TX pin from a shift register.
3. **Schedule:** A 1 ms pacer loads the next payload byte (an incrementing counter) and kicks the FSM.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Clock | $f_{clk} = 27\,MHz$ (board oscillator) |
| Line Format | 115200 baud, 8N1, LSB-first |
| Baud Error | ≤ 0.5 % (state actual error) |
| Payload | Incrementing byte, one frame per 1 ms |
| Pin Mapping | TX via `.cst` to the UART monitor pin |

## Model Solution — Design Walkthrough

**Divider and its error — the core calculation.** $27\,MHz / 115200 = 234.375$. Truncating to 234 gives an actual rate of 115 384.6 baud: error 0.16 %. Budget argument the solution must contain: a receiver samples mid-bit, so the *accumulated* drift over one 10-bit frame must stay well under half a bit. $10 \times 0.16\% = 1.6\%$ of a bit — a ~30× margin. (Frames resynchronise on every start bit, so error never accumulates beyond a frame; this is why UART tolerates integer dividers.)

**Counter sizing.** Baud counter counts to 233 → 8 bits. Pacing counter: 1 ms = 27 000 cycles → 15 bits. A frame lasts $10/115200 = 86.8\,\mu s$, so a 1 ms pace leaves ~11× idle headroom — overlap is impossible if the pacer only fires when the FSM is IDLE (require this guard; grade it by pacing faster in a stretch test).

**FSM.** Four states suffice (IDLE, START, DATA, STOP) with a 3-bit index inside DATA. Load `{1'b1, data[7:0], 1'b0}` into a 10-bit shift register at kick-off and shift LSB-out on each baud tick — collapses the FSM to a bit-counter, an elegance worth a remark in the model solution. Registered TX output only: a combinational TX invites glitches that the monitor decodes as spurious start bits.

**Simulator fit.** At the few-ms VCD cap, a 1 ms pace shows ~4–5 decoded frames — enough for the monitor to print `00 01 02 03` and prove both framing and pacing.

**Verification.** The virtual console must show consecutive incrementing bytes with no framing errors; waveform spot-checks: start-bit width 8.67 µs ± 1 clock, LSB-first order (for byte `0x01`, the first data bit after the start bit is the only high one), line idles high between frames.

---

# 8. Gray-Coded Event Counter Across Clock Domains `[FPGA]`

## Overview

A flow meter counts turbine pulses in its 27 MHz acquisition domain, but the readout logic lives in a slower bus domain. Passing the raw binary count across the boundary corrupts readings: when several bits change in one increment (7→8 flips four), the receiving domain can capture a mix of old and new bits and report a wildly wrong count. The classic cure — and a top ASIC interview topic — is to let only one bit change at a time.

## System Objective

The system must transfer a continuously incrementing count between asynchronous clock domains without ever presenting a corrupt value.

The system must:

* **Encode in Gray:** Convert the binary count so successive values differ in exactly one bit.
* **Synchronise:** Pass the Gray word through a 2-FF synchroniser in the receiving domain.
* **Decode and Prove:** Recover binary in the receiving domain; captured values may lag but must always be values the counter actually held.

## Operating Principle

1. **Count:** An 8-bit binary counter increments on qualified events in the 27 MHz domain.
2. **Convert:** Combinationally form `gray = bin ^ (bin >> 1)` and register it in the source domain.
3. **Cross:** Two cascaded flip-flops per bit in the destination domain (10 MHz testbench clock) absorb metastability.
4. **Decode:** An XOR-fold from MSB down recovers the binary value for the readout bus.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Counter Width | 8 bits, wrapping |
| Source Domain | 27 MHz |
| Destination Domain | 10 MHz (asynchronous, testbench-generated) |
| Synchroniser | 2-FF minimum per bit |
| Correctness | Every captured value ∈ actual counter history; monotonic modulo wrap |
| Event Rate Limit | State and enforce the safe maximum |

## Model Solution — Design Walkthrough

**Why binary fails, in one sentence the grader looks for.** On 7→8 (`0111`→`1000`) four bits change with unequal routing delays; a destination edge landing mid-transition captures a bitwise mixture (e.g. `1111` = 15) that the counter never held — Gray coding makes the worst-case capture *either the old or the new value*, both legitimate.

**Encoding/decoding.** Encode: `gray = bin ^ (bin >> 1)` (verify with 10110011 → 11101010). Decode is the sequential fold `bin[7] = gray[7]`, `bin[i] = bin[i+1] ^ gray[i]` — an 8-level XOR chain, fine at 10 MHz; note for faster domains it pipelines.

**Registration discipline.** The Gray value must come from a *register* in the source domain — synchronising a combinational encode invites decode glitches to be sampled. This single flip-flop is the most commonly forgotten element and should be an explicit grading point.

**Rate constraint.** The destination sees a value stream delayed by 2–3 destination cycles. Safe operation requires at most one increment per destination sample, i.e. event rate < 10 MHz/2 = 5 MHz sustained; beyond that the readout legally *skips* values (still never corrupt — worth distinguishing loss-of-granularity from corruption in the solution).

**MTBF remark.** A 2-FF synchroniser at these rates gives metastability MTBF measured in years; the sim cannot show metastability (functional simulation only, per the platform docs) — the testbench instead attacks the *logical* failure mode by sweeping destination-edge alignment across the source transition.

**Verification.** Testbench drives bursts of increments at varying phase offsets between the clocks for ≥ 10 000 source cycles. Pass: every value captured in the destination domain, decoded to binary, appears in the true count history and never decreases (modulo-256 aware); a deliberately instantiated binary-crossing reference module must fail the same check, demonstrating the defect the Gray path removes.

---

# 9. Pedestrian Crossing Controller on the Tang Nano 9K `[FPGA]`

## Overview

A single-road pedestrian crossing needs a controller: traffic normally flows on green, a button press requests a crossing phase, and the walk signal must never overlap a car green. This is the canonical FSM exercise mapped onto the simulator's real board: the six on-board LEDs become the signal heads and the auto-pulsed button is the pedestrian request. Because the simulation window is a few milliseconds, one "traffic second" is scaled to 1 ms — your timing must be parameterised, exactly as it would be for synthesis vs simulation in industry.

## System Objective

The system must implement a safe, timed pedestrian crossing sequence as a synchronous FSM.

The system must:

* **Sequence Safely:** GREEN → YELLOW → ALL-RED → WALK → FLASH → ALL-RED → GREEN, with no state where cars and pedestrians both have right of way.
* **Latch Requests:** A button pulse at any time during GREEN is remembered, but GREEN holds for its minimum time before yielding.
* **Recover from Illegal States:** Any undefined state transitions to ALL-RED on the next clock.

## Operating Principle

1. **Request Latch:** The (active-low, debounced-by-harness) button sets a request flag, cleared when WALK begins.
2. **Timed FSM:** A single timer counts scaled seconds; each state loads its own duration and advances on expiry.
3. **Display:** LED outputs decode combinationally from the state register (active-low on this board): car R/Y/G on LED[2:0], WALK on LED[3], DON'T-WALK on LED[4], heartbeat on LED[5].

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Clock | 27 MHz board oscillator |
| Scaled Second | `T_UNIT` parameter = 27 000 cycles (1 ms) in simulation |
| Durations | GREEN min 4 u, YELLOW 1 u, ALL-RED 1 u, WALK 4 u, FLASH 2 u at 2 Hz-scaled |
| Inputs | 1 push button (active low) via `.cst` |
| Outputs | 6 LEDs (active low) via `.cst` |
| Safety | WALK asserted ⟹ car green and yellow both off, in every reachable state |

## Model Solution — Design Walkthrough

**State encoding.** Six named states fit 3 bits; binary encoding with a `default: state <= ALL_RED_1` arm satisfies the illegal-state requirement (with one-hot, note that a flipped bit lands in the default arm too — a good place to discuss encoding trade-offs). Register the state; decode LEDs combinationally so they change glitch-free one clock after the state does.

**Timer sizing.** Longest interval = 4 u = 108 000 cycles at the scaled unit → a 17-bit counter minimum; 18 bits gives headroom if `T_UNIT` doubles. One shared down-counter loaded on every state entry is cleaner than per-state counters and makes the "load on entry, decrement to zero" idiom the visible skeleton of the design.

**Request latching semantics.** The flag is set by the synchronised button (the harness pulses it on a fixed schedule — design must work whether the pulse lands early or mid-green): `req <= 1` on button, `req <= 0` when entering WALK. GREEN's exit condition is `timer_done && req`; without a press, GREEN simply holds — the FSM idles safely rather than free-running.

**Flash generation.** During FLASH, gate the WALK LED with bit `timer[N]` chosen so the toggle rate is ~2 Hz scaled (with 1 ms units, bit 13 of the cycle counter toggles every ~0.3 ms — state the chosen bit and its resulting rate; exactness is not graded, visibility of the computation is).

**Safety argument.** A one-line invariant per state (WALK ⟹ `led_green` and `led_yellow` inactive) checked in the testbench for every clock of a full cycle — teaching that safety is asserted continuously, not assumed from the diagram.

**Verification.** Waveform/board timeline must show: request during GREEN honoured only after minimum green; full sequence durations 4/1/1/4/2 u (±1 clock); WALK LED toggling during FLASH; forced illegal state (testbench `force`) recovering to ALL-RED in one clock; the safety invariant never violated across ≥ 2 full cycles within the simulation cap.

---

# Batch Notes — Feasibility Findings & Recommended Improvements

**MCU bank vs. what QEMU actually models.** Per `sim_testbench.md`, stock QEMU + semihosting gives you the Cortex-M3 core, SysTick, and traced GPIO — but many bank problems (M-03 ADC+DMA, M-04/M-10 timer capture/encoder, M-07 WWDG, M-11/V-07 CAN, V-08 USB, P-09 TIM1 dead-time) lean on peripherals QEMU does not implement. Problems 4–6 show the honest pattern: core + SysTick + `trace_pin()`, with stimulus supplied as replayed data vectors. Keep the peripheral-heavy wording shelved until the xPack-fork upgrade lands, or add a "peripheral emulated by harness" note per problem.

**FPGA bank vs. the Tang Nano harness.** Bank problems quoting 100–500 MHz clocks, 10-million-cycle soak tests, or STA outcomes (C-01, C-04, SRC-07, D-14) don't fit a functional-only simulator with a few-ms VCD cap and a 27 MHz board clock. Rebase clocks on 27 MHz (Problem 7 shows the payoff: the awkward 234.375 divider *becomes* the teaching point) and use scaled-time parameters (Problem 9). Also: the harness UART model decodes FPGA *TX*; RX-into-FPGA problems (D-05 as written) need a stimulus generator added to the harness first.

**Errata spotted in the existing exemplar file (`scope-io-problems`).**

- *Power-of-Two Clippings*: the "System Objective" section appears twice, and "Determine the value  using digital methods" has a dropped formula — presumably $2^{\lfloor \log_2 N \rfloor}$.
- *Ultrasonic sensor*: "Maximum measurable distance is 25.5mm" is inconsistent with an 8-bit output and the 100 kHz clock — 10 µs resolution × 340 m/s ÷ 2 ≈ 1.7 mm/count, giving ~434 mm at 255 counts; 25.5 **cm** (1 mm/count) was likely intended. Also, the real HC-SR04 bursts at 40 kHz, not 20 kHz, and $v_{sound} = 340\,m$ is missing $/s$.
- Consider adding to every problem the two blocks used here: **Model Solution — Design Walkthrough** and explicit **Verification** pass criteria. Your netlist testbenches show *a* solution; the walkthrough states *why* its values are right, which is what interview prep actually trains.

**Style choices made in this batch, for your review.** Kept: your section order, "The system must:" bullet grammar, spec tables with inline LaTeX, application-first overviews, SA-mains flavour where natural. Added: a one-line "trap" or hook at the end of each Overview, and quantified pass criteria in every Verification block — both easy to drop if you want strict parity with the current exemplars.

---

## Batch 2 (Problems 10–26)

| # | Simulator | Title | Source |
| --- | --- | --- | --- |
| 10 | CircuitJS | Boost Converter for a Solar Micro-Storage System | Bank P-02 (rebased — see notes) |
| 11 | CircuitJS | Dead-Time Design for an ROV Thruster H-Bridge | Bank P-05 |
| 12 | CircuitJS | Zero-Crossing Detector for a TRIAC Lamp Dimmer | Bank A-04 |
| 13 | CircuitJS | Instrumentation Amplifier for a Postal Scale | Bank A-02 |
| 14 | CircuitJS | Charge-Pump Negative Rail for a Portable Scope Probe | Bank V-06 |
| 15 | CircuitJS | Impedance Discontinuity on a USB 3.0 Trace | Bank S-01 + Community Sources 25–27 |
| 16 | MCU | NMEA Ring-Buffer Parser for a Fleet Tracker | Bank M-02 (adapted for QEMU) |
| 17 | MCU | CRC-16 Framing for a Zigbee Sensor Link | Bank SRC-02 |
| 18 | MCU | Fault-Detecting Quadrature Decoder | Bank M-10 / N-03 (adapted for QEMU) |
| 19 | MCU | Li-ion Fuel Gauge with OCV Table | Bank P-08 (adapted for QEMU) |
| 20 | MCU | Two-Task Round-Robin Scheduler with PendSV | Community Source 5 (mini-arm-os) |
| 21 | FPGA | Synchronous FIFO with Early-Full Margin | Bank D-02 |
| 22 | FPGA | Interrupt Priority Arbiter | Bank D-04 |
| 23 | FPGA | Streaming CRC-32 Engine | Bank D-08 |
| 24 | FPGA | SPI Flash JEDEC-ID Reader on Real Board Flash | Bank D-06 (rebased onto harness W25Q32) |
| 25 | FPGA | CORDIC Sine/Cosine Generator | Bank V-04 |
| 26 | FPGA | BRAM-Inferred QAM-64 Symbol Mapper | Bank D-11 |

---

# 10. Boost Converter for a Solar Micro-Storage System `[CJS]`

## Overview

A balcony solar kit charges a small 72 V battery stack through a boost converter fed by one PV panel whose voltage swings 18–36 V with irradiance and temperature. The original interview framing of this problem asks for 400 V from the same panel — run the duty-cycle numbers and you will find that spec is unbuildable in a single stage (see batch notes); this version keeps the real engineering and drops the fiction. Size the boost stage, then find the one property of boost converters that quietly limits how fast your control loop may be.

## System Objective

The system must boost a variable panel voltage to a regulated 72 V bus at 150 W across the full input range.

The system must:

* **Hold Regulation:** 72 V ± 2 % for any input from 18 to 36 V.
* **Stay in Safe Duty Range:** $D \le 0.8$ at minimum input, with margin justified.
* **Respect Component Stress:** Select inductor current rating and switch/diode voltage rating with stated margins.

## Operating Principle

1. **Energise:** With the switch on, the inductor charges from the panel; the output capacitor alone feeds the load.
2. **Transfer:** With the switch off, inductor current commutates through the diode, delivering energy to the bus at $V_{out} > V_{in}$.
3. **Regulate:** Feedback adjusts $D = 1 - V_{in}/V_{out}$ as the panel voltage moves.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Input Source | PV panel, 18–36 V (28 V nominal) |
| Output | 72 V ± 2 %, 150 W |
| Switching Frequency | $f_{sw} = 100\,kHz$ |
| Inductor Ripple | $\Delta I_L \le 1\,A$ |
| Output Ripple | ≤ 1 % (720 mV) |
| Duty Limit | $D \le 0.8$ at $V_{in,min}$ |

## Model Solution — Design Walkthrough

**Duty range.** $D = 1 - V_{in}/V_{out}$: 0.75 at 18 V, 0.61 at 28 V, 0.50 at 36 V. Maximum 0.75 meets the ≤ 0.8 limit — the margin matters because real boosts lose gain to parasitics as $D \to 1$ (the effective limit behind the batch-notes errata).

**Inductor.** Boost ripple is $\Delta I_L = \dfrac{V_{in} D}{L f_{sw}}$, worst at maximum $V_{in}D$ product — here 36 V × 0.50 = 18 V·s-equivalent vs 18 V × 0.75 = 13.5, so worst case is at 36 V. Solving for 1 A gives $L = 180\,\mu H$ → **220 µH** standard, yielding 818 mA at 36 V and 614 mA at 18 V. Current rating: input current at minimum voltage is $150/18 = 8.33\,A$ average, 8.64 A peak with ripple — specify a 10 A-class inductor (≥ 15 % saturation margin).

**Switch and diode stress.** Both see $V_{out}$ (plus ringing) when off: 72 V nominal → 100 V rated MOSFET and Schottky (1.4× margin). A grading question worth embedding: why does the *switch* current rating follow the *input* current in a boost (unlike the buck)?

**Output capacitor.** During the on-time the load is carried entirely by the capacitor: $C \ge \dfrac{I_o D_{max}}{f_{sw} \Delta V} = \dfrac{2.08 \times 0.75}{10^5 \times 0.72} \approx 22\,\mu F$ → **47 µF** with ESR low enough that ESR ripple ($\Delta I \cdot ESR$) stays inside budget.

**The quiet limiter — right-half-plane zero.** At $D = 0.75$, $f_{RHPZ} = \dfrac{R(1-D)^2}{2\pi L} = \dfrac{34.6 \times 0.0625}{2\pi \times 220\,\mu H} \approx 1.6\,kHz$: a step-up in duty momentarily *reduces* output current before increasing it. Loop crossover must sit ~3× below this (≈ 500 Hz), so this converter is deliberately slow — the model solution should state this, since "make the loop faster" is the trap answer to any sluggish-response follow-up.

**Verification.** Sweep the source 18 → 36 V slowly: bus stays within ±2 %. Scope inductor current at 36 V: ripple ≤ 1 A, CCM maintained at full load. Step the load 50 % → 100 %: recovery without instability, and observe the initial wrong-way dip that evidences the RHP zero. Confirm peak switch voltage ≤ 80 V before snubbing.

---

# 11. Dead-Time Design for an ROV Thruster H-Bridge `[CJS]`

## Overview

An underwater ROV reverses its 12 V thruster through an H-bridge. Commanded naively — high-side off and low-side on in the same instant — both transistors in one leg conduct simultaneously for the few hundred nanoseconds their gate transitions overlap, shorting the battery through two on-resistances. The FETs survive the demo bench and die at sea. Your task: make shoot-through visible, then make it impossible, without letting the motor current become discontinuous during reversal.

## System Objective

The system must drive an H-bridge with complementary PWM whose dead-time eliminates cross-conduction.

The system must:

* **Demonstrate the Fault:** With zero dead-time, capture the supply-current spike during switching transitions.
* **Insert Dead-Time:** Generate complementary gate signals separated by an adjustable gap on both edges.
* **Preserve Drive Quality:** Motor current remains continuous (freewheeling through body diodes) and reversal completes within 20 ms.

## Operating Principle

1. **Modulate:** A 20 kHz PWM signal and its complement drive the two switches of each leg.
2. **Delay Selectively:** Each gate signal's *turn-on* edge is delayed by $t_d$ while turn-off propagates immediately (RC + diode + Schmitt buffer per gate).
3. **Freewheel:** During dead-time, inductive motor current flows through the body diode of the incoming switch until it takes over.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Supply / Motor | 12 V, brushed DC (model: $1\,\Omega$ + $500\,\mu H$ + back-EMF) |
| PWM | 20 kHz, complementary per leg |
| Switch Model | $R_{DS(on)} = 50\,m\Omega$ |
| Gate Transition Time | ~200 ns |
| Dead-Time | Adjustable 0–1 µs; find the minimum safe value |
| Reversal | Full reverse within 20 ms |

## Model Solution — Design Walkthrough

**Scale of the fault.** During overlap the leg is a 12 V source across $2 \times R_{DS(on)} = 100\,m\Omega$: a 120 A spike, twice per PWM cycle, 40 000 times per second. Even when nothing explodes, the wasted charge per edge ($\approx I_{spike} \times t_{overlap}$) shows up as supply-current spikes and heat — measurable in the sim as the difference between supply power and motor power.

**Dead-time generator.** Per gate: series R into the gate node with a parallel diode (fast discharge), then a Schmitt buffer. Rising edges charge through R (delayed turn-*on*, $t_d \approx 0.7RC$); falling edges bypass through the diode (immediate turn-*off*). $R = 1\,k\Omega$, $C = 680\,pF$ gives ≈ 476 ns. Minimum safe value: dead-time must exceed the worst-case turn-off/turn-on overlap ≈ gate transition time plus margin → with 200 ns transitions, ≈ 300 ns is the floor; 500 ns is the recommended answer, and 0–250 ns should still show a (shrinking) spike in simulation.

**Why the motor doesn't care.** The motor's electrical time constant $L/R = 500\,\mu s$ dwarfs a 500 ns gap; current continues through the incoming FET's body diode, dropping ~0.7 V for half a microsecond — visible as a small notch on the switching-node voltage (a nice thing to ask learners to identify). Excessive dead-time is also penalised: diode conduction loss grows and effective duty erodes, so "maximum dead-time" is wrong too — the graded answer is a bounded window.

**Reversal.** Ramping duty through zero into the opposite pair (or hard-swapping pairs with the motor current allowed to decay) both complete well inside 20 ms given $\tau_{elec} = 0.5\,ms$ and a mechanical constant far above it; require learners to show motor current passes through zero smoothly, without discontinuity artifacts.

**Verification.** Scope 1 — supply current: with $t_d = 0$, spikes ≥ 10× motor current at every transition; with $t_d = 500\,ns$, spikes gone. Scope 2 — switching node: body-diode notch visible during dead-time. Scope 3 — motor current: continuous through a commanded reversal, settled in reverse within 20 ms. Report the minimum $t_d$ (to the nearest 100 ns) at which spikes vanish.

---

# 12. Zero-Crossing Detector for a TRIAC Lamp Dimmer `[CJS]`

## Overview

A phase-cut dimmer fires its TRIAC at a fixed delay after each mains zero crossing — so every timing decision in the product hangs off one comparator watching 230 V mains (South African standard, 50 Hz). A bare comparator produces a burst of edges at each crossing because millivolts of noise re-cross the threshold repeatedly, and the lamp flickers. Hysteresis fixes it, but hysteresis moves the detection point away from the true zero: the design question is how much you can afford.

## System Objective

The system must produce exactly one clean logic edge per mains half-cycle, timed within 2° of the true zero crossing.

The system must:

* **Attenuate Safely:** Divide the 325 V peak mains to a comparator-safe level.
* **Reject Noise:** Tolerate ±5 V (referred to mains) of superimposed noise with no spurious edges.
* **Bound the Error:** Keep the detection offset below 2 electrical degrees.

## Operating Principle

1. **Divide:** A high-ratio resistive divider scales the mains to ±10 V region for the comparator input.
2. **Compare with Hysteresis:** Positive feedback around the comparator creates two thresholds; noise inside the band cannot re-trigger.
3. **Time:** Downstream logic (the TRIAC firing delay) launches from the output edge.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Input | 230 V RMS, 50 Hz (325 V peak) |
| Noise | ±5 V superimposed, referred to mains |
| Hysteresis Band | ±8 V referred to mains |
| Timing Error | ≤ 2° of the 50 Hz cycle |
| Output | Clean logic edge, one per half-cycle |

## Model Solution — Design Walkthrough

**Divider.** 320 kΩ : 10 kΩ scales 325 V peak to 9.9 V — comfortable for a ±15 V comparator and keeps divider dissipation ≈ $\left(230\,V\right)^2/330\,k\Omega \approx 160\,mW$. (Isolation is deliberately out of scope here; note it as the difference between a problem and a product.)

**Hysteresis sizing — the core trade-off.** Referred to mains, thresholds of ±8 V beat the ±5 V noise with 3 V of margin. Everything referred to mains must map through the divider: ±8 V at mains is ±8 × 10/330 = ±0.24 V at the comparator input. Set the positive feedback for that: $V_{th} = V_{sat}\frac{R_1}{R_1+R_2}$ with $V_{sat} = 15\,V$ gives $R_1 = 10\,k\Omega$, $R_2 = 590\,k\Omega$. The classic mistake — sizing the band as "8 V" *at the comparator* — makes the thresholds ±264 V referred to mains, and the detector never fires; the testbench catches this as a silent output.

**Timing error — the number that decides pass/fail.** The comparator flips when the sine reaches the threshold, not zero: $\theta = \arcsin(8/325) = 1.41°$ — inside the 2° spec, equivalent to 78 µs at 50 Hz. The lesson to state: hysteresis buys noise immunity *linearly* in threshold but costs timing error only as $\arcsin$, so at small angles you can be generous; the spec breaks only past $\pm 11.3\,V$ ($\arcsin^{-1}(2°) \times 325$).

**Symmetry note.** Rising and falling detections offset in opposite directions; a firing controller that measures delay from *both* edges self-cancels the average error — worth a sentence in the solution as the systems-level view.

**Verification.** Drive 325 V peak 50 Hz plus a 2 kHz, ±5 V additive noise source. Pass: exactly 100 output edges per second (count over 100 ms of sim time), each within 111 µs (2°) of true zero; with hysteresis removed (feedback opened), the same noise must produce multiple edges per crossing — demonstrating the defect being solved.

---

# 13. Instrumentation Amplifier for a Postal Scale `[CJS]`

## Overview

A postal scale's four 350 Ω strain gauges form a Wheatstone bridge that outputs just 5 mV at full load — riding on a 2.5 V common mode, with 100 mV of 50 Hz mains pickup on the leads. A plain difference amplifier at gain 500 works on the bench and fails in the field: its common-mode rejection rests entirely on four resistors matching. The three-op-amp instrumentation amplifier exists precisely to break that dependency, and this problem makes you derive why.

## System Objective

The system must amplify a 5 mV differential bridge signal to 2.5 V while rejecting common-mode interference by at least 80 dB.

The system must:

* **Amplify Differentially:** Gain 500 ± 1 %, input impedance high enough not to load the 350 Ω bridge.
* **Reject Common Mode:** ≥ 80 dB CMRR; the 100 mV, 50 Hz lead pickup must appear at the output below 1 mV.
* **Split the Gain Deliberately:** Justify the distribution of gain between input stage and subtractor.

## Operating Principle

1. **Buffer and Gain:** Two input op-amps share a gain-set resistor $R_g$; differential signals see gain $1 + 2R_f/R_g$, common-mode signals see exactly unity.
2. **Subtract:** A four-resistor difference stage removes the common mode and adds its own modest gain.
3. **Reference:** The subtractor's reference node sets the output's zero point (mid-rail for a unipolar ADC).

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Bridge | 4 × 350 Ω, 5 V excitation, 5 mV FS differential |
| Common Mode | 2.5 V DC + 100 mV pp @ 50 Hz |
| Total Gain | 500 (→ 2.5 V FS) |
| CMRR | ≥ 80 dB overall |
| Resistor Tolerance | 0.1 % (subtractor) |
| Output Residue | 50 Hz tone < 1 mV at output |

## Model Solution — Design Walkthrough

**The structural insight being graded.** In the input pair, both op-amp outputs move together for common-mode inputs (no current flows in $R_g$), so CM gain = 1 while differential gain = $1 + 2R_f/R_g$. Every decibel of first-stage differential gain is a decibel added to the subtractor's matching-limited CMRR *for free*.

**Gain distribution.** Subtractor worst-case CMRR with 0.1 % resistors is $\approx (1+A_d)/4t \approx 54\,dB$ at $A_d = 1$. Splitting 500 as $G_1 = 100$ ($R_f = 49.5\,k\Omega$, $R_g = 1\,k\Omega$), $G_2 = 5$ adds 40 dB → ≈ 94 dB total: the 100 mV pickup lands at $0.1 \times 500 / 10^{94/20} \approx 1.0\,mV$ — passing, but with no margin in the worst-case corner. The refinement worth full marks: push more gain forward, $G_1 = 250$, $G_2 = 2$ → ≈ 102 dB and a residue near 0.4 mV. The anti-pattern (gain in the subtractor, $G_1 = 5$, $G_2 = 100$) fails by ~26 dB and should be exhibited in the solution as the contrast case.

**Loading check.** Op-amp inputs (not resistor dividers) face the bridge, so input impedance is essentially infinite against 350 Ω — state this as the second structural advantage over the plain difference amp, whose input resistors load the bridge asymmetrically.

**Offset budget (one line).** At gain 500, every millivolt of input offset is half a volt at the output — motivates either an op-amp with sub-100 µV offset or an output high-pass/auto-zero strategy; scale firmware typically tares it digitally.

**Verification.** Apply 5 mV differential: output 2.500 V ± 1 %. Zero the differential input and drive the CM node with 100 mV pp at 50 Hz: output tone < 1 mV (measure with the scope's spectrum view). Repeat with one subtractor resistor skewed +0.1 %: the gain-forward design still passes, the gain-in-subtractor variant visibly fails.

---

# 14. Charge-Pump Negative Rail for a Portable Scope Probe `[CJS]`

## Overview

A battery-powered oscilloscope probe needs ±5 V for its front-end op-amp, but the whole product runs from a single 5 V USB cell. Shipping an inductive converter for a 20 mA negative rail is overkill: two capacitors and four switches make one instead. The catch is that a charge pump's "regulation" is an illusion of low output resistance — and that resistance is set entirely by how big a flying capacitor you ship and how fast you toggle it.

## System Objective

The system must invert +5 V to a −5 V rail delivering 20 mA within tolerance.

The system must:

* **Invert:** Generate −5 V nominal from +5 V using a two-phase switched-capacitor inverter at 100 kHz.
* **Hold Under Load:** Stay above −4.75 V (≤ 5 % droop) at 20 mA.
* **Limit Ripple:** ≤ 100 mV pp at the output reservoir.

## Operating Principle

1. **Phase A:** The flying capacitor charges to +5 V across the input.
2. **Phase B:** The flying capacitor is flipped across the output reservoir, transferring charge at inverted polarity.
3. **Repeat:** Non-overlapping 100 kHz clocking alternates phases; the reservoir integrates the transfers into a DC rail.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Input | +5 V |
| Output | −5 V nominal, ≥ −4.75 V at 20 mA |
| Load | 20 mA continuous |
| Switching | 100 kHz, two-phase, non-overlapping |
| Ripple | ≤ 100 mV pp |

## Model Solution — Design Walkthrough

**The governing model.** An ideal switched-capacitor inverter behaves as −5 V behind an effective output resistance $R_{out} \approx \dfrac{1}{f_{sw} C_{fly}}$ — charge transferred per cycle is $C_{fly}\Delta V$, so current capability scales with $f_{sw} C_{fly}$. This single equation is the problem's centre of gravity.

**Sizing the flying capacitor.** Droop budget 250 mV at 20 mA → $R_{out} \le 12.5\,\Omega$ → $C_{fly} \ge \dfrac{1}{10^5 \times 12.5} = 0.8\,\mu F$ → **1 µF**, giving $R_{out} = 10\,\Omega$ and 200 mV droop (−4.8 V, 4 %). Switch on-resistance adds directly; keep total switch resistance ≪ 10 Ω or fold it into the budget.

**Sizing the reservoir.** Between transfers the load discharges the reservoir: $\Delta V = \dfrac{I_{load}}{f_{sw} C_{res}}$ → 4.7 µF gives 43 mV pp, half the budget. Note the asymmetry for the write-up: $C_{fly}$ sets *droop* (a DC quantity), $C_{res}$ sets *ripple* (an AC quantity) — learners conflate them.

**Non-overlap matters.** If both switch pairs conduct simultaneously even briefly, the input rail is shorted to the output — the charge-pump equivalent of Problem 11's shoot-through. Generate the two phases with a cross-coupled delay (or two phase-shifted sources) and show the input current spike when overlap is forced.

**Why this beats a linear solution.** There is no linear way to make a negative rail from a positive-only source — worth one sentence, since "use an LDO" is a reflex wrong answer here.

**Verification.** At 20 mA: mean output between −4.75 V and −5.0 V; ripple ≤ 100 mV pp; step the load 5 → 20 mA and confirm the new mean follows the $R_{out}$ model within 10 %. Report measured $R_{out}$ = ΔV/ΔI and compare to $1/(f_{sw}C_{fly})$.

---

# 15. Impedance Discontinuity on a USB 3.0 Trace `[CJS]`

## Overview

An industrial camera's USB 3.0 link fails compliance at the full 5 Gbps rate. A TDR scan of the board traces the fault to a via whose unbacked stub and interrupted return plane create a short section of ~65 Ω in an otherwise 45 Ω channel — a real failure mode that senior designers name among the top causes of first-spin board failures. You will reproduce the reflection in simulation, quantify it, and show why shrinking the mismatch (not eliminating the via) is what closes the eye.

## System Objective

The system must model a three-segment transmission-line channel and quantify the reflection from the impedance bump.

The system must:

* **Model the Channel:** 45 Ω line → short 65 Ω discontinuity → 45 Ω line, source- and load-terminated.
* **Measure the Reflection:** Extract the reflection coefficient from the launched and returned step amplitudes.
* **Mitigate:** Reduce the effective bump below 50 Ω and verify the residual reflection.

## Operating Principle

1. **Launch:** A fast step from a 45 Ω source enters the first line segment.
2. **Reflect:** At the 45→65 Ω boundary a fraction $\Gamma$ of the incident wave returns; the complementary event occurs at 65→45 Ω.
3. **Compensate:** Shunt capacitance added at the discontinuity lowers the local $\sqrt{L/C}$, shrinking the bump.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Nominal Impedance | 45 Ω (source- and load-matched) |
| Discontinuity | 65 Ω section, ~20 ps electrical length (≈ 3 mm) |
| Signalling | 5 Gbps (200 ps bit period); step rise ≪ bit period |
| Reflection Metric | $\Gamma$ from waveform amplitudes |
| Mitigation Target | Residual reflection < 5 % of incident |

## Model Solution — Design Walkthrough

**The number first.** $\Gamma = \dfrac{Z_2 - Z_1}{Z_2 + Z_1} = \dfrac{65-45}{110} = 0.182$: 18 % of the incident amplitude returns toward the source, and the same magnitude (negative sign) reflects again leaving the bump. With matched terminations there are no secondary bounces to confuse the measurement — which is exactly why the problem specifies them.

**Why a 3 mm bump matters at 5 Gbps but not at USB 2.0 speeds.** The bump's round-trip time is ~40 ps. Against a 200 ps bit, the reflection lands within the same bit and its neighbour, eating directly into the eye; against USB 2.0's 2.08 ns bit it is invisible. This is the community-sourced teaching point that "high-speed" is about *edge rate versus structure size*, not clock rate — say it with these two numbers.

**Short-discontinuity subtlety.** Because 20 ps ≪ the edge, the bump acts more like a lumped excess inductance than a fully formed 65  Ω section; the measured reflection will be a derivative-shaped blip somewhat below the full 18 % — learners should report both the ideal Γ and the observed peak, and explain the gap.

**Mitigation.** The bump reads high-Z (inductive), so add shunt C at its ends: lowering local $Z = \sqrt{L/C}$ toward 45 Ω. In-sim: a small capacitor each side of the 65 Ω segment, tuned until the reflected blip < 5 % of incident (residual Γ for a corrected 50 Ω section would be 0.053 — a good target to quote). Overshooting C flips the bump capacitive and the blip inverts: require learners to show the inverted case once, since recognising over-compensation on a TDR trace is the practical skill.

**Verification.** Measure at the source-side probe: incident step amplitude $V_i$, reflected blip $V_r$; report $\Gamma_{meas} = V_r/V_i$ ≈ 0.15–0.18 uncompensated. After compensation: $V_r/V_i < 0.05$ and no inverted overshoot. Bonus check: double the discontinuity length and show $V_r$ grows toward the ideal 18 % as the bump becomes electrically "long".

---

# 16. NMEA Ring-Buffer Parser for a Fleet Tracker `[MCU]`

## Overview

A vehicle tracker receives NMEA-0183 sentences from its GPS at 9600 baud — up to 82 bytes each, arriving whenever the module feels like it — while the main loop is busy with other work. Blocking reads lose bytes; parsing inside the receive interrupt bloats it. The industry-standard answer is a ring buffer between a minimal ISR and a main-loop parser, and this problem grades both halves. Bytes are replayed by the harness one per tick, which at a 1 kHz tick closely matches real 9600 baud pacing (1.04 ms per byte).

## System Objective

The system must decouple byte reception from sentence parsing via a ring buffer, then extract and validate position fixes.

The system must:

* **Receive Minimally:** The 1 kHz tick ISR does one thing — push the next replayed byte into a 256-byte ring buffer.
* **Parse Asynchronously:** The main loop drains the ring, assembles `$GPRMC` sentences delimited by `\r\n`, and verifies the NMEA checksum.
* **Extract Fields:** Parse latitude and longitude from valid sentences; reject any sentence whose checksum fails.

## Operating Principle

1. **Produce:** ISR writes `buf[head++ & 0xFF]`, sets an overflow flag if head catches tail.
2. **Consume:** Main loop reads while `tail != head`, feeding a byte-at-a-time sentence assembler FSM (hunt `$` → accumulate → terminate on `\n`).
3. **Validate:** XOR of all bytes between `$` and `*` must equal the two hex digits following `*`; only then are fields split on commas.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Byte Source | Harness-replayed vector, 1 byte/ms (≈ 9600 baud pacing) |
| Ring Buffer | 256 bytes, power-of-two indexing, single producer / single consumer |
| Sentences | 20 replayed, mixed types; parse `$GPRMC` only; one deliberately corrupted |
| Checksum | NMEA XOR, mandatory |
| Observability | `trace_pin()` pulses: FIX_OK per valid fix, CKSUM_ERR per rejection |

## Model Solution — Design Walkthrough

**Ring mechanics.** A 256-entry ring with `uint8_t` head/tail indices needs *no masking at all* — 8-bit arithmetic wraps for free, and with one producer and one consumer, head is written only by the ISR and tail only by main, so no critical section is needed as long as each index is a single-byte (naturally atomic) write. Getting this lock-freedom argument right, and stating *why* it collapses if either index grows past one byte or a second consumer appears, is the heart of the grade — it connects directly back to Problem 6.

**Fill-level safety.** Worst case between main-loop visits must stay under 256 bytes: at 1 byte/ms that is 256 ms of tolerated main-loop absence — state the number and the consequence (overflow flag, sentence loss, but never corruption).

**Sentence FSM.** Three states (HUNT, ACCUM, CKSUM) with an 82-byte cap on ACCUM (the NMEA maximum): a missing terminator must not wedge the parser — the cap forces a reset to HUNT. The corrupted replay sentence exercises exactly this plus the checksum reject path.

**Checksum before trust.** XOR from after `$` to before `*`, compared against the two ASCII-hex digits. Parsing fields before validating is an automatic fail in review terms; the walkthrough should show the tempting-but-wrong ordering and its consequence (acting on a garbled coordinate).

**Field extraction.** `$GPRMC,hhmmss,A,lat,N,lon,E,...` — split on commas *in place* (replace with NUL, record token starts): no `strtok`, no heap. Convert `ddmm.mmmm` to degrees only if the validity field is `A`.

**Verification.** Replay: 20 sentences (8 × `$GPRMC`, one corrupted). Pass: exactly 7 FIX_OK pulses and 1 CKSUM_ERR pulse on the trace timeline; no overflow flag; parsed coordinates of the last valid fix reported via semihosting match the vector's known values to 4 decimal places.

---

# 17. CRC-16 Framing for a Zigbee Sensor Link `[MCU]`

## Overview

A wireless sensor sends 9-byte readings through a radio that will happily deliver corrupted bytes with a straight face. Analog thinking says raise the SNR; digital thinking says frame the payload and let arithmetic catch the lies. You will implement CRC-16/CCITT-FALSE framing and prove — not assume — that every single-bit corruption the harness injects is caught. The follow-up question every interviewer asks is *which* errors a 16-bit CRC can miss, and your solution must answer it.

## System Objective

The system must frame sensor payloads with a CRC-16 and detect all injected single-bit errors.

The system must:

* **Compute CRC-16/CCITT-FALSE:** Polynomial $x^{16}+x^{12}+x^5+1$ (0x1021), init 0xFFFF, over the 9-byte payload.
* **Frame:** Preamble (0x55 0x55), SFD (0x7E), length, payload, CRC-hi, CRC-lo.
* **Self-Check:** Re-verify each frame after harness corruption; trace ACCEPT or REJECT per frame.

## Operating Principle

1. **Build:** Assemble the frame around each replayed payload and append the CRC.
2. **Corrupt:** The harness flips one random bit somewhere in length/payload/CRC of each transmitted frame's copy.
3. **Verify:** The receive path recomputes the CRC over the corrupted copy; mismatch → REJECT pulse.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| CRC | CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no final XOR |
| Known-Answer Test | CRC("123456789") = 0x29B1 required at boot |
| Payload | 9 bytes, 50 frames replayed |
| Detection | 100 % of single-bit errors REJECTed |
| Implementation | Both bitwise and 256-entry table versions; report the trade |

## Model Solution — Design Walkthrough

**Anchor on the known-answer test.** The CRC world is a minefield of parameter mix-ups (reflection, init, final XOR — "CCITT" alone is ambiguous). Booting with `CRC("123456789") == 0x29B1` pins the exact variant before any protocol work; a solution without a KAT is wrong even when it works.

**Bitwise core.** Per byte: XOR into the CRC's high byte, then 8 iterations of shift-left-and-conditionally-XOR-0x1021. ~8 × 4 instructions per byte — fine at 50 frames/s, and the version to write first because it *is* the polynomial-division definition.

**Table version and the trade.** Precompute 256 half-words (512 bytes of flash) at boot from the bitwise core; per byte the update collapses to one lookup + shift + XOR (~16× fewer cycles). The graded sentence: table trades 512 B of flash for ~16× speed, and generating the table *from* the bitwise core at boot means one canonical implementation, not two to keep in sync.

**Why single-bit detection is guaranteed.** A single-bit error adds $x^k$ to the codeword polynomial; the generator has more than one term, so it cannot divide $x^k$ — detection is structural, not probabilistic. Contrast: any error pattern that *is* a multiple of the generator (fraction ≈ $2^{-16}$ of random multi-bit patterns) passes undetected — this is the interviewer's follow-up, answered with the burst guarantee (all bursts ≤ 16 bits caught).

**Framing discipline.** Length byte before payload lets the receiver bound its reads; corrupting *length* is the sneaky case — the receiver must CRC exactly the bytes the length claims and reject on mismatch rather than over-read. The harness includes this case.

**Verification.** Boot KAT passes (traced once). 50 frames, each corrupted with one random bit flip: 50 REJECT pulses, 0 ACCEPT. A parallel run with no corruption: 50 ACCEPT, 0 REJECT. Bitwise and table versions produce byte-identical frames (harness compares).

---

# 18. Fault-Detecting Quadrature Decoder `[MCU]`

## Overview

A robot arm joint reports position through a quadrature encoder — two square waves, A and B, 90° apart, 4096 pulses per revolution. Decoded in software, every edge is worth counting, direction lives in the phase relationship, and a skipped state is not noise: it is evidence of a failing encoder disc that a safety-rated system must report, not paper over. QEMU has no encoder peripheral, so the harness replays sampled A/B vectors — which is precisely how you would unit-test this state machine in production firmware anyway.

## System Objective

The system must decode replayed quadrature samples into a signed position and flag illegal transitions.

The system must:

* **Decode ×4:** Count every valid transition of the AB pair (16 384 counts/rev), signed by direction.
* **Accumulate Safely:** Maintain a 32-bit signed position from a 16-bit-style rolling counter without losing counts at wrap.
* **Detect Faults:** Any double-step transition (e.g. `00 → 11`) sets a latched fault flag and pulses the FAULT trace pin.

## Operating Principle

1. **Sample:** The 10 kHz tick ISR reads the next AB pair from the replay vector.
2. **Classify:** The (previous, current) state pair indexes a 16-entry table: +1, −1, 0 (no change), or FAULT (both bits flipped).
3. **Accumulate:** Valid steps update the position; a fault latches the flag and freezes further accumulation until cleared.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Encoder | 4096 PPR, ×4 decoding = 16 384 counts/rev |
| Sampling | 10 kHz replay tick |
| Speed Limit | ≤ 1 transition per sample → max ≈ 37 RPM at this rate (state it) |
| Position | 32-bit signed accumulator |
| Fault | `00↔11` or `01↔10` jumps; latched, traced |

## Model Solution — Design Walkthrough

**The 16-entry truth table is the design.** Old state (2 bits) × new state (2 bits) → 16 cases: 4 are "no movement", 4 are +1 (Gray-legal clockwise), 4 are −1, and 4 are double-flips — physically impossible for a healthy encoder because A and B are 90° apart and cannot change together. Encoding the whole decoder as `lookup[(old<<2)|new]` makes the ISR branch-free and the safety property auditable by reading 16 table entries — the auditability point is worth stating explicitly for a robotics context.

**Why sampling rate is a safety parameter.** Between two 10 kHz samples the encoder must move at most one state, or legal motion *aliases into* the double-flip pattern: max speed = $\frac{10\,kHz}{16\,384} \approx 0.61$ rev/s ≈ 37 RPM. The graded insight: a FAULT can therefore mean *either* a broken disc *or* overspeed, and firmware cannot tell them apart from AB alone — the spec must pin the operating envelope (or the sample rate must be raised: 50 kHz → 183 RPM).

**Wrap-safe accumulation.** Keep the rolling counter and the 32-bit position in the same signed arithmetic: `pos += (int8_t)step` per sample; there is no wrap hazard when accumulating ±1 steps directly. The hazard the problem actually tests appears if a learner buffers a 16-bit counter and differences it periodically — then the difference must be sign-extended modulo 2¹⁶ (`(int16_t)(now - last)`), and the replay includes a wrap crossing to catch naive subtraction.

**Fault semantics.** Latch, freeze, require explicit clear: a position that silently resumes after a disc fault is worse than no position. Trace FAULT once on entry, not per sample (log hygiene, as in Problem 5).

**Verification.** Replay contains: a clean forward ramp (position must read +N), reverse (−N back to a known value), a 16-bit-style wrap crossing, and one injected `00→11`. Pass: final position matches the vector's ground truth exactly before the fault sample; FAULT pulses exactly once; position frozen afterwards; the sign-extension case yields no spurious jumps.

---

# 19. Li-ion Fuel Gauge with OCV Table `[MCU]`

## Overview

A battery-powered sensor node must report its remaining charge without a coulomb counter — just the cell voltage through a divider into the ADC. Open-circuit voltage maps to state of charge, but the map is treacherous: steep and generous at the extremes, nearly flat through the middle where the cell spends most of its life. Whether your gauge is honest to ±3 % is decided by arithmetic resolution and averaging, and this problem makes you budget both before you write a line of the table. ADC readings are replayed by the harness as a slow discharge curve.

## System Objective

The system must convert replayed ADC readings into a state-of-charge percentage within ±3 % of ground truth.

The system must:

* **Condition Readings:** Average 16 consecutive samples to suppress injected noise.
* **Linearise:** Map averaged counts through a piecewise-linear OCV→SoC table for LiCoO₂ with interpolation.
* **Report:** Emit the SoC estimate each second via semihosting, monotonically non-increasing over the discharge.

## Operating Principle

1. **Sample:** The tick ISR collects replayed 12-bit counts (cell voltage through a 2:1 divider, 3.3 V reference).
2. **Average:** A 16-sample accumulator yields one filtered reading per reporting period.
3. **Interpolate:** Binary-search the table bracket, then linear-interpolate between entries for fractional SoC.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Cell Range | 3.00–4.20 V (divider ÷2 → 1.50–2.10 V at ADC) |
| ADC | 12-bit, 3.3 V reference (counts 1861–2606 across range) |
| Averaging | 16 samples (noise ÷4) |
| Table | ≥ 10 breakpoints, LiCoO₂ OCV curve |
| Accuracy | ±3 % SoC across replayed discharge |
| Arithmetic | Integer only — justify the scaling |

## Model Solution — Design Walkthrough

**Resolution budget first — the make-or-break calculation.** One ADC LSB is $3.3/4096 = 0.806\,mV$, which is $1.61\,mV$ at the cell after the ÷2 divider. In the flat mid-region the OCV curve moves only ~3 mV per 1 % SoC, so raw quantisation is already ≈ 0.5 % SoC per LSB — workable, but injected noise of a few LSB would blow the ±3 % budget without the 16-sample average (noise ÷ √16 = 4). Writing this paragraph *before* the table is what the problem is designed to teach; a solution that jumps straight to the table has missed it.

**Table and interpolation.** Store breakpoints as (counts, SoC×10) pairs — pre-converting voltages to ADC counts at build time removes all runtime floating point. Dense breakpoints through the flat region (3.74–3.87 V) and sparse at the steep ends is the right allocation: error from linearisation is largest where curvature × segment width is largest. Binary search (table is sorted) then interpolate in integer: `soc = s0 + (s1-s0)*(c-c0)/(c1-c0)`, with the multiply before the divide to preserve precision — order stated explicitly, since reversing it truncates to garbage.

**Divider correctness.** 100 k/100 k halves the voltage and, at ~4 µA drawn from the cell, its own error is negligible — but the two resistors' tolerance enters the reading directly: 1 % parts shift up to ~20 mV at the cell ≈ several % SoC in the flat region. The honest fix is a one-point calibration (store the offset at a known full charge), worth a sentence in any real gauge design.

**Why OCV, and its limits.** No shunt, no coulomb counting — but OCV is only valid near rest: under load, IR drop masquerades as lower SoC. The replay is a rest-state discharge, so the method is valid here; the boundary condition belongs in the solution text.

**Verification.** Replay a 100→0 % discharge with ±3 LSB injected noise. Pass: every reported SoC within ±3 % of the vector's ground truth; reports monotonically non-increasing (no noise-driven upticks — evidence the averaging works); spot values at 4.20 V → 100 %, 3.00 V → 0 % exact.

---

# 20. Two-Task Round-Robin Scheduler with PendSV `[MCU]`

## Overview

Every RTOS interview eventually arrives at the same whiteboard: "so what actually happens during a context switch?" On a Cortex-M3 the honest answer is small enough to build from scratch — two tasks, two stacks, PendSV, and about a dozen lines of assembly-level thinking. The community-validated `mini-arm-os` line of projects proves this runs beautifully under QEMU. Nothing here needs a peripheral: just the core, which is exactly the point.

## System Objective

The system must run two independent tasks with private stacks, switched pre-emptively every millisecond.

The system must:

* **Isolate Tasks:** Each task runs an infinite loop with its own stack; Task A pulses pin A every 2 ms of its runtime, Task B pulses pin B every 5 ms.
* **Switch via PendSV:** SysTick (1 kHz) only *pends* the switch; PendSV — at the lowest exception priority — performs it.
* **Protect the Stacks:** Canary words below each stack, checked on every switch; a torn canary halts with a traced error.

## Operating Principle

1. **Launch:** Each task's stack is pre-loaded with a synthetic exception frame (xPSR with Thumb bit, PC = task entry); the scheduler starts the first task by restoring it.
2. **Tick:** SysTick sets PENDSVSET and returns — no switching in SysTick itself.
3. **Switch:** PendSV saves r4–r11 onto the outgoing task's process stack, stores its PSP, loads the incoming task's PSP, restores r4–r11, and exception-returns into the other task.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Tasks | 2 + idle behaviour, round-robin, 1 ms slice |
| Stacks | 256 bytes each, canary 0xDEADBEEF at the floor |
| Switch Mechanism | SysTick pends; PendSV switches; PSP for tasks, MSP for handlers |
| Hardware Dependence | Core only (no peripherals) |
| Observability | Trace pins A, B; ERROR pin on canary corruption |

## Model Solution — Design Walkthrough

**Why two exception levels — the architectural heart.** The hardware already saves half the context (xPSR, PC, LR, r12, r3–r0) on *any* exception entry; a switcher only needs to save the other half (r4–r11) and swap stack pointers. Doing that in SysTick directly breaks the moment any other interrupt nests; PendSV at the *lowest* priority is the architectural escape hatch — it tail-chains after every other pending handler finishes, so a context switch can never slice another ISR in half. This paragraph, stated crisply, is most of the grade.

**The synthetic first frame.** To start a task that has never run, build its stack as if it had been interrupted: xPSR = 0x01000000 (Thumb bit — forgetting it faults on the first return), PC = entry, LR = a trap for task return, dummy r12/r3–r0, then initial r4–r11 below. First dispatch is then indistinguishable from every later one — one code path, no special cases.

**PSP/MSP split.** Tasks run on PSP; handlers on MSP. EXC_RETURN value 0xFFFFFFFD selects "return to Thread mode, use PSP" — the magic constant deserves one sentence of demystification (it is a flag word the core interprets on exception return, not an address).

**Slice accounting.** Task A pulses every 2 ms *of its own runtime*: with 1 ms slices alternating fairly, wall-clock spacing of A's pulses is ~4 ms — the testbench asserts this doubling as evidence that time-slicing (not cooperative yielding) is really happening.

**Canaries.** 256 bytes fits the 8+8 register frame plus modest locals ~10× over, but the check is the habit being taught: on every switch, both floors still read 0xDEADBEEF or the scheduler halts loudly. A deliberately stack-hungry Task B variant (recursive call in the replay build) must trip it.

**Verification.** Trace timeline shows A and B pulses interleaved (neither starves); A's wall-clock period ≈ 2× its runtime period; ERROR never fires in the normal build; the stack-hog build fires ERROR exactly once and halts with both task pins silent thereafter.

---

# 21. Synchronous FIFO with Early-Full Margin `[FPGA]`

## Overview

A packet engine writes bursts into a buffer that a slower consumer drains. The producer is pipelined: by the time a "stop" reaches it, up to four more words are already in flight. A FIFO that reports full only when full loses those words silently — so this FIFO must lie a little, asserting `full` four entries early. Getting the pointer arithmetic right so that full-with-margin and empty are never confused is a rite-of-passage RTL exercise.

## System Objective

The system must implement a 256 × 32 synchronous FIFO with correct flags and a four-entry full margin.

The system must:

* **Store and Order:** 256 entries × 32 bits, strict first-in first-out, one write and one read per cycle, simultaneously if flags allow.
* **Flag Early:** Assert `full` at 252 occupied entries; assert `empty` at exactly zero.
* **Never Corrupt:** Writes while `full` and reads while `empty` are ignored and counted as errors by the bench.

## Operating Principle

1. **Point:** Write and read pointers index a 256-entry memory; each advances on its accepted operation.
2. **Disambiguate:** Pointers carry one extra MSB so that "pointers equal" means empty while "equal except MSB" means truly full.
3. **Margin:** Occupancy = write_ptr − read_ptr (mod 512); `full` asserts at occupancy ≥ 252.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Geometry | 256 × 32, single clock (27 MHz board domain) |
| Pointers | 9-bit (8 address + 1 wrap bit) |
| Flags | `empty` at 0; `full` at ≥ 252 (4-entry skid margin) |
| Throughput | 1 write + 1 read per cycle sustained |
| Test Load | ≥ 10 000 randomised operations, scoreboard-checked |

## Model Solution — Design Walkthrough

**The extra bit is the whole trick.** With 8-bit pointers, `wr == rd` is ambiguous: empty or exactly-wrapped full. A 9th bit disambiguates for free: empty ⇔ all 9 bits equal; classic full ⇔ low 8 equal, MSBs differ. Occupancy for the margin comes from 9-bit subtraction `wr - rd` (mod 512), which is correct across wrap with no special cases — learners who add if-wrapped branches have missed the two's-complement gift.

**Why the margin is an occupancy compare, not a new flag mechanism.** `full = (occupancy >= 252)` keeps one arithmetic source of truth; deriving "almost full" from separate pointer patterns is where off-by-one bugs breed. The bench's job is to prove entries 252–255 are *never* written in normal operation — they exist purely as landing room for the four in-flight words, mirroring the AXI skid-buffer idea from the bank's D-09.

**Simultaneous read+write.** When both fire in one cycle, occupancy is unchanged; flags must be computed from the *registered* pointers so the decision uses coherent state. The one cycle the naive design gets wrong: read from an empty-this-cycle FIFO whose write is landing simultaneously — spec says the read must be refused (data not yet readable), which "flags from registered pointers" gives automatically.

**Memory inference.** A `reg [31:0] mem [0:255]` with synchronous write and synchronous read infers a block RAM on the Gowin part (see Problem 26 for the latency consequence); a combinational read would force distributed LUT RAM — 8× the resource class. State the choice and its 1-cycle read latency in the interface contract.

**Verification.** Randomised bench, 10 000+ ops with bursty write phases (weight writes 3:1 for stretches, then reads): scoreboard confirms exact order and values; `full` observed asserting at 252 exactly (bench tracks its own occupancy model); zero accepted-while-full writes; drain-to-empty ends with `empty` high and occupancy 0; the four margin entries never contain live data at any point the bench samples.

---

# 22. Interrupt Priority Arbiter `[FPGA]`

## Overview

Eight peripherals share one CPU interrupt input. When several assert at once, the arbiter must pick the most urgent — lowest index wins — encode it, and stand by its choice within the same clock cycle. It is the smallest problem in this set, and the one where sloppy Verilog habits (incomplete cases, unintended latches, priority-vs-parallel confusion) surface most reliably. All 255 non-zero input combinations are checked; there is nowhere for a latch to hide.

## System Objective

The system must combinationally encode the highest-priority active request with a validity flag and a clean acknowledge handshake.

The system must:

* **Encode by Priority:** 8 request lines → 3-bit index of the lowest-numbered active request, same cycle.
* **Flag Validity:** `valid` high whenever any request is active; index output is defined as zero when `valid` is low.
* **Acknowledge:** One-cycle `ack` pulse to the selected source when the CPU asserts `clear`.

## Operating Principle

1. **Prioritise:** A priority ladder inspects requests from index 0 upward; the first active one wins.
2. **Encode:** The winner's index drives a 3-bit output plus `valid`.
3. **Handshake:** On `clear`, a registered one-hot `ack` pulses to the winner for exactly one cycle.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Inputs | 8 request lines, level-sensitive |
| Priority | Index 0 highest — lowest index wins |
| Latency | Encode combinational (same cycle); `ack` registered |
| Coverage | All 255 non-zero combinations + all-zero case |
| Code Quality | No inferred latches; default assignments mandatory |

## Model Solution — Design Walkthrough

**`casez` is the idiom.** An 8-arm `casez` over the request vector with patterns `1???????` down to `00000001` expresses "lowest index wins" in eight readable lines (order the patterns so index 0's pattern is checked first). The alternative — a for-loop that breaks on first hit — synthesises identically but reads worse in review; either earns the marks *if* every output is assigned in every path.

**The latch trap, named.** A combinational `always` block that assigns `index` only when some request is active leaves `index` holding state when none is — an inferred latch, the classic Verilog defect. Defence in the house style: first lines of the block assign defaults (`index = 0; valid = 0;`), then the case overrides. The bench's all-zero test exists to catch exactly this (a latch shows stale index with `valid` low — legal per spec only because the spec pins index to zero; the bench checks the pin).

**Priority vs. parallel, one sentence.** The synthesised ladder is a chain: request 7's path runs through 7 disqualifications. At 8 bits and 27 MHz this is irrelevant (nanoseconds of logic vs a 37 ns period); at 64+ bits or GHz clocks you would split the encode into a tree — the scaling remark is what separates a memorised answer from an understood one.

**Ack discipline.** `ack` must be one-hot, registered, and exactly one cycle wide: `ack <= clear ? (8'b1 << index) : 8'b0`. Registering matters because the CPU's `clear` and a *new* higher-priority request can land in the same cycle — the ack must go to the request that was actually served (the index captured at `clear`), not the new winner; the bench includes this same-cycle race.

**Verification.** Exhaustive sweep of all 256 input values: encoded index equals the position of the lowest set bit (bench computes independently); `valid` = |requests|; all-zero case gives `valid=0, index=0`. Randomised clear traffic with simultaneous new requests: every `ack` is one-hot, one cycle, and addressed to the pre-clear winner. Lint-style check: simulation with `x`-propagation shows no `x` on outputs for any driven input.

---

# 23. Streaming CRC-32 Engine `[FPGA]`

## Overview

A flash controller streams a page out at one byte per clock and must land the IEEE CRC-32 in the same breath — no stall cycles, no second pass. Bit-serial CRC hardware is textbook-simple but eight times too slow, so the exercise is unrolling: transform "one XOR-shift per bit" into "one 32-bit XOR network per byte" without changing the answer. The reference value 0xCBF43926 for the string "123456789" is the industry's agreed handshake that your parameter set is right.

## System Objective

The system must compute CRC-32 (IEEE 802.3) over a byte stream at one byte per clock cycle.

The system must:

* **Sustain Line Rate:** Accept a new byte every cycle with `valid`; no back-pressure.
* **Match the Standard:** Reflected CRC-32, poly 0x04C11DB7, init 0xFFFFFFFF, final XOR 0xFFFFFFFF; KAT "123456789" → 0xCBF43926.
* **Frame Cleanly:** `start` reinitialises; `last` marks the final byte, after which the finalised CRC is presented next cycle.

## Operating Principle

1. **Hold State:** A 32-bit CRC register carries the running remainder.
2. **Unroll:** The per-byte next-state function is eight chained copies of the per-bit function, flattened into one combinational XOR network.
3. **Finalise:** On `last`, the register value is bit-order-corrected and inverted for output.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Throughput | 1 byte/clock @ 27 MHz, no stalls |
| Parameters | Reflected, 0x04C11DB7, init/final-XOR 0xFFFFFFFF |
| Known-Answer Test | "123456789" → 0xCBF43926 |
| Interface | `valid`, `start`, `last`; CRC out 1 cycle after `last` |
| Sensitivity | Any single bit-flip in a 256-byte message changes the CRC |

## Model Solution — Design Walkthrough

**Derive, don't transcribe.** The per-byte function is mechanical: apply the reflected per-bit step (test LSB, shift right, conditional XOR with the reflected poly 0xEDB88320) eight times symbolically. Each next-state bit becomes an XOR of a subset of {current CRC bits, incoming byte bits} — a pure combinational network the synthesiser flattens happily. The walkthrough should present the per-bit step, the unrolling argument (function composition, no state between sub-steps), and leave the 32 XOR equations to generation — hand-transcribing published tables without the derivation is how parameter bugs arrive.

**Reflection, explained once.** "Reflected" CRC processes least-significant bit first — an artefact of serial links sending LSB first. Working entirely in the reflected domain (reflected poly, right-shifts) means bytes enter naturally and *no per-byte bit reversal is needed*; the only reflection left is conceptual. Solutions that bolt reversal networks onto an unreflected core also pass the KAT — flag as accepted-but-unidiomatic, costing area for nothing.

**Timing sanity.** The byte-unrolled network is ~5 XOR levels deep — trivially inside a 37 ns period at 27 MHz. The scaling question an interviewer will ask: at 32 bits/clock the network quadruples in width but depth grows only logarithmically; unrolling width, not clock rate, is how 100G MACs do it. One sentence earns the systems point.

**Why `start`/`last` framing beats a reset wire.** Back-to-back messages with a dead reset cycle between them break line rate; `start` folding init into the first byte's computation keeps the stream gapless. The bench sends two adjacent messages to check exactly this.

**Verification.** KAT: "123456789" streamed with `start`/`last` → 0xCBF43926 one cycle after `last`. Random 256-byte message: result equals the bench's software model; repeat with one random bit flipped — CRC must differ (run 100 flip trials, all must differ). Gapless back-to-back messages: both CRCs correct with zero idle cycles between.

---

# 24. SPI Flash JEDEC-ID Reader on Real Board Flash `[FPGA]`

## Overview

Before any system trusts an external flash chip, it asks the chip to introduce itself: command 0x9F, and the die answers with three identity bytes. The simulator's board harness models the Tang Nano's actual W25Q32 SPI flash, so this is not an abstract SPI exercise — your master must speak real Mode-0 timing to a behavioural model of the real part, and the correct answer is known in advance: EF 40 16. If any byte differs, your edges are wrong, and the waveform will show you exactly where.

## System Objective

The system must implement an SPI Mode-0 master that reads and reports the flash JEDEC ID.

The system must:

* **Drive Mode 0:** SCLK idles low; MOSI changes on falling edge, MISO is sampled on rising edge; CS frames the whole transaction.
* **Transact:** Send 0x9F, then clock 24 more cycles to receive manufacturer, type, and capacity bytes.
* **Report:** Present the three bytes on a register bank and pulse `done`; drive the byte-match result to LEDs.

## Operating Principle

1. **Divide:** 27 MHz ÷ 4 → 6.75 MHz SCLK, generated only while the transaction runs.
2. **Sequence:** FSM: IDLE → ASSERT_CS → SHIFT(32 bits) → DEASSERT_CS → DONE, one shared bit counter.
3. **Shift:** One 32-bit shift register handles both directions — command out the MSB end while ID bits fill the LSB end.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Clock | 27 MHz system; SCLK = 6.75 MHz (÷4) |
| Protocol | SPI Mode 0 (CPOL=0, CPHA=0), MSB first |
| Command | 0x9F JEDEC ID; expect EF 40 16 (W25Q32) |
| CS Timing | Asserted ≥ 1 SCLK before first edge, held through bit 32 |
| Duration | 32 SCLK ≈ 4.7 µs — well inside the sim window |
| Pins | `.cst` mapping to the harness flash pins |

## Model Solution — Design Walkthrough

**Mode 0 in one rule.** Data must be stable across every SCLK rising edge: therefore the master updates MOSI on falling edges and samples MISO on rising edges, and the *first* rising edge must arrive with the command's MSB already stable — which is why CS asserts at least one SCLK period early, with MOSI preloaded. Most first attempts fail by launching MOSI on the same edge that samples it; the harness's decoded command becomes 0x3E or 0xCF (a shifted 0x9F), and recognising *that signature in the waveform* is a skill this problem deliberately trains.

**One shift register, two jobs.** Load `{8'h9F, 24'h000000}`; shift left on each falling edge, driving MOSI from bit 31 and inserting each sampled MISO bit at bit 0 on rising edges. After 32 clocks, bits [23:0] hold the ID — no separate TX/RX paths, no byte counters, one 5-bit bit-counter as the FSM's spine.

**Clock generation discipline.** Gate the divider so SCLK exists only between CS assert and de-assert, and always completes half-periods (no runt edges when the FSM exits). A free-running SCLK with CS gating also *works* electrically for this chip, but state why framed clocking is the habit: some peripherals count edges regardless of CS, and runt edges are unfalsifiable in bring-up.

**Divider choice.** ÷2 (13.5 MHz) is within the W25Q32's rating; ÷4 chosen for waveform legibility in the capped sim window while costing only ~2.3 µs. Full transaction: 32 bits at 6.75 MHz ≈ 4.7 µs.

**Verification.** Harness reports the flash model received command 0x9F with correct Mode-0 framing; captured bytes equal EF 40 16; `done` pulses once; CS timing margins met (bench measures CS-to-first-edge ≥ 148 ns); LEDs show the match. Negative check: rerun with sampling edge deliberately inverted (provided define) — ID misreads as the shifted signature, teaching the failure fingerprint.

---

# 25. CORDIC Sine/Cosine Generator `[FPGA]`

## Overview

A signal generator needs sin and cos of an arbitrary phase every clock cycle. A lookup table with the required 16-bit precision costs a mountain of memory; a multiplier-based Taylor evaluation costs DSP blocks the design cannot spare. CORDIC does it with shifts and adds alone — the algorithm that put trig into calculators — converging one binary digit of angle per iteration. The catch everyone forgets: the rotation gain of 1.64676 must be pre-compensated, or every output is silently 65 % too large.

## System Objective

The system must compute sin and cos of an input phase to 16-bit precision using an iterative shift-add datapath.

The system must:

* **Rotate Iteratively:** 16 CORDIC iterations in rotation mode, arctangent-table driven.
* **Cover the Circle:** Pre-rotate by quadrant (from the top two phase bits) so the iterative core only handles ±90°.
* **Compensate Gain:** Initialise the vector at $1/K = 0.60725$ so outputs land on the unit circle.

## Operating Principle

1. **Map:** Quadrant logic reduces the 16-bit phase to a signed angle in (−90°, +90°] plus output sign corrections.
2. **Iterate:** Each stage rotates by $\pm\arctan(2^{-i})$, choosing the sign that drives the residual angle toward zero; x/y update by shift-and-add only.
3. **Correct:** Quadrant signs are applied to the final x (cos) and y (sin).

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Iterations | 16 (angular resolution ≈ 0.00175°) |
| Data Format | Q1.15 fixed point throughout |
| Gain Handling | Seed x with $1/K = 0.60725 \times 2^{15} = 19898$ |
| Accuracy | max error ≤ 2 LSB vs. double-precision reference, all tested phases |
| Architecture | Iterative (1 result / 16 cycles) or pipelined (1 / cycle) — state the trade |
| No multipliers | Shift-add datapath only (table of 16 arctan constants) |

## Model Solution — Design Walkthrough

**Why it works, compactly.** Any angle in ±99.88° (the sum of all $\arctan 2^{-i}$) is representable as $\sum \pm\arctan(2^{-i})$ — a signed-digit numeral system for angles. Rotating by exactly these micro-angles makes the rotation matrix multiplications collapse to shifts: $x' = x \mp y \cdot 2^{-i}$, $y' = y \pm x \cdot 2^{-i}$, plus an angle accumulator tracking the residue. Sign choice each stage = sign of the residue: a binary search that gains one angle bit per iteration, hence 16 iterations for 16-bit phase.

**The gain, derived not memorised.** Each micro-rotation stretches the vector by $\sqrt{1+2^{-2i}}$; the product over 16 stages converges to $K = 1.64676$. Since K is constant (independent of the sign choices), compensation is free: start at $x_0 = 1/K$ rather than multiplying afterwards — the elegant move the Overview promises, and the difference between a datapath with zero multipliers and one with two.

**Quadrant strategy.** The core converges only within ±99.88°, so full-circle coverage folds quadrants: top two phase bits select (swap, negate) corrections applied at input and output. Off-by-one target: phase exactly at 90° — the fold must map it consistently (bench includes it).

**Iterative vs. pipelined — the stated trade.** One iterative stage reused 16× costs ~1 adder-pair and gives a result every 16 cycles; 16 unrolled stages cost 16× area and stream one result per clock with 16-cycle latency. At 27 MHz the iterative core already yields 1.7 M samples/s — size the answer to the application asked for (signal generator: pipelined; occasional calibration: iterative).

**Verification.** Sweep all 65 536 phases (or 4 096-point stratified subset within the sim cap): max |error| ≤ 2 LSB against the bench's double-precision model; $\sin^2+\cos^2 = 1 \pm 3$ LSB (circle invariant — catches gain errors specifically); the four cardinal angles exact; a deliberately uncompensated build (define switch) fails the circle invariant by the predicted 64.7 % — the fingerprint proving learners understand what K does.

---

# 26. BRAM-Inferred QAM-64 Symbol Mapper `[FPGA]`

## Overview

A modem maps each 6-bit symbol to a point on an 8×8 constellation grid — a pure lookup, 64 entries of I and Q. Implemented carelessly, those values scatter into hundreds of logic LUTs; described correctly, the synthesiser packs them into one block RAM with a registered output. The price of the block RAM is exactly one cycle of read latency, and forgetting to pay it — misaligning the symbol's `valid` with its data — is the bug this problem is engineered to expose.

## System Objective

The system must map 6-bit symbols to Q1.7 I/Q constellation values through an inferred-BRAM lookup with correctly pipelined framing.

The system must:

* **Map Gray-wise:** 3 bits per axis, Gray-coded, to levels {±1, ±3, ±5, ±7}/8 in Q1.7.
* **Infer Block RAM:** ROM described so synthesis maps it to a BSRAM primitive, not distributed logic.
* **Align the Pipeline:** `valid` and any sideband travel with their symbol — output flags delayed to match the 1-cycle read.

## Operating Principle

1. **Address:** The 6-bit symbol addresses a 64 × 16 ROM (I in [15:8], Q in [7:0]), initialised from a generated table.
2. **Read Registered:** The ROM output register — the feature that triggers BRAM inference — delivers data one cycle after the address.
3. **Re-time:** `valid` passes through one matching flip-flop so downstream logic sees flag and data in step.

## Technical Constraints & Specifications

| Feature | Specification |
| --- | --- |
| Constellation | QAM-64, Gray-coded per axis, levels {±1,±3,±5,±7}/8 in Q1.7 |
| Memory | 64 × 16 ROM, BSRAM-inferred (registered read) |
| Latency | Exactly 1 cycle, `valid` aligned |
| Rate | 1 symbol/clock sustained @ 27 MHz |
| Check | All 64 mappings + streaming alignment |

## Model Solution — Design Walkthrough

**Why Gray on each axis — one sentence of comms.** Adjacent constellation points differ in one bit per axis under Gray mapping, so the most likely demodulation error (falling into a neighbouring cell) corrupts a single bit — connecting this LUT to Problem 8's Gray counter shows the same idea serving two masters (metastability there, noise resilience here).

**Table generation.** Per axis: Gray-decode the 3 bits to an index 0–7, map to level $2 \cdot idx - 7 \in \{-7...+7\}$, scale by $2^7/8 = 16$ into Q1.7 (so ±7 → ±112). Generate the 64 entries with a script/`initial` block into a hex init file — hand-typed tables are where single-entry bugs live, and the bench's exhaustive check exists because of them.

**What makes it BRAM.** The inference contract: synchronous read (output assigned in a clocked block), one address port, init file — the Gowin toolchain then packs it into a BSRAM block. A combinational `assign` read yields LUT-ROM instead: functionally identical, ~64 LUTs wasted, and — the graded point — *zero-latency*, which silently breaks any design written for the registered contract. The two implementations are therefore not interchangeable, and the interface must document its latency.

**The alignment bug, made concrete.** Stream symbols A, B, C on consecutive clocks with `valid` passed combinationally: downstream pairs A's flag with stale data, B's flag with A's point, and so on — every sample off by one, no error flag anywhere. The fix is mechanical (`valid_q <= valid`), the lesson is general: *every* sideband signal must ride the same pipeline as its data. This is the smallest possible instance of the skid-buffer discipline from Problem 21.

**Verification.** Exhaustive: all 64 symbols streamed back-to-back; bench Gray-decodes independently and compares I/Q — all must match, one result per clock, each exactly 1 cycle after its address. Alignment: random `valid` gaps — flagged outputs always carry the symbol presented 1 cycle earlier. Synthesis report (or harness resource proxy) confirms BSRAM inference, zero DSPs, and LUT count consistent with control-only logic.

---

# Batch 2 Notes — Additional Findings

**Bank P-02 (boost 28 V → 400 V) is unbuildable as written.** Its own acceptance criterion — D < 0.9 at minimum panel voltage — fails on its own numbers: $D = 1 - 18/400 = 0.955$, and even at 36 V, $D = 0.91$. Real MPPT designs series-string panels or use two stages/coupled magnetics for that ratio. Problem 10 rebases to a 72 V micro-storage bus (D ≤ 0.75) and keeps every teachable element; alternatively, keep the original numbers and reframe it as a *spot-the-infeasible-spec* debug problem — the community research (Sources 14, 27) says debug-format problems are an underexploited category.

**Harness peripherals are an asset — write problems *to* them.** Problem 24 exists because `sim_testbench.md` says the FPGA harness models the W25Q32 SPI flash: bank D-06's generic ADC becomes a real transaction against a real part with a known right answer (EF 40 16). The SD-init and HDMI-frame models would support two more problems of this authentic flavour when you want them.

**Self-identifying failure modes are worth designing in.** Several Batch 2 solutions include a deliberately broken build (uncompensated CORDIC, inverted SPI sampling edge, opened hysteresis, zero dead-time) whose failure *signature* is predicted in the walkthrough. Recognising a fault from its fingerprint is closer to real bring-up work than writing code that was never wrong — recommend adopting this as a house pattern; it also gives your grader a second, cheap assertion per problem.

**Cross-linking problems multiplies their value.** Batch 2 deliberately references earlier problems (16→6 on lock-freedom, 26→8 on Gray codes, 14→11 on shoot-through, 26→21 on pipeline discipline). A "related problems" footer per problem would let the webapp surface these as learning paths — the strongest candidates are already noted inline.

**Difficulty spread, both batches (suggested tags).** Foundational: 4, 5, 12, 14, 22, 26. Core: 1, 2, 3, 7, 9, 11, 13, 16, 17, 18, 19, 21, 24. Advanced: 6, 8, 10, 15, 20, 23, 25.






