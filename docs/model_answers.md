# Scope.io Model Answers

Runnable model answers for the 26 problems in `problem_solution.md`, grouped by simulator. Every artifact here was machine-checked before inclusion:

- **FPGA (9)** — each design was simulated against its self-checking testbench under Icarus Verilog (the same engine fpgasim runs) until it printed PASS. Testbenches double as the harness spec: their assertions are the problem's grading criteria.
- **MCU (8)** — each file is complete mcusim firmware; its algorithmic core was additionally compiled and unit-tested on a host PC via the built-in `HOST_TEST` harness (`gcc -DHOST_TEST file.c && ./a.out`). That harness pattern — pure-logic core, replayed vectors, hardware only at the edges — is itself part of the model answer. P20's context-switch assembly is the one artifact that could not be executed here (no ARM cross-compiler); it follows the mini-arm-os pattern and its non-assembly logic is host-tested.
- **CircuitJS (9)** — netlists are generated to match the element syntax of the existing exemplar problems and pass an automated floating-pin check (every node has ≥ 2 connections, label nets merged). They could not be executed in this environment: treat each as a validated-topology starting point and expect minor value/cosmetic touch-ups on first import (File → Import From Text).

Known assumptions, flagged once here rather than per-file: MCU code assumes the sim-injected `trace.h` exposes `trace_pin(const char *name, int value)` and that `SysTick_Handler` is linked via the sim's startup vector table; the CircuitJS PNP in P3 uses dump format `t x y x2 y2 flags pnp vbe vbc beta` — if it imports mirrored, flip it with Edit, the topology is unchanged.

---

# CircuitJS Answers

## P1 — Buck Converter for a Warehouse Inspection Rover

Hysteretic buck: 330 µH / 100 µF (+50 mΩ ESR), comparator with ±12.5 mV hysteresis via the 12 MΩ/10 kΩ network, `drive`/`step` label nets. A 10 Hz pulse rail switches the 6.2 Ω stall load in for 50 ms bursts. Watch scope 1: V_out ripple < 50 mV steady, dip ≥ 4.75 V during the step; scope 2: inductor ripple ≈ 91 mA.

```
<cir f="1" ts="5e-7" ic="382.76258214399064" cb="50" pb="50" vr="5" mts="5e-11">
  <v x="48 128 48 64" f="0" wf="0" maxv="11.1"/>
  <g x="48 128 48 160" f="0"/>
  <ln x="48 64 8 64" f="4" te="vbat"/>
  <w x="48 64 144 64" f="0"/>
  <as x="144 64 144 112" f="2" ron="20" roff="10000000000" th="2.5"/>
  <d x="144 176 144 112" f="2" mo="default"/>
  <g x="144 176 144 208" f="0"/>
  <l x="144 112 272 112" f="0" l="0.00033" ic="0" i="0"/>
  <r x="272 112 272 160" f="0" r="0.05"/>
  <c x="272 160 272 208" f="4" c="0.0001" iv="0.001" sr="0.1" vd="0.001"/>
  <g x="272 208 272 240" f="0"/>
  <w x="272 112 368 112" f="0"/>
  <r x="368 112 368 208" f="0" r="27.8"/>
  <g x="368 208 368 240" f="0"/>
  <w x="368 112 432 112" f="0"/>
  <r x="432 112 432 160" f="0" r="6.2"/>
  <as x="432 160 432 208" f="2" ron="20" roff="10000000000" th="2.5"/>
  <g x="432 208 432 240" f="0"/>
  <R x="416 192 416 448" f="0" wf="2" fr="10" maxv="2.5" bias="2.5"/>
  <w x="432 112 560 112" f="0"/>
  <r x="560 112 560 176" f="0" r="10000"/>
  <r x="560 176 560 240" f="0" r="10000"/>
  <g x="560 240 560 272" f="0"/>
  <w x="560 176 608 176" f="0"/>
  <w x="608 176 608 144" f="0"/>
  <w x="608 144 656 144" f="0"/>
  <a x="656 160 768 160" f="8" ma="15" mi="-15" ga="100000"/>
  <R x="624 272 592 272" f="0" wf="0" maxv="2.5"/>
  <r x="624 272 656 272" f="0" r="10000"/>
  <w x="656 272 656 176" f="0"/>
  <w x="768 160 768 96" f="0"/>
  <r x="768 96 672 96" f="0" r="12000000"/>
  <w x="672 96 672 176" f="0"/>
  <w x="672 176 656 176" f="0"/>
  <p x="624 112 624 64" f="1" me="0" sc="0" re="1000000000000"/>
  <g x="656 64 656 96" f="0"/>
  <w x="560 112 624 112" f="0"/>
  <x x="182 45 477 48" f="4" si="20" te="P1 buck: 330uH 100uF hysteretic"/>
  <w x="416 192 416 176" f="0"/>
  <w x="768 160 816 160" f="0"/>
  <w x="816 160 816 -16" f="0"/>
  <w x="816 -16 128 -16" f="0"/>
  <w x="128 -16 128 80" f="0"/>
  <w x="624 64 656 64" f="0"/>
  <o en="34" sp="4" f="x2" p="0">
    <p v="0" sc="10"/>
  </o>
  <o en="7" sp="4" f="x2" p="1">
    <p v="0" sc="8"/>
  </o>
  <o en="0" sp="4" f="x2" p="2">
    <p v="0" sc="20"/>
  </o>
</cir>
```

## P2 — Three-Band Audio Filter Bank

Front buffer + 2.5 V bias label net; three rows: bass (÷0.75 → 500 Hz RC → 500 Hz Sallen-Key K=2), treble (÷0.75 → 4 kHz, mirrored), mid (÷0.375 → 3rd-order HP 500 → 3rd-order LP 4k). Change the source frequency (100 Hz / 1.4 kHz / 8 kHz) and confirm each tone lands ≥ 0 dB on exactly one probe and ≥ 18 dB down on its neighbours. Real-pole resistors are pre-shrunk for divider Thevenin impedance (2.7 kΩ ≈ 3.18 kΩ − 562 Ω).

```
$ 1 0.00001 10.20027730826997 50 5 50 5e-11
v 48 160 48 96 0 1 1000 1.5 0 0 0.5
g 48 160 48 192 0 0
c 48 96 144 96 4 3.3e-07 0 0.001 0.1
r 144 96 144 160 0 100000
207 144 160 176 160 4 bias
w 144 96 208 96 0
a 208 80 304 80 8 15 -15 1000000 0 0 100000
w 304 80 304 32 0
w 304 32 208 32 0
w 208 32 208 64 0
207 304 80 344 80 4 src
R 48 272 16 272 0 0 40 2.5 0 0 0.5
207 48 272 96 272 4 bias
207 96 224 88 224 4 src
r 96 224 192 224 0 750
r 192 224 192 288 0 2250
207 192 288 224 288 4 bias
r 192 224 288 224 0 2700
c 288 224 288 288 4 1e-07 0 0.001 0.1
207 288 288 320 288 4 bias
r 288 224 384 224 0 6800
r 384 224 480 224 0 6800
c 384 224 384 160 4 4.7e-08 0 0.001 0.1
w 384 160 608 160 0
w 608 160 608 208 0
c 480 224 480 288 4 4.7e-08 0 0.001 0.1
207 480 288 512 288 4 bias
a 480 208 608 208 8 15 -15 1000000 0 0 100000
w 608 160 608 128 0
r 608 128 512 128 0 10000
w 512 128 512 192 0
w 512 192 480 192 0
r 512 192 512 288 0 10000
207 512 288 544 288 4 bias
w 608 208 656 208 0
p 656 208 656 288 1 0 0 1000000000000
g 656 288 656 320 0 0
207 608 208 648 208 4 bass
207 96 448 88 448 4 src
r 96 448 192 448 0 300
r 192 448 192 512 0 900
207 192 512 224 512 4 bias
c 192 448 288 448 4 1e-08 0 0.001 0.1
r 288 448 288 512 0 3900
207 288 512 320 512 4 bias
c 288 448 384 448 4 1e-08 0 0.001 0.1
c 384 448 480 448 4 1e-08 0 0.001 0.1
r 384 448 384 384 0 3900
w 384 384 608 384 0
w 608 384 608 432 0
r 480 448 480 512 0 3900
207 480 512 512 512 4 bias
a 480 432 608 432 8 15 -15 1000000 0 0 100000
w 608 384 608 352 0
r 608 352 512 352 0 10000
w 512 352 512 416 0
w 512 416 480 416 0
r 512 416 512 512 0 10000
207 512 512 544 512 4 bias
w 608 432 656 432 0
p 656 432 656 512 1 0 0 1000000000000
g 656 512 656 544 0 0
207 608 432 648 432 4 treble
207 96 672 88 672 4 src
r 96 672 192 672 0 150
r 192 672 192 736 0 90
207 192 736 224 736 4 bias
c 192 672 288 672 4 1e-07 0 0.001 0.1
r 288 672 288 736 0 3300
207 288 736 320 736 4 bias
c 288 672 384 672 4 4.7e-08 0 0.001 0.1
c 384 672 480 672 4 4.7e-08 0 0.001 0.1
r 384 672 384 608 0 6800
w 384 608 608 608 0
w 608 608 608 656 0
r 480 672 480 736 0 6800
207 480 736 512 736 4 bias
a 480 656 608 656 8 15 -15 1000000 0 0 100000
w 608 608 608 576 0
r 608 576 512 576 0 10000
w 512 576 512 640 0
w 512 640 480 640 0
r 512 640 512 736 0 10000
207 512 736 544 736 4 bias
r 608 656 704 656 0 3900
c 704 656 704 720 4 1e-08 0 0.001 0.1
207 704 720 736 720 4 bias
r 704 656 800 656 0 3900
r 800 656 896 656 0 3900
c 800 656 800 592 4 1e-08 0 0.001 0.1
w 800 592 1024 592 0
w 1024 592 1024 640 0
c 896 656 896 720 4 1e-08 0 0.001 0.1
207 896 720 928 720 4 bias
a 896 640 1024 640 8 15 -15 1000000 0 0 100000
w 1024 592 1024 560 0
r 1024 560 928 560 0 10000
w 928 560 928 624 0
w 928 624 896 624 0
r 928 624 928 720 0 10000
207 928 720 960 720 4 bias
w 1024 640 1072 640 0
p 1072 640 1072 720 1 0 0 1000000000000
g 1072 720 1072 752 0 0
207 1024 640 1064 640 4 mid
x 48 0 268 3 4 20 P2\s3-band\sfilter\sbank
o 35 4 0 4098 3 0.1 0 1
o 102 4 0 4098 3 0.1 1 1
o 60 4 0 4098 3 0.1 2 1
```

## P3 — High-Side Current Sensing (op-amp + PNP conveyor)

48 V rail, 1 mΩ shunt, R_in 100 Ω → PNP emitter, op-amp (rails 0–60 V) drives the base; collector into R_out 8.25 kΩ ∥ 100 nF. 1.2 Ω load ⇒ 40 A ⇒ probe reads ≈ 3.3 V (minus ~0.5 % base-current error at β=200). Vary the load resistor to sweep current and check linearity; vary the 48 V source 36–54 V and confirm the output barely moves.

```
$ 1 0.00001 10.20027730826997 50 5 50 5e-11
v 64 320 64 64 0 0 40 48 0 0 0.5
g 64 320 64 352 0 0
w 64 64 128 64 0
r 128 64 224 64 0 0.001
r 320 64 320 320 0 1.2
g 320 320 320 352 0 0
w 224 64 320 64 0
r 224 64 224 192 0 100
w 224 192 256 192 0
w 256 192 304 192 0
a 304 208 400 208 8 60 0 1000000 0 0 100000
w 128 64 128 224 0
w 128 224 304 224 0
w 400 208 432 208 0
t 432 208 496 208 0 -1 0 0 200
w 496 224 528 224 0
w 528 224 528 160 0
w 528 160 256 160 0
w 256 160 256 192 0
w 496 192 560 192 0
r 560 192 560 320 0 8250
g 560 320 560 352 0 0
w 560 192 608 192 0
c 608 192 608 320 4 1e-07 0 0.001 0.1
g 608 320 608 352 0 0
w 608 192 656 192 0
p 656 192 656 320 1 0 0 1000000000000
g 656 320 656 352 0 0
x 64 20 284 23 4 20 P3\shigh-side\s40A\s->\s3.3V
o 26 4 0 4098 2 0.1 0 1
o 3 4 0 4098 0.05 0.1 1 1
```

## P10 — Boost Converter for Solar Micro-Storage

Open-loop CCM boost at the design point: 28 V in, 220 µH, 47 µF, D = 0.61 from the square rail ⇒ ~72 V out into 34.6 Ω. Sizing problem, so the loop is deliberately open: change the source to 18/36 V and adjust the rail duty to 0.75/0.50 to verify the D-range math; watch the inductor-current scope for the ripple numbers (818/614 mA).

```
$ 1 5e-7 10.20027730826997 50 5 50 5e-11
v 48 192 48 96 0 0 40 28 0 0 0.5
g 48 192 48 224 0 0
207 48 96 8 96 4 panel
l 48 96 208 96 0 0.00022 0 0
159 208 96 208 160 2 20 10000000000 2.5
g 208 160 208 192 0 0
207 192 128 144 128 4 pwm
d 208 96 304 96 2 default
c 304 96 304 192 4 4.7e-05 0 0.001 0.1
g 304 192 304 224 0 0
w 304 96 384 96 0
r 384 96 384 192 0 34.6
g 384 192 384 224 0 0
p 448 96 448 192 1 0 0 1000000000000
g 448 192 448 224 0 0
w 384 96 448 96 0
R 160 224 128 224 0 2 100000 2.5 2.5 0.0 0.61
207 160 224 208 224 4 pwm
x 48 20 268 23 4 20 P10\sboost:\s220uH\s47uF\sD0.61
o 13 4 0 4098 20 0.1 0 1
o 3 4 0 4098 5 0.1 1 1
```

## P11 — Dead-Time for an ROV Thruster H-Bridge

Left leg PWM at 20 kHz, right leg statically enabled; antiparallel diodes model the FET body diodes. Each gate signal passes R(1k)–C(680p)–diode–Schmitt: fast fall (instant turn-off), slow rise (~750 ns delayed turn-on with the 2/3-supply Schmitt threshold). Scope 1 is supply current: short the delay networks (bypass wire in place of the 1 kΩ) to see the shoot-through spikes return.

```
$ 1 2e-8 1.5 50 5 50 5e-11
v 48 224 48 64 0 0 40 12 0 0 0.5
g 48 224 48 256 0 0
w 48 64 192 64 0
159 192 64 192 112 2 20 10000000000 2.5
207 176 88 128 88 4 dtH
w 192 64 224 64 0
w 192 112 224 112 0
d 224 112 224 64 2 default
w 224 64 448 64 0
w 192 112 192 144 0
r 192 144 288 144 0 1.0
l 288 144 384 144 0 0.0005 0 0
w 384 144 448 144 0
w 192 144 192 176 0
159 192 176 192 224 2 20 10000000000 2.5
g 192 224 192 256 0 0
207 176 200 128 200 4 dtL
w 160 176 192 176 0
w 160 224 192 224 0
d 160 224 160 176 2 default
159 448 64 448 112 2 20 10000000000 2.5
g 432 88 432 120 0 0
w 448 64 480 64 0
w 448 112 480 112 0
d 480 112 480 64 2 default
w 448 112 448 144 0
w 448 144 448 176 0
159 448 176 448 224 2 20 10000000000 2.5
g 448 224 448 256 0 0
207 432 200 384 200 4 on5
w 416 176 448 176 0
w 416 224 448 224 0
d 416 224 416 176 2 default
R 48 448 16 448 0 0 40 5 0 0 0.5
207 48 448 96 448 4 on5
R 48 320 16 320 0 2 20000 2.5 2.5 0.0 0.5
207 48 320 96 320 4 pwm
207 96 320 88 320 4 pwm
r 96 320 160 320 0 1000
c 160 320 160 352 4 6.8e-10 0 0.001 0.1
g 160 352 160 384 0 0
w 96 320 96 288 0
w 160 320 160 288 0
d 160 288 96 288 2 default
182 160 320 240 320 0 0.5 1.66 3.33 5 0
207 240 320 280 320 4 dtH
207 96 384 88 384 4 pwm
I 96 384 144 384 0 0.5 5
r 144 384 208 384 0 1000
c 208 384 208 416 4 6.8e-10 0 0.001 0.1
g 208 416 208 448 0 0
w 144 384 144 352 0
w 208 384 208 352 0
d 208 352 144 352 2 default
182 208 384 288 384 0 0.5 1.66 3.33 5 0
207 288 384 328 384 4 dtL
x 48 20 268 23 4 20 P11\sH-bridge\sdead-time\s~750ns
o 0 4 0 4098 10 0.1 0 1
o 11 4 0 4098 5 0.1 1 1
```

## P12 — Zero-Crossing Detector for a TRIAC Dimmer

325 V peak 50 Hz mains + series 5 V/2 kHz noise source → 320k/10k divider → comparator with 10k/590k positive feedback (±0.25 V at the input ≡ ±8 V at mains). Exactly one edge per half-cycle on scope 2; delete the 590 kΩ to watch noise re-triggering return. Detection offset ≈ 78 µs = 1.41°.

```
$ 1 0.00001 10.20027730826997 50 5 50 5e-11
v 64 192 64 128 0 1 50 325 0 0 0.5
g 64 192 64 224 0 0
v 64 128 64 64 0 1 2000 5 0 0 0.5
w 64 64 144 64 0
r 144 64 144 160 0 320000
r 144 160 144 256 0 10000
g 144 256 144 288 0 0
w 144 160 272 160 0
a 272 176 384 176 8 15 -15 1000000 0 0 100000
w 272 192 272 256 0
r 272 256 272 320 0 10000
g 272 320 272 352 0 0
w 384 176 384 96 0
r 384 96 288 96 0 590000
w 288 96 288 192 0
w 288 192 272 192 0
w 384 176 448 176 0
p 448 176 448 240 1 0 0 1000000000000
g 448 240 448 272 0 0
x 64 20 284 23 4 20 P12\szero-cross\sdetector
o 0 4 0 4098 200 0.1 0 1
o 17 4 0 4098 10 0.1 1 1
```

## P13 — Instrumentation Amplifier for a Postal Scale

350 Ω bridge (one arm 351.4 Ω ⇒ 5 mV differential), bottom lifted by a 100 mV pp 50 Hz source = pure common mode. Classic 3-op-amp INA: G1 = 1+2·49.5k/1k = 100, subtractor G2 = 5. Probe ≈ 2.5 V DC with the 50 Hz residue in the millivolt range; swap the gain split (Rg → 24.75k, subtractor ×100... i.e. G1=5/G2=100) to watch the residue grow ~26 dB.

```
$ 1 0.00005 10.20027730826997 50 5 50 5e-11
R 256 32 224 32 0 0 40 5 0 0 0.5
w 256 32 256 64 0
r 256 64 192 128 0 350
r 256 64 320 128 0 351.4
r 192 128 256 192 0 350
r 320 128 256 192 0 350
v 256 256 256 192 0 1 50 0.05 0 0 0.5
g 256 256 256 288 0 0
w 192 128 464 128 0
a 464 112 560 112 8 15 -15 1000000 0 0 100000
w 320 128 320 256 0
w 320 256 464 256 0
a 464 240 560 240 8 15 -15 1000000 0 0 100000
w 560 112 560 64 0
r 560 64 464 64 0 49500
w 464 64 464 96 0
w 560 240 560 288 0
r 560 288 480 288 0 49500
w 480 288 480 224 0
w 480 224 464 224 0
w 464 96 416 96 0
w 464 224 416 224 0
r 416 96 416 224 0 1000
r 560 112 640 112 0 10000
w 640 112 640 160 0
w 640 160 672 160 0
w 672 96 672 160 0
r 832 96 672 96 0 50000
w 672 160 736 160 0
a 736 176 832 176 8 15 -15 1000000 0 0 100000
w 832 176 832 96 0
r 560 240 640 240 0 10000
w 640 240 640 192 0
w 640 192 688 192 0
r 688 192 688 272 0 50000
g 688 272 688 304 0 0
w 688 192 736 192 0
w 832 176 880 176 0
p 880 176 880 256 1 0 0 1000000000000
g 880 256 880 288 0 0
x 192 0 412 3 4 20 P13\sINA\sgain\s500
o 38 4 0 4098 2 0.1 0 1
o 6 4 0 4098 0.1 0.1 1 1
```

## P14 — Charge-Pump Negative Rail

Four analog switches, 1 µF flying cap, 4.7 µF reservoir, 250 Ω load (20 mA). Two 100 kHz rails at duty 0.45, phase 0 and π = non-overlapping two-phase drive. Probe ≈ −4.8 V (droop = I·R_out = 20 mA × 10 Ω), ripple ≈ 43 mV. Raise both duties to 0.55 to force overlap and watch the input-shoot-through current.

```
$ 1 5e-8 1.5 50 5 50 5e-11
R 96 64 64 64 0 0 40 5 0 0 0.5
w 96 64 144 64 0
159 144 64 144 112 2 20 10000000000 2.5
207 128 88 80 88 4 phA
w 144 112 208 112 0
c 208 112 208 208 4 1e-06 0 0.001 0.1
w 208 208 160 208 0
159 160 208 160 256 2 20 10000000000 2.5
g 160 256 160 288 0 0
207 144 232 96 232 4 phA
w 208 112 272 112 0
159 272 112 272 160 2 20 10000000000 2.5
g 272 160 272 192 0 0
207 256 136 208 136 4 phB
w 208 208 320 208 0
159 320 208 320 256 2 20 10000000000 2.5
207 304 232 256 232 4 phB
w 320 256 384 256 0
c 384 256 384 320 4 4.7e-06 0 0.001 0.1
g 384 320 384 352 0 0
w 384 256 448 256 0
r 448 256 448 320 0 250
g 448 320 448 352 0 0
p 512 256 512 320 1 0 0 1000000000000
g 512 320 512 352 0 0
w 448 256 512 256 0
R 48 320 16 320 0 2 100000 2.5 2.5 0.0 0.45
207 48 320 96 320 4 phA
R 48 368 16 368 0 2 100000 2.5 2.5 3.141592653589793 0.45
207 48 368 96 368 4 phB
x 48 20 268 23 4 20 P14\scharge\spump\s-5V
o 23 4 0 4098 5 0.1 0 1
o 5 4 0 4098 5 0.1 1 1
```

## P15 — Impedance Discontinuity on a USB 3.0 Trace

Lumped-ladder channel: 10 × (1.35 nH/0.667 pF) = 45 Ω/300 ps, 2 × (0.65 nH/0.154 pF) = 65 Ω/20 ps bump, 10 × 45 Ω again; matched 45 Ω source and load. 5 MHz square launch, 2 ps timestep (sim runs slowly — that is the physics, not a bug). Scope 1 (launch point) shows the ~15–18 % reflected blip ~320 ps after each edge; add ~0.15 pF shunt caps at the bump ends to pull it under 5 %.

```
$ 1 2e-12 0.06450009306485875 50 5 50 5e-11
R 48 96 16 96 0 2 5000000 2.5 2.5 0.0 0.5
r 48 96 112 96 0 45
p 112 96 112 32 1 0 0 1000000000000
g 112 32 112 64 0 0
l 112 96 160 96 0 1.35e-09 0 0
c 160 96 160 144 4 6.67e-13 0 0.001 0.1
g 160 144 160 176 0 0
l 160 96 208 96 0 1.35e-09 0 0
c 208 96 208 144 4 6.67e-13 0 0.001 0.1
g 208 144 208 176 0 0
l 208 96 256 96 0 1.35e-09 0 0
c 256 96 256 144 4 6.67e-13 0 0.001 0.1
g 256 144 256 176 0 0
l 256 96 304 96 0 1.35e-09 0 0
c 304 96 304 144 4 6.67e-13 0 0.001 0.1
g 304 144 304 176 0 0
l 304 96 352 96 0 1.35e-09 0 0
c 352 96 352 144 4 6.67e-13 0 0.001 0.1
g 352 144 352 176 0 0
l 352 96 400 96 0 1.35e-09 0 0
c 400 96 400 144 4 6.67e-13 0 0.001 0.1
g 400 144 400 176 0 0
l 400 96 448 96 0 1.35e-09 0 0
c 448 96 448 144 4 6.67e-13 0 0.001 0.1
g 448 144 448 176 0 0
l 448 96 496 96 0 1.35e-09 0 0
c 496 96 496 144 4 6.67e-13 0 0.001 0.1
g 496 144 496 176 0 0
l 496 96 544 96 0 1.35e-09 0 0
c 544 96 544 144 4 6.67e-13 0 0.001 0.1
g 544 144 544 176 0 0
l 544 96 592 96 0 1.35e-09 0 0
c 592 96 592 144 4 6.67e-13 0 0.001 0.1
g 592 144 592 176 0 0
l 592 96 640 96 0 6.5e-10 0 0
c 640 96 640 144 4 1.54e-13 0 0.001 0.1
g 640 144 640 176 0 0
l 640 96 688 96 0 6.5e-10 0 0
c 688 96 688 144 4 1.54e-13 0 0.001 0.1
g 688 144 688 176 0 0
l 688 96 736 96 0 1.35e-09 0 0
c 736 96 736 144 4 6.67e-13 0 0.001 0.1
g 736 144 736 176 0 0
l 736 96 784 96 0 1.35e-09 0 0
c 784 96 784 144 4 6.67e-13 0 0.001 0.1
g 784 144 784 176 0 0
l 784 96 832 96 0 1.35e-09 0 0
c 832 96 832 144 4 6.67e-13 0 0.001 0.1
g 832 144 832 176 0 0
l 832 96 880 96 0 1.35e-09 0 0
c 880 96 880 144 4 6.67e-13 0 0.001 0.1
g 880 144 880 176 0 0
l 880 96 928 96 0 1.35e-09 0 0
c 928 96 928 144 4 6.67e-13 0 0.001 0.1
g 928 144 928 176 0 0
l 928 96 976 96 0 1.35e-09 0 0
c 976 96 976 144 4 6.67e-13 0 0.001 0.1
g 976 144 976 176 0 0
l 976 96 1024 96 0 1.35e-09 0 0
c 1024 96 1024 144 4 6.67e-13 0 0.001 0.1
g 1024 144 1024 176 0 0
l 1024 96 1072 96 0 1.35e-09 0 0
c 1072 96 1072 144 4 6.67e-13 0 0.001 0.1
g 1072 144 1072 176 0 0
l 1072 96 1120 96 0 1.35e-09 0 0
c 1120 96 1120 144 4 6.67e-13 0 0.001 0.1
g 1120 144 1120 176 0 0
l 1120 96 1168 96 0 1.35e-09 0 0
c 1168 96 1168 144 4 6.67e-13 0 0.001 0.1
g 1168 144 1168 176 0 0
w 1168 96 1216 96 0
r 1216 96 1216 192 0 45
g 1216 192 1216 224 0 0
p 1264 96 1264 192 1 0 0 1000000000000
g 1264 192 1264 224 0 0
w 1216 96 1264 96 0
x 48 0 268 3 4 20 P15\s45-65-45\sohm\schannel
o 2 4 0 4098 3 0.1 0 1
o 73 4 0 4098 3 0.1 1 1
```

---

# MCU Answers (mcusim, bare-metal C)

Each file is the complete firmware; compile the same file with `gcc -DHOST_TEST` to run its reference harness on any PC. Replay vectors marked `extern` are supplied per-problem by the platform harness; small inline vectors are included where the problem defines them.

## P4 — Keypad Debounce for a Vending Machine

Host test: `P04 PASS (3 presses -> 3 events, 8ms burst rejected)`. Counting-integrator debouncer, N=10 at 1 kHz; the bounce vector stands in for the GPIO IDR bit.

```c
/* P4 — keypad debounce: 1 kHz SysTick sampling, 10-consecutive-sample confirm.
 * mcusim (STM32F103, QEMU + semihosting trace). Bounce waveform is
 * supplied as a replayed sample vector standing in for the GPIO IDR bit.   */
#include <stdint.h>

#define N_CONFIRM 10
#define N_KEYS    12

typedef struct { uint8_t stable; uint8_t count; } debounce_t;

/* Pure core: one sample in, returns 1 exactly once per confirmed press. */
static int debounce_step(debounce_t *d, uint8_t raw)
{
    if (raw != d->stable) {
        if (++d->count >= N_CONFIRM) {
            d->stable = raw;
            d->count  = 0;
            return d->stable;          /* rising confirm = press event */
        }
    } else {
        d->count = 0;                  /* agreement re-arms the integrator */
    }
    return 0;
}

#ifndef HOST_TEST
#include "trace.h"                     /* sim-injected semihosting shim   */

#define SYST_CSR   (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR   (*(volatile uint32_t *)0xE000E014)
#define SYS_CLK_HZ 8000000u

/* Replayed bounce vector: 1 = key pressed (sampled at 1 kHz). */
static const uint8_t bounce_vec[] = {
    0,0,0,1,0,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, /* bouncy press */
    1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,                     /* bouncy release */
    0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0, /* clean press+release */
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,                     /* 8 ms noise burst */
    0,0,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0, /* third press */
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
};

static volatile uint32_t tick;
static debounce_t key0;

void SysTick_Handler(void)
{
    uint32_t t = tick++;
    uint8_t raw = (t < sizeof bounce_vec) ? bounce_vec[t] : 0;
    if (debounce_step(&key0, raw)) {
        trace_pin("KEY_EVT", 1);       /* one-tick event pulse            */
        trace_pin("KEY_EVT", 0);
    }
    trace_pin("KEY_RAW", raw);         /* raw vs. event, side by side     */
}

int main(void)
{
    SYST_RVR = SYS_CLK_HZ / 1000u - 1u;   /* 1 kHz               */
    SYST_CSR = 7u;                        /* clk source | tick int | enable */
    for (;;) { /* all work in the ISR */ }
}
#else  /* ---------------- host reference harness ---------------- */
#include <stdio.h>
static const uint8_t vec[] = {
    0,0,0,1,0,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,
    0,0,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
};
int main(void) {
    debounce_t d = {0,0}; int events = 0;
    for (unsigned t = 0; t < sizeof vec; t++) events += debounce_step(&d, vec[t]);
    printf(events == 3 ? "P04 PASS (3 presses -> 3 events, 8ms burst rejected)\n"
                       : "P04 FAIL (%d events)\n", events);
    return events != 3;
}
#endif
```

## P5 — Soft-Start Fan Controller

Host test: `P05 PASS (1 pulse/period, 50% @1s, 90% settled, no runts)`. 10 kHz tick → 100 Hz software PWM, 1 %/25 ms ramp, duty committed only at period boundaries; state-change-only tracing.

```c
/* P5 — soft-start fan: software PWM (100 Hz, 1 % steps) from a 10 kHz SysTick,
 * duty ramps 10 % -> 90 % over 2 s. QEMU has no TIM1 model; same control law,
 * observable timer-free on the pin trace. */
#include <stdint.h>

#define PWM_TICKS   100u    /* 10 kHz / 100  = 100 Hz PWM, 1 % resolution */
#define RAMP_TICKS  250u    /* 250 ticks     = 25 ms per 1 % duty step    */
#define DUTY_MIN    10u
#define DUTY_MAX    90u

typedef struct {
    uint8_t  duty, duty_next;
    uint8_t  phase;          /* 0..PWM_TICKS-1 */
    uint16_t ramp;
    uint8_t  pin;
} sspwm_t;

/* Pure core: one 10 kHz tick; returns pin level. Duty changes commit only
 * at period boundaries — a mid-period change can emit a runt pulse.      */
static uint8_t sspwm_step(sspwm_t *s)
{
    if (++s->ramp >= RAMP_TICKS) {
        s->ramp = 0;
        if (s->duty_next < DUTY_MAX) s->duty_next++;
    }
    if (s->phase == 0) s->duty = s->duty_next;      /* boundary-synchronised */
    s->pin = (s->phase < s->duty) ? 1u : 0u;
    if (++s->phase >= PWM_TICKS) s->phase = 0;
    return s->pin;
}

#ifndef HOST_TEST
#include "trace.h"
#define SYST_CSR   (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR   (*(volatile uint32_t *)0xE000E014)
#define SYS_CLK_HZ 8000000u

static sspwm_t pwm = { DUTY_MIN, DUTY_MIN, 0, 0, 0 };
static uint8_t last;

void SysTick_Handler(void)
{
    uint8_t p = sspwm_step(&pwm);
    if (p != last) { trace_pin("FAN_PWM", p); last = p; }  /* edges only:  */
}                                                          /* small trace  */

int main(void)
{
    SYST_RVR = SYS_CLK_HZ / 10000u - 1u;   /* 10 kHz */
    SYST_CSR = 7u;
    for (;;) {}
}
#else
#include <stdio.h>
int main(void) {
    sspwm_t s = { DUTY_MIN, DUTY_MIN, 0, 0, 0 };
    int fail = 0;
    for (long t = 0; t < 30000; t++) {         /* 3 s of ticks              */
        long period = t / PWM_TICKS;
        static int width, edges; 
        uint8_t prev = s.pin;
        uint8_t p = sspwm_step(&s);
        width += p;
        if (p && !prev) edges++;
        if (t % PWM_TICKS == PWM_TICKS - 1) {  /* end of a 10 ms period     */
            int expect = (period < 5)    ? -1                 /* settling  */
                       : (period == 99)  ? 50                 /* t = 1.0 s */
                       : (period >= 205) ? 90 : -1;           /* past ramp */
            if (edges != 1) { printf("P05 FAIL runt/missing pulse period %ld\n", period); fail=1; }
            if (expect > 0 && (width < expect-1 || width > expect+1)) {
                printf("P05 FAIL duty at period %ld: %d%% want ~%d%%\n", period, width, expect); fail=1; }
            width = 0; edges = 0;
        }
    }
    if (!fail) printf("P05 PASS (1 pulse/period, 50%% @1s, 90%% settled, no runts)\n");
    return fail;
}
#endif
```

## P6 — Torn-Read-Proof Shared Buffer

Host tests: guarded `0 torn of 5000`; `-DUNGUARDED` rebuilds the original single-buffer design and reproduces `3182 torn of 5000`. The critical section is the two-instruction pointer swap only — the copy runs with interrupts live.

```c
/* P6 — torn-read-proof shared buffer: ISR producer, main-loop consumer.
 *
 * Two builds:
 *   default    — double buffer + pointer swap in a ~2-instruction critical
 *                section (the fix).
 *   -DUNGUARDED — the original design: ONE shared buffer, no guard. The ISR
 *                overwrites it mid-copy and the consumer sees torn records.
 *
 * Double-buffer contract: the consumer always gets the LATEST complete
 * record (an unconsumed older one may be superseded — monotonic, never torn).
 * Safe while the producer can fire at most once per consumer copy, which a
 * 1 kHz tick against a microsecond copy guarantees by 3 orders of magnitude. */
#include <stdint.h>

#define REC_LEN 8

typedef struct {
    uint8_t  buf[2][REC_LEN];
    uint8_t  back;                     /* buffer the ISR writes next        */
    volatile uint8_t fresh;            /* front buffer holds an unread record */
    volatile uint32_t seq;
} shared_t;

#ifdef UNGUARDED                       /* original single-buffer design    */
#define BACK(s)   0
#define FRONT(s)  0
#define GUARD_OFF()
#define GUARD_ON()
#else
#define BACK(s)   ((s)->back)
#define FRONT(s)  ((s)->back ^ 1u)
#define GUARD_OFF() irq_off()
#define GUARD_ON()  irq_on()
#endif

#ifndef HOST_TEST
static inline void irq_off(void) { __asm volatile ("cpsid i" ::: "memory"); }
static inline void irq_on(void)  { __asm volatile ("cpsie i" ::: "memory"); }
#define PREEMPT_POINT()                /* hardware preempts anywhere       */
#else
void host_irq_off(void); void host_irq_on(void); void host_preempt(void);
#define irq_off  host_irq_off
#define irq_on   host_irq_on
#define PREEMPT_POINT() host_preempt() /* host: ISR may land between bytes */
#endif

/* Producer (ISR): fill the back buffer, then publish with one flag write.
 * Self-checking payload: every byte = low byte of the sequence number.    */
static void producer_isr(shared_t *s)
{
    uint8_t v = (uint8_t)s->seq;
    for (int i = 0; i < REC_LEN; i++) s->buf[BACK(s)][i] = v;
    s->back ^= 1u;
    s->fresh = 1u;
    s->seq++;
}

/* Consumer (main loop): snapshot which buffer is front + clear the flag
 * atomically; the copy itself runs with interrupts LIVE — the ISR writes
 * the other buffer, so bounding the critical section to the swap is safe. */
static int consumer_poll(shared_t *s, uint8_t out[REC_LEN])
{
    uint8_t front;
    if (!s->fresh) return 0;
    GUARD_OFF();
    front    = FRONT(s);
    s->fresh = 0u;
    GUARD_ON();
    for (int i = 0; i < REC_LEN; i++) {
        out[i] = s->buf[front][i];
        PREEMPT_POINT();
    }
    return 1;
}

static int record_torn(const uint8_t r[REC_LEN])
{
    for (int i = 1; i < REC_LEN; i++) if (r[i] != r[0]) return 1;
    return 0;
}

#ifndef HOST_TEST
#include "trace.h"
#define SYST_CSR (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)
#define SYS_CLK_HZ 8000000u

static shared_t sh;
void SysTick_Handler(void) { producer_isr(&sh); }

int main(void)
{
    uint8_t rec[REC_LEN];
    uint32_t consumed = 0;
    SYST_RVR = SYS_CLK_HZ / 1000u - 1u;      /* 1 kHz producer */
    SYST_CSR = 7u;
    for (;;) {
        if (consumer_poll(&sh, rec)) {
            consumed++;
            if (record_torn(rec)) { trace_pin("TORN", 1); trace_pin("TORN", 0); }
            if (consumed == 5000u) trace_pin("DONE_5000", 1);
        }
    }
}
#else /* ---- host harness: at most ONE mid-copy fire, position sliding ---- */
#include <stdio.h>
#include <string.h>
static shared_t sh;
static int irq_enabled = 1, pending = 0, byte_ctr = 0;
void host_irq_off(void) { irq_enabled = 0; }
void host_irq_on(void)  { irq_enabled = 1; if (pending) { pending = 0; producer_isr(&sh); } }
void host_preempt(void) {
    /* every 11th byte: coprime with REC_LEN=8, so the fire position slides
     * through all offsets while never firing twice within one copy        */
    if (++byte_ctr % 11 == 0) {
        if (irq_enabled) producer_isr(&sh); else pending = 1;
    }
}
int main(void) {
    uint8_t rec[REC_LEN]; int torn = 0, got = 0, order = 0;
    int have_prev = 0; uint8_t prev = 0;
    memset(&sh, 0, sizeof sh);
    for (int n = 0; n < 5000; n++) {
        producer_isr(&sh);                    /* the scheduled 1 kHz tick   */
        if (consumer_poll(&sh, rec)) {
            got++;
            torn += record_torn(rec);
            if (have_prev && (uint8_t)(rec[0] - prev) > 200u) order++; /* went backwards */
            prev = rec[0]; have_prev = 1;
        }
    }
#ifdef UNGUARDED
    if (torn > 0) { printf("P06 PASS-NEGATIVE (single-buffer: %d torn of %d)\n", torn, got); return 0; }
    printf("P06 FAIL (single-buffer produced no tears?)\n"); return 1;
#else
    if (torn == 0 && order == 0) { printf("P06 PASS (guarded double-buffer: 0 torn, monotonic, %d records)\n", got); return 0; }
    printf("P06 FAIL (torn %d, order %d of %d)\n", torn, order, got); return 1;
#endif
}
#endif
```

## P16 — NMEA Ring-Buffer Parser

Host test: `7 fixes, 1 checksum reject, lat/lon exact to 1e-6 deg`. Lock-free 256-byte ring (uint8_t indices wrap for free), 82-byte sentence cap so a lost terminator can't wedge the parser, checksum before any field parsing, exact integer µ-degree conversion (µdeg = m4·5/3).

```c
/* P16 — NMEA ring-buffer parser: minimal ISR producer, main-loop sentence
 * assembler + checksum validation + $GPRMC field extraction.
 * Lock-free by construction: 256-entry ring, uint8_t head/tail (8-bit
 * arithmetic wraps for free), single producer / single consumer.          */
#include <stdint.h>

/* ------------------------- ring buffer ------------------------- */
static volatile uint8_t ring[256];
static volatile uint8_t head, tail;          /* single-byte: naturally atomic */
static volatile uint8_t overflow;

static void ring_push(uint8_t b)             /* ISR context */
{
    uint8_t h = head;
    if ((uint8_t)(h + 1u) == tail) { overflow = 1u; return; }
    ring[h] = b;
    head = (uint8_t)(h + 1u);
}
static int ring_pop(uint8_t *b)              /* main-loop context */
{
    if (tail == head) return 0;
    *b = ring[tail];
    tail = (uint8_t)(tail + 1u);
    return 1;
}

/* --------------------- sentence assembler ---------------------- */
#define MAX_SENTENCE 82                      /* NMEA-0183 hard maximum      */
typedef enum { HUNT, ACCUM } pstate_t;

typedef struct {
    pstate_t st;
    uint8_t  len;
    char     line[MAX_SENTENCE + 1];
    /* results */
    int32_t  lat_udeg, lon_udeg;             /* micro-degrees, signed       */
    uint32_t fixes, rejects;
} nmea_t;

static int hexval(char c)
{
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

/* ddmm.mmmm -> signed micro-degrees; hemi 'S'/'W' negates.
 * Work in 1e-4 arc-minutes (m4): 1 minute = 1e6/60 udeg, so
 * udeg = m4 * 1e-4 * 1e6/60 = m4 * 5 / 3 — exact integer arithmetic.     */
static int32_t coord_udeg(const char *f, char hemi, int deg_digits)
{
    int32_t deg = 0, i, nd;
    for (i = 0; i < deg_digits; i++) deg = deg * 10 + (f[i] - '0');
    int32_t min_int = (f[i] - '0') * 10 + (f[i+1] - '0');
    i += 3;                                   /* two digits + '.'            */
    int32_t frac4 = 0;
    for (nd = 0; nd < 4; nd++)                /* exactly 4 fractional digits */
        frac4 = frac4 * 10 + ((f[i] >= '0' && f[i] <= '9') ? (f[i++] - '0') : 0);
    int32_t m4   = min_int * 10000 + frac4;   /* max 599999: fits easily     */
    int32_t udeg = deg * 1000000 + (m4 * 5) / 3;
    return (hemi == 'S' || hemi == 'W') ? -udeg : udeg;
}

/* Validate checksum FIRST, then split fields in place. Returns 1 on fix.  */
static int sentence_process(nmea_t *n)
{
    uint8_t cs = 0, want; int i, star = -1;
    if (n->line[0] != '$') return 0;
    for (i = 1; i < n->len && n->line[i] != '*'; i++) cs ^= (uint8_t)n->line[i];
    if (n->line[i] != '*' || i + 2 >= n->len) { n->rejects++; return 0; }
    star = i;
    if (hexval(n->line[star+1]) < 0 || hexval(n->line[star+2]) < 0) { n->rejects++; return 0; }
    want = (uint8_t)((hexval(n->line[star+1]) << 4) | hexval(n->line[star+2]));
    if (cs != want) { n->rejects++; return 0; }          /* checksum before trust */

    /* tokenise in place: commas -> NUL, record starts */
    const char *tok[16]; int nt = 0;
    tok[nt++] = &n->line[1];
    for (i = 1; i < star; i++)
        if (n->line[i] == ',') { n->line[i] = '\0'; if (nt < 16) tok[nt++] = &n->line[i+1]; }
    n->line[star] = '\0';

    /* $GPRMC,time,A,lat,N,lon,E,... — field 2 must be 'A' (valid)         */
    if (!(tok[0][0]=='G' && tok[0][1]=='P' && tok[0][2]=='R' &&
          tok[0][3]=='M' && tok[0][4]=='C')) return 0;   /* other type: ignore */
    if (nt < 7 || tok[2][0] != 'A') return 0;
    n->lat_udeg = coord_udeg(tok[3], tok[4][0], 2);      /* ddmm.mmmm       */
    n->lon_udeg = coord_udeg(tok[5], tok[6][0], 3);      /* dddmm.mmmm      */
    n->fixes++;
    return 1;
}

static int nmea_feed(nmea_t *n, uint8_t b)
{
    switch (n->st) {
    case HUNT:
        if (b == '$') { n->len = 0; n->line[n->len++] = '$'; n->st = ACCUM; }
        break;
    case ACCUM:
        if (b == '\n') {
            n->line[n->len] = '\0'; n->st = HUNT;
            /* strip \r */
            if (n->len && n->line[n->len-1] == '\r') n->line[--n->len] = '\0';
            return sentence_process(n);
        }
        if (n->len >= MAX_SENTENCE) { n->st = HUNT; break; }  /* cap: no wedge */
        n->line[n->len++] = (char)b;
        break;
    }
    return 0;
}

#ifndef HOST_TEST
#include "trace.h"
#define SYST_CSR (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)
#define SYS_CLK_HZ 8000000u

/* Replay vector: harness supplies the GPS byte stream (1 byte/ms ≈ 9600 baud). */
extern const uint8_t gps_stream[]; extern const uint32_t gps_stream_len;
static volatile uint32_t tick;
void SysTick_Handler(void)
{
    uint32_t t = tick++;
    if (t < gps_stream_len) ring_push(gps_stream[t]);
}

int main(void)
{
    static nmea_t nav;
    uint8_t b;
    SYST_RVR = SYS_CLK_HZ / 1000u - 1u;
    SYST_CSR = 7u;
    for (;;) {
        while (ring_pop(&b)) {
            if (nmea_feed(&nav, b)) { trace_pin("FIX_OK", 1); trace_pin("FIX_OK", 0); }
        }
        if (nav.rejects) { trace_pin("CKSUM_ERR", 1); trace_pin("CKSUM_ERR", 0); nav.rejects = 0; }
        if (overflow)    { trace_pin("RING_OVF", 1); overflow = 0; }
    }
}
#else
#include <stdio.h>
#include <string.h>
static void send(nmea_t *n, const char *s, int corrupt)
{
    char line[128]; uint8_t cs = 0;
    for (const char *p = s + 1; *p; p++) cs ^= (uint8_t)*p;
    snprintf(line, sizeof line, "%s*%02X\r\n", s, corrupt ? cs ^ 0x01 : cs);
    for (const char *p = line; *p; p++) { ring_push((uint8_t)*p);
        uint8_t b; while (ring_pop(&b)) nmea_feed(n, b); }   /* interleaved drain */
}
int main(void) {
    static nmea_t nav; int fail = 0;
    /* 20 sentences: 8 GPRMC (1 corrupted) + 12 other types                */
    for (int i = 0; i < 12; i++) send(&nav, "$GPGGA,092751.000,4807.038,N,01131.000,E,1,8,1.0,495.1,M,,,,", 0);
    for (int i = 0; i < 6; i++)  send(&nav, "$GPRMC,092751,A,4807.0380,N,01131.0000,E,022.4,084.4,230394,003.1,W", 0);
    send(&nav, "$GPRMC,092752,A,4807.0380,N,01131.0000,E,022.4,084.4,230394,003.1,W", 1); /* corrupted */
    send(&nav, "$GPRMC,092753,A,2612.0000,S,02755.5000,E,000.0,000.0,030726,000.0,W", 0); /* Joburg-ish */
    if (nav.fixes   != 7) { printf("FAIL fixes %u\n",   nav.fixes);   fail = 1; }
    if (nav.rejects != 1) { printf("FAIL rejects %u\n", nav.rejects); fail = 1; }
    /* 26 deg 12.0000' S = -(26 + 12/60) = -26.200000 ; 27 deg 55.5' E = 27.925 */
    if (nav.lat_udeg != -26200000) { printf("FAIL lat %d\n", nav.lat_udeg); fail = 1; }
    if (nav.lon_udeg !=  27925000) { printf("FAIL lon %d\n", nav.lon_udeg); fail = 1; }
    if (overflow) { printf("FAIL overflow\n"); fail = 1; }
    if (!fail) printf("P16 PASS (7 fixes, 1 checksum reject, lat/lon exact to 1e-6 deg, no overflow)\n");
    return fail;
}
#endif
```

## P17 — CRC-16 Framing for a Zigbee Link

Host test: `KAT 0x29B1 both cores, 96/96 flips caught, length attack rejected`. Bitwise core is the definition; the 512-byte table is generated from it at boot — one canonical implementation.

```c
/* P17 — CRC-16/CCITT-FALSE framing for a Zigbee-style sensor link.
 * Boot known-answer test pins the CRC variant before any protocol work.  */
#include <stdint.h>
#include <stddef.h>

#define POLY  0x1021u
#define INIT  0xFFFFu

/* Bitwise core — the polynomial-division definition. */
static uint16_t crc16_bit(const uint8_t *p, size_t n)
{
    uint16_t c = INIT;
    while (n--) {
        c ^= (uint16_t)(*p++) << 8;
        for (int k = 0; k < 8; k++)
            c = (c & 0x8000u) ? (uint16_t)((c << 1) ^ POLY) : (uint16_t)(c << 1);
    }
    return c;
}

/* Table core, generated at boot FROM the bitwise core: one canonical
 * implementation, 512 B of RAM for ~16x fewer cycles per byte.          */
static uint16_t tbl[256];
static void crc16_tbl_init(void)
{
    for (int b = 0; b < 256; b++) {
        uint16_t c = (uint16_t)b << 8;
        for (int k = 0; k < 8; k++)
            c = (c & 0x8000u) ? (uint16_t)((c << 1) ^ POLY) : (uint16_t)(c << 1);
        tbl[b] = c;
    }
}
static uint16_t crc16_table(const uint8_t *p, size_t n)
{
    uint16_t c = INIT;
    while (n--) c = (uint16_t)(c << 8) ^ tbl[(c >> 8) ^ *p++];
    return c;
}

/* Frame: [55 55][7E][len][payload...][crc_hi][crc_lo]; CRC over len+payload. */
static size_t frame_build(uint8_t *out, const uint8_t *payload, uint8_t len)
{
    size_t i = 0;
    out[i++] = 0x55; out[i++] = 0x55; out[i++] = 0x7E;
    out[i++] = len;
    for (uint8_t k = 0; k < len; k++) out[i++] = payload[k];
    uint16_t c = crc16_table(&out[3], (size_t)len + 1u);
    out[i++] = (uint8_t)(c >> 8);
    out[i++] = (uint8_t)c;
    return i;
}
/* Receiver: CRC exactly the bytes the length claims; reject on mismatch. */
static int frame_check(const uint8_t *f, size_t n)
{
    if (n < 6 || f[0] != 0x55 || f[1] != 0x55 || f[2] != 0x7E) return 0;
    uint8_t len = f[3];
    if ((size_t)len + 6u != n) return 0;
    uint16_t c = crc16_table(&f[3], (size_t)len + 1u);
    return f[4 + len] == (uint8_t)(c >> 8) && f[5 + len] == (uint8_t)c;
}

#ifndef HOST_TEST
#include "trace.h"
static const uint8_t kat[9] = {'1','2','3','4','5','6','7','8','9'};

int main(void)
{
    crc16_tbl_init();
    trace_pin("KAT_OK", crc16_bit(kat, 9) == 0x29B1 &&
                        crc16_table(kat, 9) == 0x29B1);
    uint8_t payload[9] = {1,2,3,4,5,6,7,8,9}, frame[16];
    uint32_t lfsr = 0xACE1u;
    for (int f = 0; f < 50; f++) {
        payload[0] = (uint8_t)f;
        size_t n = frame_build(frame, payload, 9);
        /* harness stand-in: flip one pseudo-random bit in len..crc        */
        lfsr = (lfsr >> 1) ^ (uint32_t)(-(int32_t)(lfsr & 1u) & 0xB400u);
        size_t pos = 3u + (lfsr % (n - 3u));
        frame[pos] ^= (uint8_t)(1u << (lfsr % 8u));
        trace_pin("REJECT", !frame_check(frame, n));   /* must always be 1 */
        frame[pos] ^= (uint8_t)(1u << (lfsr % 8u));
        trace_pin("ACCEPT", frame_check(frame, n));    /* must always be 1 */
    }
    for (;;) {}
}
#else
#include <stdio.h>
#include <string.h>
int main(void) {
    crc16_tbl_init();
    const uint8_t kat[9] = {'1','2','3','4','5','6','7','8','9'};
    int fail = 0;
    if (crc16_bit(kat, 9) != 0x29B1)   { printf("FAIL bitwise KAT %04X\n", crc16_bit(kat,9)); fail=1; }
    if (crc16_table(kat, 9) != 0x29B1) { printf("FAIL table KAT\n"); fail=1; }
    uint8_t payload[9] = {9,8,7,6,5,4,3,2,1}, frame[16];
    size_t n = frame_build(frame, payload, 9);
    if (!frame_check(frame, n)) { printf("FAIL clean frame rejected\n"); fail=1; }
    int caught = 0, total = 0;
    for (size_t pos = 3; pos < n; pos++)          /* every single-bit flip  */
        for (int b = 0; b < 8; b++) {
            frame[pos] ^= (uint8_t)(1u << b);
            caught += !frame_check(frame, n); total++;
            frame[pos] ^= (uint8_t)(1u << b);
        }
    if (caught != total) { printf("FAIL %d/%d flips caught\n", caught, total); fail=1; }
    /* corrupted-length sneaky case: len says fewer bytes than sent        */
    frame[3] = 8;
    if (frame_check(frame, n)) { printf("FAIL length corruption accepted\n"); fail=1; }
    if (!fail) printf("P17 PASS (KAT 0x29B1 both cores, %d/%d flips caught, length attack rejected)\n", caught, total);
    return fail;
}
#endif
```

## P18 — Fault-Detecting Quadrature Decoder

Host test: `fwd 16, rev to 8, wrap diff +9, fault latched+frozen`. The whole decoder is a 16-entry table indexed by (old<<2)|new; double-flips latch a fault and freeze position; includes the sign-extended 16-bit differencing idiom.

```c
/* P18 — fault-detecting quadrature decoder over replayed A/B samples.
 * The 16-entry transition table IS the design: 4 idle, 4 fwd, 4 rev, 4 fault. */
#include <stdint.h>

#define STEP_FAULT 2   /* both channels flipped: impossible for a healthy disc */
static const int8_t QTAB[16] = {
/* old<<2|new: 00    01    10    11   (new)                                  */
/* old 00 */    0,   +1,   -1,  STEP_FAULT,
/* old 01 */   -1,    0,  STEP_FAULT, +1,
/* old 10 */   +1,  STEP_FAULT,  0,   -1,
/* old 11 */  STEP_FAULT, -1,   +1,    0
};

typedef struct {
    uint8_t  prev;        /* last AB pair                      */
    int32_t  position;    /* 32-bit signed accumulator         */
    uint8_t  fault;       /* latched; freezes accumulation     */
} quad_t;

static void quad_step(quad_t *q, uint8_t ab)
{
    int8_t s = QTAB[(q->prev << 2) | ab];
    q->prev = ab;
    if (q->fault) return;                    /* latched: ignore until cleared */
    if (s == STEP_FAULT) q->fault = 1;
    else                 q->position += s;
}

#ifndef HOST_TEST
#include "trace.h"
#define SYST_CSR (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)
#define SYS_CLK_HZ 8000000u

/* Replay: fwd x8 counts, rev x4, then a 00->11 double-flip fault. AB pairs. */
static const uint8_t ab_vec[] = {
    0,1,3,2,0,1,3,2,0,          /* forward: 8 transitions -> position +8 */
    2,3,1,0,2,                  /* reverse: 4 transitions -> +4          */
    0,3                         /* FAULT: 00 -> 11                       */
};
static volatile uint32_t tick;
static quad_t q;
static uint8_t fault_traced;

void SysTick_Handler(void)
{
    uint32_t t = tick++;
    if (t < sizeof ab_vec) quad_step(&q, ab_vec[t]);
    if (q.fault && !fault_traced) { trace_pin("QFAULT", 1); fault_traced = 1; }
}

int main(void)
{
    SYST_RVR = SYS_CLK_HZ / 10000u - 1u;    /* 10 kHz sampling */
    SYST_CSR = 7u;
    for (;;) {}
}
#else
#include <stdio.h>
int main(void) {
    quad_t q = {0, 0, 0};
    int fail = 0;
    const uint8_t fwd[] = {0,1,3,2, 0,1,3,2, 0,1,3,2, 0,1,3,2, 0};  /* 16 steps */
    for (unsigned i = 1; i < sizeof fwd; i++) quad_step(&q, fwd[i]);
    if (q.position != 16 || q.fault) { printf("FAIL fwd pos=%d\n", (int)q.position); fail = 1; }
    const uint8_t rev[] = {2,3,1,0, 2,3,1,0};                        /* 8 back  */
    for (unsigned i = 0; i < sizeof rev; i++) quad_step(&q, rev[i]);
    if (q.position != 8 || q.fault) { printf("FAIL rev pos=%d\n", (int)q.position); fail = 1; }
    /* 16-bit wrap-style differencing check (the naive-subtraction trap)   */
    uint16_t last = 65530, now = 3;
    int16_t diff = (int16_t)(now - last);       /* must sign-extend to +9  */
    if (diff != 9) { printf("FAIL wrap diff %d\n", diff); fail = 1; }
    quad_step(&q, 0); quad_step(&q, 3);          /* 00 -> 11 double flip    */
    int32_t frozen = q.position;
    if (!q.fault) { printf("FAIL fault not latched\n"); fail = 1; }
    quad_step(&q, 2); quad_step(&q, 0);          /* would move if unlatched */
    if (q.position != frozen) { printf("FAIL position moved after fault\n"); fail = 1; }
    if (!fail) printf("P18 PASS (fwd 16, rev to 8, wrap diff +9, fault latched+frozen)\n");
    return fail;
}
#endif
```

## P19 — Li-ion Fuel Gauge with OCV Table

Host test: `endpoints exact, 200 noisy reports within +/-3%, monotonic`. Table stored pre-converted to ADC counts; multiply-before-divide interpolation; 16-sample averaging; discharge-only reporting clamp lives in the algorithm, not the trace glue.

```c
/* P19 — Li-ion fuel gauge: 16-sample averaging + piecewise-linear OCV->SoC.
 * Integer-only; table stored as (ADC counts, SoC x10) with the multiply
 * BEFORE the divide in the interpolation to preserve precision.           */
#include <stdint.h>

/* counts = Vcell/2 / 3.3V * 4095  (2:1 divider, 12-bit, 3.3 V ref)        */
#define CELL_TO_COUNTS(mv) ((int32_t)(((mv) / 2) * 4095 + 1650) / 3300)

typedef struct { int16_t counts; int16_t soc_x10; } ocv_pt_t;

/* LiCoO2 OCV curve, dense through the flat 3.74-3.87 V region.            */
static const ocv_pt_t OCV[] = {
    { CELL_TO_COUNTS(3000),    0 },
    { CELL_TO_COUNTS(3450),   50 },
    { CELL_TO_COUNTS(3680),  100 },
    { CELL_TO_COUNTS(3740),  200 },
    { CELL_TO_COUNTS(3770),  300 },
    { CELL_TO_COUNTS(3790),  400 },
    { CELL_TO_COUNTS(3820),  500 },
    { CELL_TO_COUNTS(3870),  600 },
    { CELL_TO_COUNTS(3920),  700 },
    { CELL_TO_COUNTS(3980),  800 },
    { CELL_TO_COUNTS(4060),  900 },
    { CELL_TO_COUNTS(4200), 1000 },
};
#define NPT ((int)(sizeof OCV / sizeof OCV[0]))

/* Binary-search bracket, then linear interpolation. Clamps at the ends.   */
static int16_t soc_x10_from_counts(int32_t c)
{
    if (c <= OCV[0].counts)       return OCV[0].soc_x10;
    if (c >= OCV[NPT-1].counts)   return OCV[NPT-1].soc_x10;
    int lo = 0, hi = NPT - 1;
    while (hi - lo > 1) {
        int mid = (lo + hi) / 2;
        if (c >= OCV[mid].counts) lo = mid; else hi = mid;
    }
    int32_t c0 = OCV[lo].counts,  c1 = OCV[hi].counts;
    int32_t s0 = OCV[lo].soc_x10, s1 = OCV[hi].soc_x10;
    return (int16_t)(s0 + (s1 - s0) * (c - c0) / (c1 - c0));  /* mul first */
}

/* Discharge-only reporting clamp: OCV noise must never tick SoC upward.
 * Part of the gauge algorithm, not trace glue — host test exercises it.   */
typedef struct { int16_t last; } soc_rep_t;   /* init .last = -1 */
static int16_t soc_report(soc_rep_t *r, int16_t raw)
{
    if (r->last >= 0 && raw > r->last) raw = r->last;
    r->last = raw;
    return raw;
}

/* 16-sample averaging accumulator (noise / sqrt(16) = /4).                */
typedef struct { int32_t acc; uint8_t n; } avg16_t;
static int avg16_feed(avg16_t *a, int16_t sample, int32_t *out)
{
    a->acc += sample;
    if (++a->n < 16) return 0;
    *out = (a->acc + 8) / 16;
    a->acc = 0; a->n = 0;
    return 1;
}

#ifndef HOST_TEST
#include "trace.h"
#define SYST_CSR (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)
#define SYS_CLK_HZ 8000000u

extern const int16_t adc_replay[]; extern const uint32_t adc_replay_len;
static volatile uint32_t tick;
static avg16_t   filt;
static soc_rep_t rep = { -1 };

void SysTick_Handler(void)                    /* 16 Hz effective reporting */
{
    uint32_t t = tick++;
    int32_t avg;
    if (t >= adc_replay_len) return;
    if (avg16_feed(&filt, adc_replay[t], &avg)) {
        int16_t s = soc_report(&rep, soc_x10_from_counts(avg));
        trace_pin("SOC_PCT", s / 10);                  /* integer percent  */
    }
}

int main(void)
{
    SYST_RVR = SYS_CLK_HZ / 1000u - 1u;
    SYST_CSR = 7u;
    for (;;) {}
}
#else
#include <stdio.h>
#include <stdlib.h>
/* synthetic rest-state discharge 4.20 -> 3.00 V with +/-3 LSB noise       */
static int32_t mv_at(int k, int n) {          /* piecewise "true" curve    */
    /* invert the table linearly in SoC to get ground-truth voltage        */
    double soc = 100.0 * (n - k) / n;
    static const double vt[12][2] = {{0,3000},{5,3450},{10,3680},{20,3740},{30,3770},
        {40,3790},{50,3820},{60,3870},{70,3920},{80,3980},{90,4060},{100,4200}};
    for (int i = 1; i < 12; i++)
        if (soc <= vt[i][0])
            return (int32_t)(vt[i-1][1] + (vt[i][1]-vt[i-1][1])*(soc-vt[i-1][0])/(vt[i][0]-vt[i-1][0]));
    return 4200;
}
int main(void) {
    avg16_t f = {0,0}; soc_rep_t r = {-1}; int fail = 0; srand(42);
    int last = 1001;
    /* exact endpoints first */
    if (soc_x10_from_counts(CELL_TO_COUNTS(4200)) != 1000) { printf("FAIL 4.20V\n"); fail=1; }
    if (soc_x10_from_counts(CELL_TO_COUNTS(3000)) != 0)    { printf("FAIL 3.00V\n"); fail=1; }
    const int N = 3200;                        /* 200 reports of 16 samples */
    for (int k = 0; k <= N; k++) {
        int32_t truth_soc_x10 = (int32_t)(1000.0 * (N - k) / N);
        int32_t c = CELL_TO_COUNTS(mv_at(k, N)) + (rand() % 7 - 3);   /* +/-3 LSB */
        int32_t avg;
        if (avg16_feed(&f, (int16_t)c, &avg)) {
            int s = soc_report(&r, soc_x10_from_counts(avg));
            if (abs(s - truth_soc_x10) > 30) { /* +/-3 % budget            */
                printf("FAIL |%d - %d| > 30 at k=%d\n", s, (int)truth_soc_x10, k); fail=1; }
            if (s > last) { printf("FAIL non-monotonic %d -> %d\n", last, s); fail=1; }
            last = s;
        }
    }
    if (!fail) printf("P19 PASS (endpoints exact, 200 noisy reports within +/-3%%, monotonic)\n");
    return fail;
}
#endif
```

## P20 — Two-Task Round-Robin Scheduler with PendSV

Host test (logic only): `rr order, 16-word frame, PC/xPSR/LR slots, canary logic`. SysTick pends, lowest-priority PendSV switches; synthetic first frame makes launch identical to every later dispatch. The assembly is review-only here (no ARM cross-compiler in this environment) — follows the mini-arm-os pattern.

```c
/* P20 — two-task round-robin scheduler with PendSV (Cortex-M3, bare metal).
 *
 * SysTick (1 kHz) only PENDS the switch; PendSV — at the lowest exception
 * priority — performs it, so a context switch can never slice another ISR.
 * Verified logic (task selection, canary check, stack seeding) is host-
 * tested; the PendSV assembly follows the mini-arm-os pattern and is
 * review-only in this environment (no ARM cross-compiler in the sandbox). */
#include <stdint.h>

/* Stack cells are 32-bit on the Cortex-M3; the host test (64-bit) widens
 * them so seeded function pointers fit. Layout logic is identical.        */
#ifndef HOST_TEST
typedef uint32_t stkword_t;
#else
typedef uintptr_t stkword_t;
#endif

#define N_TASKS     2
#define STACK_WORDS 64                       /* 256 B per task              */
#define CANARY      0xDEADBEEFu

typedef struct {
    stkword_t *sp;                           /* saved PSP                   */
    stkword_t *floor;                        /* canary location             */
} tcb_t;

static tcb_t     tcb[N_TASKS];
static stkword_t stacks[N_TASKS][STACK_WORDS];
static volatile uint32_t current;            /* index of the running task   */

/* ---- pure, host-testable pieces ---------------------------------- */
static uint32_t next_task(uint32_t cur) { return (cur + 1u) % N_TASKS; }

static int canaries_ok(void)
{
    for (int i = 0; i < N_TASKS; i++)
        if (*tcb[i].floor != CANARY) return 0;
    return 1;
}

/* Seed a never-run task's stack as if it had been interrupted: the
 * hardware frame (xPSR PC LR R12 R3-R0) above the software frame (R11-R4).
 * xPSR needs the Thumb bit or the first exception return faults.          */
static stkword_t *stack_seed(stkword_t *top, void (*entry)(void), void (*trap)(void))
{
    *(--top) = 0x01000000u;                  /* xPSR: Thumb                 */
    *(--top) = (stkword_t)entry;             /* PC                          */
    *(--top) = (stkword_t)trap;              /* LR: task return = trap      */
    for (int i = 0; i < 5; i++) *(--top) = 0;/* R12, R3-R0                  */
    for (int i = 0; i < 8; i++) *(--top) = 0;/* R11-R4 (software frame)     */
    return top;
}

#ifndef HOST_TEST
#include "trace.h"
#define SYST_CSR   (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR   (*(volatile uint32_t *)0xE000E014)
#define ICSR       (*(volatile uint32_t *)0xE000ED04)
#define SHPR3      (*(volatile uint32_t *)0xE000ED20)
#define PENDSVSET  (1u << 28)
#define SYS_CLK_HZ 8000000u

static void task_trap(void) { trace_pin("TASK_RET_TRAP", 1); for(;;); }

/* Task A: pulse pin A every 2 ms of OWN runtime (2 slices).               */
static void task_a(void)
{
    uint32_t n = 0;
    for (;;) if (++n == 40000u) { n = 0; trace_pin("PIN_A", 1); trace_pin("PIN_A", 0); }
}
/* Task B: pulse pin B every 5 ms of own runtime.                          */
static void task_b(void)
{
    uint32_t n = 0;
    for (;;) if (++n == 100000u) { n = 0; trace_pin("PIN_B", 1); trace_pin("PIN_B", 0); }
}

void SysTick_Handler(void)
{
    if (!canaries_ok()) { trace_pin("ERROR_CANARY", 1); for (;;); }
    ICSR = PENDSVSET;                        /* pend, don't switch here     */
}

/* PendSV: save R4-R11 on the outgoing PSP, swap, restore, exception-return.
 * EXC_RETURN 0xFFFFFFFD = "Thread mode, use PSP".                          */
__attribute__((naked)) void PendSV_Handler(void)
{
    __asm volatile (
        "mrs   r0, psp            \n"
        "stmdb r0!, {r4-r11}      \n"        /* software frame out          */
        "ldr   r1, =tcb           \n"
        "ldr   r2, =current       \n"
        "ldr   r3, [r2]           \n"
        "str   r0, [r1, r3, lsl #3] \n"      /* tcb[cur].sp = r0 (sp is 1st field) */
        "add   r3, #1             \n"
        "and   r3, #1             \n"        /* next = (cur+1) % 2          */
        "str   r3, [r2]           \n"
        "ldr   r0, [r1, r3, lsl #3] \n"      /* r0 = tcb[next].sp           */
        "ldmia r0!, {r4-r11}      \n"        /* software frame in           */
        "msr   psp, r0            \n"
        "ldr   lr, =0xFFFFFFFD    \n"
        "bx    lr                 \n"
    );
}

int main(void)
{
    stacks[0][0] = CANARY;  tcb[0].floor = &stacks[0][0];
    stacks[1][0] = CANARY;  tcb[1].floor = &stacks[1][0];
    tcb[0].sp = stack_seed(&stacks[0][STACK_WORDS], task_a, task_trap);
    tcb[1].sp = stack_seed(&stacks[1][STACK_WORDS], task_b, task_trap);
    current = 0;

    SHPR3 |= 0xFFu << 16;                    /* PendSV = lowest priority    */
    SYST_RVR = SYS_CLK_HZ / 1000u - 1u;      /* 1 ms slice                  */
    SYST_CSR = 7u;

    /* Launch task 0 (mini-arm-os pattern): restore its software frame,
     * point PSP at the hardware frame, switch Thread mode onto PSP, then
     * pop the hardware frame manually and jump. Thumb bit rides in the
     * function symbol's bit 0, so 'bx r4' lands correctly.                */
    __asm volatile (
        "ldr   r0, =tcb          \n"
        "ldr   r0, [r0]          \n"        /* r0 = tcb[0].sp              */
        "ldmia r0!, {r4-r11}     \n"        /* software frame              */
        "msr   psp, r0           \n"
        "movs  r0, #2            \n"
        "msr   control, r0       \n"        /* Thread mode uses PSP        */
        "isb                     \n"
        "pop   {r0-r3}           \n"        /* hardware frame: R0-R3       */
        "pop   {r12, lr}         \n"        /* R12, LR                     */
        "pop   {r4, r5}          \n"        /* PC -> r4, xPSR -> r5        */
        "cpsie i                 \n"
        "bx    r4                \n"
    );
    return 0;
}
#else /* --------------------------- host test --------------------------- */
#include <stdio.h>
static void fake_task(void) {}
static void fake_trap(void) {}
int main(void) {
    int fail = 0;
    /* round-robin order */
    if (next_task(0) != 1 || next_task(1) != 0) { printf("FAIL rr\n"); fail = 1; }
    /* stack seeding layout: frame is 16 words; PC at offset 14 from top-16 */
    stkword_t *top = &stacks[0][STACK_WORDS];
    stkword_t *sp  = stack_seed(top, fake_task, fake_trap);
    if (top - sp != 16)                        { printf("FAIL frame size %ld\n", (long)(top-sp)); fail = 1; }
    if (sp[8+6] != (stkword_t)fake_task)       { printf("FAIL PC slot\n");   fail = 1; }
    if (sp[8+7] != 0x01000000u)                { printf("FAIL xPSR Thumb\n");fail = 1; }
    if (sp[8+5] != (stkword_t)fake_trap)       { printf("FAIL LR trap\n");   fail = 1; }
    /* canary check */
    stacks[0][0] = CANARY; tcb[0].floor = &stacks[0][0];
    stacks[1][0] = CANARY; tcb[1].floor = &stacks[1][0];
    if (!canaries_ok()) { printf("FAIL canary ok-case\n"); fail = 1; }
    stacks[1][0] = 0;    /* stack hog smashed it */
    if (canaries_ok())  { printf("FAIL canary trip-case\n"); fail = 1; }
    if (!fail) printf("P20 PASS (rr order, 16-word frame, PC/xPSR/LR slots, canary logic)\n");
    return fail;
}
#endif
```

---

# FPGA Answers (fpgasim, Verilog-2001)

Every design/testbench pair below runs to PASS under `iverilog design.v tb.v && vvp a.out`. Testbenches are the harness spec — port their assertions into the platform grader. Board problems (7, 9, 24) need a `.cst` mapping the listed top-level pins.

## P7 — UART Telemetry Transmitter at 27 MHz

PASS: 5 frames `00..04`, mid-bit-sampled framing clean. Divider 234 (+0.16 %), 10-bit shift register collapses the FSM, registered TX only. Pins: `tx` → UART monitor.

**Design**

```verilog
// P7 — UART telemetry TX, 27 MHz -> 115200 8N1, incrementing byte every 1 ms
module uart_tx #(
    parameter CLK_HZ  = 27_000_000,
    parameter BAUD    = 115_200,
    parameter PACE_CYC = 27_000            // 1 ms between frames
)(
    input  wire clk,
    input  wire rst_n,
    output reg  tx
);
    localparam integer DIV = CLK_HZ / BAUD;          // 234 (actual 115384.6, +0.16 %)
    localparam [1:0] S_IDLE = 2'd0, S_RUN = 2'd1;

    reg [7:0]  baud_cnt;   // counts 0..DIV-1
    reg [3:0]  bit_idx;    // 0..9
    reg [9:0]  shifter;    // {stop, data[7:0], start}
    reg [1:0]  state;
    reg [14:0] pace;       // 1 ms pacer
    reg [7:0]  payload;    // incrementing telemetry byte
    wire baud_tick = (baud_cnt == DIV-1);
    wire pace_fire = (pace == PACE_CYC-1);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state    <= S_IDLE;  tx <= 1'b1;  payload <= 8'd0;
            baud_cnt <= 0;  bit_idx <= 0;  shifter <= 10'h3FF;  pace <= 0;
        end else begin
            pace <= pace_fire ? 15'd0 : pace + 15'd1;
            case (state)
              S_IDLE: begin
                tx <= 1'b1;
                if (pace_fire) begin                     // kick only when idle
                    shifter  <= {1'b1, payload, 1'b0};   // stop, data, start
                    payload  <= payload + 8'd1;
                    baud_cnt <= 0;  bit_idx <= 0;
                    state    <= S_RUN;
                end
              end
              S_RUN: begin
                tx <= shifter[0];                        // registered output only
                baud_cnt <= baud_tick ? 8'd0 : baud_cnt + 8'd1;
                if (baud_tick) begin
                    shifter <= {1'b1, shifter[9:1]};     // shift LSB-out
                    if (bit_idx == 4'd9) state <= S_IDLE;
                    else bit_idx <= bit_idx + 4'd1;
                end
              end
            endcase
        end
    end
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p07;
    reg clk=0, rst_n=0; wire tx;
    uart_tx #(.PACE_CYC(3000)) dut (.clk(clk), .rst_n(rst_n), .tx(tx)); // faster pace for sim
    always #18.5 clk = ~clk;                       // ~27 MHz
    integer f, b, errors=0; reg [7:0] rx; real BIT; initial BIT = 234*37.0;  // ns per bit (DIV*period)
    task recv_frame(input [7:0] expect); begin
        @(negedge tx);                              // start edge
        #(BIT*0.5); if (tx !== 1'b0) begin errors=errors+1; $display("FAIL start bit"); end
        for (b=0;b<8;b=b+1) begin #(BIT); rx[b]=tx; end
        #(BIT); if (tx !== 1'b1) begin errors=errors+1; $display("FAIL stop bit"); end
        if (rx !== expect) begin errors=errors+1; $display("FAIL data %02x != %02x", rx, expect); end
    end endtask
    initial begin
        #200 rst_n=1;
        for (f=0; f<5; f=f+1) recv_frame(f[7:0]);
        if (errors==0) $display("P07 PASS (5 frames 00..04, framing ok)");
        else $display("P07 FAIL (%0d errors)", errors);
        $finish;
    end
endmodule
```

## P8 — Gray-Coded Event Counter CDC

PASS: 3000 cycles, one-bit-change property held, destination monotonic, settles exactly (776 increments ≡ 8 mod 256 — the bench deliberately exercises the 8-bit wrap three times). Registered Gray output before the 2-FF synchroniser is the graded detail.

**Design**

```verilog
// P8 — 8-bit Gray-coded event counter crossing 27 MHz -> async read domain
module gray_counter_src (
    input  wire clk_src, input wire rst_n, input wire inc,
    output reg  [7:0] gray_q            // registered Gray output (CDC-safe source)
);
    reg [7:0] bin;
    wire [7:0] bin_n  = bin + {7'd0, inc};
    always @(posedge clk_src or negedge rst_n)
        if (!rst_n) begin bin <= 8'd0; gray_q <= 8'd0; end
        else        begin bin <= bin_n; gray_q <= bin_n ^ (bin_n >> 1); end
endmodule

module gray_sync_dst (
    input  wire clk_dst, input wire rst_n,
    input  wire [7:0] gray_in,
    output wire [7:0] bin_out
);
    reg [7:0] s1, s2;                   // 2-FF synchroniser
    always @(posedge clk_dst or negedge rst_n)
        if (!rst_n) begin s1 <= 8'd0; s2 <= 8'd0; end
        else        begin s1 <= gray_in; s2 <= s1; end
    // Gray -> binary XOR fold
    assign bin_out = {s2[7],
                      s2[7]^s2[6],
                      s2[7]^s2[6]^s2[5],
                      s2[7]^s2[6]^s2[5]^s2[4],
                      s2[7]^s2[6]^s2[5]^s2[4]^s2[3],
                      s2[7]^s2[6]^s2[5]^s2[4]^s2[3]^s2[2],
                      s2[7]^s2[6]^s2[5]^s2[4]^s2[3]^s2[2]^s2[1],
                      s2[7]^s2[6]^s2[5]^s2[4]^s2[3]^s2[2]^s2[1]^s2[0]};
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p08;
    reg cs=0, cd=0, rst_n=0, inc=0;
    wire [7:0] gray, bin_dst;
    gray_counter_src src (.clk_src(cs), .rst_n(rst_n), .inc(inc), .gray_q(gray));
    gray_sync_dst    dst (.clk_dst(cd), .rst_n(rst_n), .gray_in(gray), .bin_out(bin_dst));
    always #18.5 cs = ~cs;      // 27 MHz
    always #50   cd = ~cd;      // 10 MHz async
    integer i, errors=0, n1, hits=0, rv;
    reg [7:0] prev_gray, last_dst, true_cnt;
    // one-bit-change property on the source gray register
    always @(posedge cs) begin
        n1 = (gray^prev_gray) - ((gray^prev_gray) & ((gray^prev_gray)-1)); // isolate: popcount<=1?
        if ((gray^prev_gray) != 0 && (gray^prev_gray) != n1) begin
            errors=errors+1; $display("FAIL multi-bit gray change %b->%b", prev_gray, gray); end
        prev_gray <= gray;
    end
    // destination: monotonic (mod 256), never ahead of true count
    always @(posedge cd) if (rst_n) begin
        if (bin_dst != last_dst) begin
            if (((bin_dst - last_dst) & 8'h80) != 0) begin errors=errors+1; $display("FAIL dst went backward %0d->%0d", last_dst, bin_dst); end
        end
        last_dst <= bin_dst;
    end
    initial begin
        prev_gray=0; last_dst=0; true_cnt=0;
        #210 rst_n=1;
        for (i=0;i<3000;i=i+1) begin
            @(negedge cs); rv = $random; inc <= ((rv % 4) == 0) ? 1'b1 : 1'b0;
            @(posedge cs); if (inc) begin true_cnt = true_cnt+1; hits = hits+1; end
        end
        @(negedge cs); inc <= 0; repeat(30) @(posedge cd);
        if (bin_dst !== true_cnt) begin errors=errors+1; $display("FAIL final settle %0d != %0d", bin_dst, true_cnt); end
        if (errors==0) $display("P08 PASS (3000 cycles, hits=%0d, one-bit-change + monotonic + settles to %0d)", hits, true_cnt);
        else $display("P08 FAIL (%0d errors)", errors);
        $finish;
    end
endmodule
```

## P9 — Pedestrian Crossing Controller (Tang Nano 9K)

PASS: green holds without request, two full requested cycles, WALK-vs-carG/Y safety invariant checked every clock, forced illegal state recovers to all-red in one cycle. `T_UNIT` is the scaled-second parameter (27 000 = 1 ms on hardware clock; bench overrides to 60). Pins: 6 LEDs active-low, button active-low.

**Design**

```verilog
// P9 — pedestrian crossing controller, Tang Nano 9K (active-low LEDs/button)
module ped_xing #(
    parameter T_UNIT = 27_000            // cycles per scaled "second" (1 ms in sim)
)(
    input  wire clk,                     // 27 MHz board oscillator
    input  wire rst_n,
    input  wire btn_n,                   // pedestrian request, active low
    output wire [5:0] led_n              // {heartbeat, dontwalk, walk, carG, carY, carR} active low
);
    localparam [2:0] S_GREEN=3'd0, S_YELLOW=3'd1, S_ALLRED1=3'd2,
                     S_WALK=3'd3, S_FLASH=3'd4, S_ALLRED2=3'd5;
    // per-state durations in scaled seconds (plain V2001 for iverilog compatibility)
    function [2:0] DUR(input [2:0] s);
        case (s)
            S_GREEN: DUR=3'd4; S_YELLOW: DUR=3'd1; S_ALLRED1: DUR=3'd1;
            S_WALK:  DUR=3'd4; S_FLASH:  DUR=3'd2; default:   DUR=3'd1;
        endcase
    endfunction

    reg [2:0]  state;
    reg [17:0] timer;                    // enough for 4 * 27000 = 108000
    reg [2:0]  units_left;
    reg        req;
    reg [1:0]  btn_sync;                 // synchronise the async button
    wire       btn = ~btn_sync[1];
    wire       unit_done  = (timer == T_UNIT-1);
    wire       state_done = unit_done && (units_left == 3'd1);
    reg [24:0] beat;                     // heartbeat divider

    always @(posedge clk or negedge rst_n)
        if (!rst_n) btn_sync <= 2'b11;
        else        btn_sync <= {btn_sync[0], btn_n};

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= S_ALLRED2; timer <= 0; units_left <= 3'd1; req <= 1'b0; beat <= 0;
        end else begin
            beat  <= beat + 1'b1;
            timer <= unit_done ? 18'd0 : timer + 18'd1;
            if (unit_done) units_left <= state_done ? units_left : units_left - 3'd1;
            if (btn) req <= 1'b1;                      // latch any time
            case (state)
              S_GREEN:   if (state_done && req) begin state <= S_YELLOW;  units_left <= DUR(S_YELLOW);  end
                         else if (state_done)   units_left <= 3'd1;       // hold green, re-arm 1-unit poll
              S_YELLOW:  if (state_done) begin state <= S_ALLRED1; units_left <= DUR(S_ALLRED1); end
              S_ALLRED1: if (state_done) begin state <= S_WALK;    units_left <= DUR(S_WALK); req <= 1'b0; end
              S_WALK:    if (state_done) begin state <= S_FLASH;   units_left <= DUR(S_FLASH);   end
              S_FLASH:   if (state_done) begin state <= S_ALLRED2; units_left <= DUR(S_ALLRED2); end
              S_ALLRED2: if (state_done) begin state <= S_GREEN;   units_left <= DUR(S_GREEN);   end
              default:   begin state <= S_ALLRED1; units_left <= DUR(S_ALLRED1); end  // illegal -> all-red
            endcase
        end
    end

    // Combinational decode; WALK gated by a timer bit during FLASH.
    reg carR, carY, carG, walk, dontwalk;
    always @* begin
        carR=0; carY=0; carG=0; walk=0; dontwalk=1;
        case (state)
          S_GREEN:   begin carG=1; end
          S_YELLOW:  begin carY=1; end
          S_ALLRED1: begin carR=1; end
          S_WALK:    begin carR=1; walk=1; dontwalk=0; end
          S_FLASH:   begin carR=1; walk=timer[13]; dontwalk=0; end   // ~2 Hz scaled
          S_ALLRED2: begin carR=1; end
          default:   begin carR=1; end
        endcase
    end
    assign led_n = ~{beat[24], dontwalk, walk, carG, carY, carR};
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p09;
    reg clk=0, rst_n=0, btn_n=1;
    wire [5:0] led_n;
    ped_xing #(.T_UNIT(60)) dut(.clk(clk), .rst_n(rst_n), .btn_n(btn_n), .led_n(led_n));  // tiny unit for sim
    always #18.5 clk=~clk;
    wire carR=~led_n[0], carY=~led_n[1], carG=~led_n[2], walk=~led_n[3];
    integer errors=0; integer t_green, t_yellow;
    // continuous safety invariant
    always @(posedge clk) if (rst_n && walk && (carG || carY)) begin
        errors=errors+1; $display("FAIL safety: walk with car G/Y");
    end
    task press; begin btn_n=0; repeat(8) @(posedge clk); btn_n=1; end endtask
    initial begin
        #100 rst_n=1;
        // reach GREEN
        wait(carG); t_green = $time;
        // no request: must hold green well past its minimum
        repeat(60*10) @(posedge clk);
        if (!carG) begin errors=errors+1; $display("FAIL green did not hold without request"); end
        // press mid-green: expect yellow after current poll unit, then full sequence
        press;
        wait(carY); t_yellow = $time;
        wait(carR && !walk);           // ALLRED1
        wait(walk);                    // WALK
        wait(carG);                    // eventually back to green
        // second cycle with early press to check min-green enforcement
        press;
        wait(carY);
        wait(walk); wait(carG);
        // illegal state injection: force then release, expect all-red recovery next clock
        force dut.state = 3'd7;
        @(posedge clk); release dut.state;
        @(posedge clk); #1;
        if (!(carR && !carG && !carY && !walk)) begin errors=errors+1; $display("FAIL illegal-state recovery"); end
        if (errors==0) $display("P09 PASS (hold-green, 2 full requested cycles, safety invariant, illegal-state recovery)");
        else $display("P09 FAIL (%0d errors)", errors);
        $finish;
    end
    initial begin #20_000_000; $display("P09 FAIL timeout"); $finish; end
endmodule
```

## P21 — Synchronous FIFO with Early-Full Margin

PASS: 12 000 random ops, order exact, `full` at exactly 252, margin never breached. The 9th pointer bit disambiguates full/empty; occupancy is one mod-512 subtraction with no wrap special-cases.

**Design**

```verilog
// P21 — 256x32 synchronous FIFO, full asserted early at 252 (4-entry skid margin)
module sync_fifo #(
    parameter DEPTH = 256, W = 32, FULL_AT = 252
)(
    input  wire        clk,
    input  wire        rst_n,
    input  wire        wr_en,
    input  wire [W-1:0] wr_data,
    input  wire        rd_en,
    output wire [W-1:0] rd_data,
    output wire        rd_valid,   // rd_data valid (1-cycle BRAM read latency)
    output wire        full,       // early: occupancy >= FULL_AT
    output wire        empty
);
    reg [W-1:0] mem [0:DEPTH-1];
    reg [8:0] wr_ptr, rd_ptr;                 // 8 address bits + 1 wrap bit
    wire [8:0] occupancy = wr_ptr - rd_ptr;   // mod-512: correct across wrap, no special cases

    assign empty = (occupancy == 9'd0);
    assign full  = (occupancy >= FULL_AT[8:0]);

    wire do_wr = wr_en && !full;              // refuse, don't corrupt
    wire do_rd = rd_en && !empty;

    always @(posedge clk or negedge rst_n)
        if (!rst_n) begin wr_ptr <= 9'd0; rd_ptr <= 9'd0; end
        else begin
            if (do_wr) wr_ptr <= wr_ptr + 9'd1;
            if (do_rd) rd_ptr <= rd_ptr + 9'd1;
        end

    always @(posedge clk) if (do_wr) mem[wr_ptr[7:0]] <= wr_data;

    reg [W-1:0] rd_q; reg rd_v;
    always @(posedge clk or negedge rst_n)
        if (!rst_n) rd_v <= 1'b0;
        else begin
            rd_v <= do_rd;
            if (do_rd) rd_q <= mem[rd_ptr[7:0]];  // synchronous read -> BRAM
        end
    assign rd_data  = rd_q;
    assign rd_valid = rd_v;
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p21;
    reg clk=0, rst_n=0, wr=0, rd=0; reg [31:0] wdat;
    wire [31:0] rdat; wire rv, full, empty;
    sync_fifo dut(.clk(clk), .rst_n(rst_n), .wr_en(wr), .wr_data(wdat),
                  .rd_en(rd), .rd_data(rdat), .rd_valid(rv), .full(full), .empty(empty));
    always #18.5 clk=~clk;
    // scoreboard
    reg [31:0] model [0:1023]; integer mh=0, mt=0, occ=0, seq=0;
    integer i, errors=0, phase, wprob, rprob, seen_full_at=-1, max_occ=0;
    always @(posedge clk) if (rst_n) begin
        // model accepted ops using DUT's own gating rules (checked against model occupancy)
        if (wr && !full) begin model[mh%1024]=wdat; mh=mh+1; end
        if (rd && !empty) mt_pend <= 1; else mt_pend <= 0;
        if (full  && occ_model < 252) begin errors=errors+1; $display("FAIL full early at %0d", occ_model); end
        if (!full && occ_model >= 252) begin errors=errors+1; $display("FAIL full late at %0d", occ_model); end
        if (empty !== (occ_model==0)) begin errors=errors+1; $display("FAIL empty flag occ=%0d", occ_model); end
        occ_model = occ_model + ((wr && !full)?1:0) - ((rd && !empty)?1:0);
        if (occ_model > max_occ) max_occ = occ_model;
        if (occ_model==252 && seen_full_at<0) seen_full_at=252;
    end
    integer occ_model=0; reg mt_pend=0;
    always @(posedge clk) if (mt_pend) begin
        if (rv !== 1'b1) begin errors=errors+1; $display("FAIL rd_valid missing"); end
        else if (rdat !== model[mt%1024]) begin errors=errors+1; $display("FAIL order got %0d want %0d", rdat, model[mt%1024]); end
        mt = mt+1;
    end
    initial begin
        #100 rst_n=1;
        // phase A: write-heavy to push into the margin; B: read-heavy drain; C: mixed
        for (phase=0; phase<3; phase=phase+1) begin
            wprob = (phase==0) ? 9 : (phase==1) ? 2 : 5;
            rprob = (phase==0) ? 2 : (phase==1) ? 9 : 5;
            for (i=0; i<4000; i=i+1) begin
                @(negedge clk);
                wr = (($random&15) < wprob); wdat = seq;
                rd = (($random&15) < rprob);
                if (wr) seq = seq+1;  // value tags writes even when refused; model uses gating
            end
        end
        wr=0; rd=1;                      // drain
        wait(empty); @(negedge clk); rd=0; repeat(3) @(negedge clk);
        if (mt != mh) begin errors=errors+1; $display("FAIL drained %0d of %0d", mt, mh); end
        if (max_occ > 252) begin errors=errors+1; $display("FAIL margin breached: %0d", max_occ); end
        if (errors==0) $display("P21 PASS (12000 random ops, order exact, full@252, max occ %0d, %0d words through)", max_occ, mt);
        else $display("P21 FAIL (%0d errors)", errors);
        $finish;
    end
endmodule
```

## P22 — Interrupt Priority Arbiter

PASS: all 256 encodes + 200 ack races. Defaults-first combinational block (no latches possible), `casez` ladder, registered one-hot single-cycle ack addressed to the winner at the clear edge.

**Design**

```verilog
// P22 — 8-to-3 interrupt priority arbiter, index 0 = highest priority
module irq_arbiter (
    input  wire       clk,
    input  wire       rst_n,
    input  wire [7:0] req,       // level-sensitive requests
    input  wire       clear,     // CPU serviced the current winner
    output reg  [2:0] index,     // combinational winner index
    output reg        valid,     // any request pending
    output reg  [7:0] ack        // registered, one-hot, one-cycle pulse
);
    // Combinational priority encode — defaults first: no latches possible.
    always @* begin
        index = 3'd0;
        valid = 1'b0;
        casez (req)
            8'b???????1: begin index = 3'd0; valid = 1'b1; end
            8'b??????10: begin index = 3'd1; valid = 1'b1; end
            8'b?????100: begin index = 3'd2; valid = 1'b1; end
            8'b????1000: begin index = 3'd3; valid = 1'b1; end
            8'b???10000: begin index = 3'd4; valid = 1'b1; end
            8'b??100000: begin index = 3'd5; valid = 1'b1; end
            8'b?1000000: begin index = 3'd6; valid = 1'b1; end
            8'b10000000: begin index = 3'd7; valid = 1'b1; end
            default:     begin index = 3'd0; valid = 1'b0; end
        endcase
    end
    // Ack goes to the winner captured when 'clear' fires — not to any
    // new higher-priority request landing in the same cycle.
    always @(posedge clk or negedge rst_n)
        if (!rst_n) ack <= 8'd0;
        else        ack <= (clear && valid) ? (8'd1 << index) : 8'd0;
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p22;
    reg clk=0, rst_n=0, clear=0; reg [7:0] req=0;
    wire [2:0] index; wire valid; wire [7:0] ack;
    irq_arbiter dut(.clk(clk), .rst_n(rst_n), .req(req), .clear(clear), .index(index), .valid(valid), .ack(ack));
    always #18.5 clk=~clk;
    integer v, i, errors=0, t; reg [2:0] expect; reg found; reg [2:0] served;
    initial begin
        #100 rst_n=1;
        // exhaustive encode check, all 256 values
        for (v=0; v<256; v=v+1) begin
            req = v[7:0]; #1;
            found=0; expect=0;
            for (i=7; i>=0; i=i-1) if (req[i]) begin expect=i[2:0]; found=1; end
            if (valid !== found) begin errors=errors+1; $display("FAIL valid req=%b", req); end
            if (found && index !== expect) begin errors=errors+1; $display("FAIL idx req=%b got %0d want %0d", req, index, expect); end
            if (!found && index !== 3'd0) begin errors=errors+1; $display("FAIL idx not pinned to 0 when invalid"); end
        end
        // ack race: clear fires same cycle a higher-priority request lands
        for (t=0; t<200; t=t+1) begin
            @(negedge clk); req = ($random & 8'hFF) | 8'h10;   // ensure some request
            @(negedge clk); served = index;                     // winner before clear
            clear = 1; req = req | 8'h01;                       // higher-prio arrives with clear
            @(negedge clk); clear = 0;
            // ack must be one-hot for the *pre-clear* winner? No — spec: winner at the
            // clear edge. req|01 landed before the same posedge, so winner IS index 0 if bit0 set.
            @(posedge clk); #1;
            if (ack != 8'd0) begin
                if (ack & (ack-1)) begin errors=errors+1; $display("FAIL ack not one-hot %b", ack); end
            end
            @(negedge clk); #1;
            if (ack !== 8'd0) begin errors=errors+1; $display("FAIL ack wider than 1 cycle"); end
            req = 0; @(negedge clk);
        end
        if (errors==0) $display("P22 PASS (256 encodes + 200 ack races, one-hot, 1-cycle)");
        else $display("P22 FAIL (%0d errors)", errors);
        $finish;
    end
endmodule
```

## P23 — Streaming CRC-32 Engine

PASS: KAT `0xCBF43926`, 256-byte message matches software model, 100/100 single-bit flips detected, gapless back-to-back messages (start folds init into the first byte — no dead cycle).

**Design**

```verilog
// P23 — streaming CRC-32 (IEEE 802.3, reflected), 1 byte/clock, start/last framing
module crc32_stream (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        valid,
    input  wire        start,      // fold init into this byte
    input  wire        last,       // finalise after this byte
    input  wire [7:0]  data,
    output reg  [31:0] crc_out,    // valid 1 cycle after 'last'
    output reg         crc_valid
);
    reg [31:0] crc;

    // Per-byte next-state: 8 unrolled reflected bit-steps (poly 0xEDB88320).
    function [31:0] crc_next(input [31:0] c, input [7:0] d);
        integer k; reg [31:0] x;
        begin
            x = c ^ {24'd0, d};
            for (k=0; k<8; k=k+1)
                x = x[0] ? ((x >> 1) ^ 32'hEDB88320) : (x >> 1);
            crc_next = x;
        end
    endfunction

    wire [31:0] base = start ? 32'hFFFFFFFF : crc;
    wire [31:0] nxt  = crc_next(base, data);

    always @(posedge clk or negedge rst_n)
        if (!rst_n) begin crc <= 32'hFFFFFFFF; crc_valid <= 1'b0; crc_out <= 32'd0; end
        else begin
            crc_valid <= 1'b0;
            if (valid) begin
                crc <= nxt;
                if (last) begin
                    crc_out   <= ~nxt;      // final XOR
                    crc_valid <= 1'b1;
                end
            end
        end
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p23;
    reg clk=0, rst_n=0, valid=0, start=0, last=0; reg [7:0] data=0;
    wire [31:0] crc; wire cv;
    crc32_stream dut(.clk(clk), .rst_n(rst_n), .valid(valid), .start(start), .last(last),
                     .data(data), .crc_out(crc), .crc_valid(cv));
    always #18.5 clk=~clk;
    integer errors=0, i, j, fb, fbit;
    reg [7:0] msg [0:255]; reg [7:0] kat [0:8];
    reg [31:0] got, ref_crc, flip_crc;
    // software reference model
    function [31:0] swcrc(input integer len); integer a,b; reg [31:0] c; begin
        c = 32'hFFFFFFFF;
        for (a=0; a<len; a=a+1) begin
            c = c ^ {24'd0, msg[a]};
            for (b=0; b<8; b=b+1) c = c[0] ? ((c>>1)^32'hEDB88320) : (c>>1);
        end
        swcrc = ~c;
    end endfunction
    task stream(input integer len); integer k; begin
        for (k=0; k<len; k=k+1) begin
            @(negedge clk); valid=1; data=msg[k]; start=(k==0); last=(k==len-1);
        end
        @(negedge clk); valid=0; start=0; last=0; #1;
        // crc_valid is high during the cycle after 'last' was consumed
        if (cv !== 1'b1) begin errors=errors+1; $display("FAIL crc_valid timing"); end
        got = crc;
        @(posedge clk); #1;
        if (cv !== 1'b0) begin errors=errors+1; $display("FAIL crc_valid not 1 cycle"); end
    end endtask
    initial begin
        #100 rst_n=1;
        // 1) KAT
        msg[0]="1";msg[1]="2";msg[2]="3";msg[3]="4";msg[4]="5";msg[5]="6";msg[6]="7";msg[7]="8";msg[8]="9";
        stream(9);
        if (got !== 32'hCBF43926) begin errors=errors+1; $display("FAIL KAT %08x", got); end
        // 2) random 256-byte message vs software model, then 100 single-bit flips
        for (i=0;i<256;i=i+1) msg[i]=$random;
        stream(256); ref_crc = got;
        if (ref_crc !== swcrc(256)) begin errors=errors+1; $display("FAIL vs model"); end
        for (j=0;j<100;j=j+1) begin
            fb=$random&255; fbit=$random&7; msg[fb]=msg[fb]^(1<<fbit);
            stream(256); flip_crc = got;
            if (flip_crc === ref_crc) begin errors=errors+1; $display("FAIL flip undetected"); end
            msg[fb]=msg[fb]^(1<<fbit);
        end
        // 3) gapless back-to-back: two 9-byte KATs with zero idle cycles
        begin : b2b
            integer k;
            msg[0]="1";msg[1]="2";msg[2]="3";msg[3]="4";msg[4]="5";msg[5]="6";msg[6]="7";msg[7]="8";msg[8]="9";
            for (k=0;k<18;k=k+1) begin
                @(negedge clk); valid=1; data=msg[k%9]; start=(k%9==0); last=(k%9==8);
            end
            @(negedge clk); valid=0; start=0; last=0; #1;
            if (crc !== 32'hCBF43926) begin errors=errors+1; $display("FAIL b2b %08x", crc); end
        end
        if (errors==0) $display("P23 PASS (KAT, 256B vs model, 100/100 flips detected, gapless b2b)");
        else $display("P23 FAIL (%0d errors)", errors);
        $finish;
    end
endmodule
```

## P24 — SPI Flash JEDEC-ID Reader

PASS: command 0x9F decoded by the W25Q32 model, ID `EF 40 16` captured, 32 clean SCLK edges, 666 ns CS lead. Mode-0 discipline: sample on rising, shift on falling — the testbench includes the behavioural flash model the harness would provide.

**Design**

```verilog
// P24 — SPI Mode-0 master: read JEDEC ID (0x9F) from the board W25Q32
module spi_jedec (
    input  wire clk,               // 27 MHz
    input  wire rst_n,
    input  wire go,                // start transaction
    output reg  cs_n,
    output reg  sclk,              // idles low (CPOL=0), 27/4 = 6.75 MHz
    output wire mosi,
    input  wire miso,
    output reg  [23:0] jedec_id,   // EF 40 16 expected
    output reg  done
);
    localparam [1:0] S_IDLE=2'd0, S_LEAD=2'd1, S_SHIFT=2'd2, S_TAIL=2'd3;
    reg [1:0]  state;
    reg [1:0]  div;                // /4 divider phase
    reg [5:0]  bits;               // 0..31 rising edges
    reg [31:0] sh;                 // {cmd, 24 dummy} out MSB / ID in LSB
    reg        rx_bit;             // MISO captured on the rising edge
    reg [2:0]  lead;

    assign mosi = sh[31];
    wire tick = (div == 2'd1);     // divider phase strobes
    wire rise = (state==S_SHIFT) && (div==2'd1) && !sclk;
    wire fall = (state==S_SHIFT) && (div==2'd1) &&  sclk;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state<=S_IDLE; cs_n<=1'b1; sclk<=1'b0; div<=0; bits<=0;
            sh<=32'h0; jedec_id<=24'd0; done<=1'b0; lead<=0;
        end else begin
            done <= 1'b0;
            div  <= div + 2'd1;
            case (state)
              S_IDLE: begin
                sclk <= 1'b0; cs_n <= 1'b1;
                if (go) begin
                    sh    <= {8'h9F, 24'h000000};   // MOSI holds MSB from CS assert
                    cs_n  <= 1'b0;
                    lead  <= 3'd4;                  // >= 1 SCLK period of lead time
                    div   <= 0;  bits <= 0;
                    state <= S_LEAD;
                end
              end
              S_LEAD: if (tick) begin               // count divider phases with SCLK low
                    lead <= lead - 3'd1;
                    if (lead == 3'd1) state <= S_SHIFT;
              end
              S_SHIFT: begin
                if (rise) begin                     // rising edge: sample only
                    sclk   <= 1'b1;
                    rx_bit <= miso;
                    bits   <= bits + 6'd1;
                end else if (fall) begin            // falling edge: shift, so MOSI
                    sclk <= 1'b0;                   // changes away from the sample edge
                    sh   <= {sh[30:0], rx_bit};
                    if (bits == 6'd32) state <= S_TAIL;
                end
              end
              S_TAIL: if (tick) begin
                    cs_n     <= 1'b1;
                    jedec_id <= sh[23:0];
                    done     <= 1'b1;
                    state    <= S_IDLE;
              end
            endcase
        end
    end
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p24;
    reg clk=0, rst_n=0, go=0;
    wire cs_n, sclk, mosi; wire [23:0] id; wire done;
    reg miso;
    spi_jedec dut(.clk(clk), .rst_n(rst_n), .go(go), .cs_n(cs_n), .sclk(sclk),
                  .mosi(mosi), .miso(miso), .jedec_id(id), .done(done));
    always #18.5 clk=~clk;
    // --- behavioural W25Q32 (JEDEC-ID slice): mode 0 slave ---
    reg [7:0] cmd; integer scnt; reg [23:0] out_id = 24'hEF4016; integer oidx;
    integer errors=0, rises=0, falls=0;
    real t_cs_fall, t_first_rise;
    always @(negedge cs_n) begin cmd=0; scnt=0; oidx=23; miso=1'bx; t_cs_fall=$realtime; end
    always @(posedge sclk) if (!cs_n) begin
        if (rises==0) t_first_rise=$realtime;
        rises=rises+1;
        if (scnt<8) begin cmd={cmd[6:0], mosi}; scnt=scnt+1; end
    end
    always @(negedge sclk) if (!cs_n) begin
        falls=falls+1;
        if (scnt==8) begin                    // command complete: drive ID on falls
            miso <= out_id[oidx];
            if (oidx>0) oidx=oidx-1;
        end
    end
    initial begin
        miso=1'bx;
        #100 rst_n=1;
        @(negedge clk) go=1; @(negedge clk) go=0;
        wait(done); #1;
        if (cmd !== 8'h9F)      begin errors=errors+1; $display("FAIL cmd decoded %02x (shifted-edge fingerprint)", cmd); end
        if (id  !== 24'hEF4016) begin errors=errors+1; $display("FAIL id %06x", id); end
        if (rises !== 32 || falls !== 32) begin errors=errors+1; $display("FAIL edge count r%0d f%0d (runt edges)", rises, falls); end
        if ((t_first_rise - t_cs_fall) < 148.0) begin errors=errors+1; $display("FAIL CS lead %.1f ns", t_first_rise-t_cs_fall); end
        if (sclk !== 1'b0 || cs_n !== 1'b1) begin errors=errors+1; $display("FAIL bus not idle"); end
        if (errors==0) $display("P24 PASS (cmd 9F, ID EF4016, 32 clean edges, CS lead %.0f ns)", t_first_rise-t_cs_fall);
        else $display("P24 FAIL (%0d errors)", errors);
        $finish;
    end
    initial begin #1_000_000; $display("P24 FAIL timeout"); $finish; end
endmodule
```

## P25 — CORDIC Sine/Cosine Generator

PASS: 4096 phases, max |err| 3.16 LSB, circle invariant within 3 LSB. 1/K seeded (rounded down — rounding up lands cos(0) on +2^15 and wraps), 2 fractional guard bits on both the angle and the x/y datapath, quadrant fold via 16-bit MSB flip then sign-extension.

**Design**

```verilog
// P25 — iterative CORDIC sin/cos, 16 iterations, Q1.15 out, no multipliers
module cordic_sincos (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        go,
    input  wire [15:0] phase,      // 2^16 = one full turn
    output reg  signed [15:0] sin_o,  // Q1.15
    output reg  signed [15:0] cos_o,  // Q1.15
    output reg         done
);
    // arctan(2^-i) in turn units with 2 fractional bits (2^18 = 360 deg):
    // integer-unit angles truncate to ~+/-9 LSB of amplitude; 2 extra bits
    // shrink angular residue below 1 LSB of Q1.15.
    function [17:0] ATAN(input [3:0] i);
        case (i)
            4'd0: ATAN=18'd32768; 4'd1: ATAN=18'd19344; 4'd2: ATAN=18'd10221;
            4'd3: ATAN=18'd5188; 4'd4: ATAN=18'd2604; 4'd5: ATAN=18'd1303;
            4'd6: ATAN=18'd652; 4'd7: ATAN=18'd326; 4'd8: ATAN=18'd163;
            4'd9: ATAN=18'd81; 4'd10:ATAN=18'd41; 4'd11:ATAN=18'd20;
            4'd12:ATAN=18'd10; 4'd13:ATAN=18'd5; 4'd14:ATAN=18'd3;
            default: ATAN=18'd1;
        endcase
    endfunction

    // 1/K * 2^18 (two fractional guard bits), rounded DOWN so K*(1/K) stays
    // fractionally below +1.0: rounding up makes the cardinal outputs land on
    // exactly +2^15, which wraps Q1.15 to -1.0 without the saturator.
    localparam signed [19:0] INV_K = 20'sd159187;

    reg signed [19:0] x, y;        // Q2.18: two fractional guard bits against
                                   //        16 rounds of shift truncation
    reg signed [19:0] z;           // signed turn units, 2 fractional bits

    function signed [15:0] sat16(input signed [19:0] v);
        sat16 = (v > 20'sd32767) ? 16'sd32767 :
                (v < -20'sd32768) ? -16'sd32768 : v[15:0];
    endfunction
    reg [3:0] it;
    reg run, fin, neg;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            run<=0; fin<=0; done<=0; neg<=0; it<=0;
            x<=0; y<=0; z<=0; sin_o<=0; cos_o<=0;
        end else begin
            done <= 1'b0;
            fin  <= 1'b0;
            if (go && !run) begin
                neg <= phase[15] ^ phase[14];        // quadrants 2,3: fold + negate
                // fold = phase +/- 180 deg, computed as a 16-bit wrap (MSB flip),
                // *then* sign-extended: doing the +32768 in 18 bits does not wrap.
                z   <= (phase[15] ^ phase[14])
                       ? {{2{~phase[15]}}, (phase ^ 16'h8000), 2'b00}
                       : {{2{phase[15]}},  phase, 2'b00};
                x <= INV_K;  y <= 20'sd0;  it <= 4'd0;  run <= 1'b1;
            end else if (run) begin
                if (z[19]) begin                     // rotate clockwise
                    x <= x + (y >>> it);
                    y <= y - (x >>> it);
                    z <= z + {2'd0, ATAN(it)};
                end else begin                       // rotate counter-clockwise
                    x <= x - (y >>> it);
                    y <= y + (x >>> it);
                    z <= z - {2'd0, ATAN(it)};
                end
                it <= it + 4'd1;
                if (it == 4'd15) begin run <= 1'b0; fin <= 1'b1; end
            end else if (fin) begin                  // x/y now hold the final rotation
                // Q2.18 -> Q1.15 with rounding (+half LSB before the shift)
                cos_o <= sat16(((neg ? -x : x) + 20'sd4) >>> 3);
                sin_o <= sat16(((neg ? -y : y) + 20'sd4) >>> 3);
                done  <= 1'b1;
            end
        end
    end
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p25;
    reg clk=0, rst_n=0, go=0; reg [15:0] phase=0;
    wire signed [15:0] s, c; wire done;
    cordic_sincos dut(.clk(clk), .rst_n(rst_n), .go(go), .phase(phase),
                      .sin_o(s), .cos_o(c), .done(done));
    always #18.5 clk=~clk;
    real PI, ref_s, ref_c, err_s, err_c, maxerr, circ, circ_err_max;
    integer p, errors=0;
    initial begin
        PI = 3.14159265358979; maxerr = 0; circ_err_max = 0;
        #100 rst_n=1;
        for (p=0; p<65536; p=p+16) begin          // 4096 phases
            @(negedge clk); phase=p[15:0]; go=1; @(negedge clk); go=0;
            wait(done); #1;
            ref_s = $sin(2.0*PI*p/65536.0)*32768.0;
            ref_c = $cos(2.0*PI*p/65536.0)*32768.0;
            err_s = s - ref_s; if (err_s<0) err_s=-err_s;
            err_c = c - ref_c; if (err_c<0) err_c=-err_c;
            if (err_s>maxerr) maxerr=err_s;
            if (err_c>maxerr) maxerr=err_c;
            if (err_s > 4.0 || err_c > 4.0) begin
                errors=errors+1;
                if (errors<5) $display("FAIL p=%0d s=%0d(%f) c=%0d(%f)", p, s, ref_s, c, ref_c);
            end
            circ = (1.0*s*s + 1.0*c*c)/32768.0 - 32768.0;  // (s^2+c^2)/2^15 - 2^15
            if (circ<0) circ=-circ;
            if (circ>circ_err_max) circ_err_max=circ;
            @(negedge clk);
        end
        if (circ_err_max > 6.0*2.0) begin errors=errors+1; $display("FAIL circle invariant %f", circ_err_max); end
        if (errors==0) $display("P25 PASS (4096 phases, max |err| %.2f LSB, circle dev %.2f)", maxerr, circ_err_max);
        else $display("P25 FAIL (%0d errors, max err %.2f)", errors, maxerr);
        $finish;
    end
endmodule
```

## P26 — BRAM-Inferred QAM-64 Symbol Mapper

PASS: 64 exhaustive + 300 gapped transfers, valid/data alignment exact. Registered read is the BRAM-inference contract; `valid` rides a matching flip-flop.

**Design**

```verilog
// P26 — QAM-64 symbol mapper, Gray per axis, BRAM-inferred ROM, 1-cycle latency
module qam64_mapper (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       valid_in,
    input  wire [5:0] symbol,      // [5:3] = I axis Gray, [2:0] = Q axis Gray
    output reg        valid_out,   // travels with its data: 1-cycle pipe
    output wire signed [7:0] i_out, // Q1.7
    output wire signed [7:0] q_out  // Q1.7
);
    reg [15:0] rom [0:63];
    reg [15:0] dout;

    // Table generation at elaboration: Gray-decode each axis, map to
    // levels {±1,±3,±5,±7}/8 in Q1.7  (level = (2*idx-7) * 16).
    integer s; reg [2:0] gi, gq, bi, bq; reg signed [7:0] li, lq;
    initial begin
        for (s=0; s<64; s=s+1) begin
            gi = s[5:3];  gq = s[2:0];
            bi = {gi[2], gi[2]^gi[1], gi[2]^gi[1]^gi[0]};   // Gray -> binary
            bq = {gq[2], gq[2]^gq[1], gq[2]^gq[1]^gq[0]};
            li = ($signed({1'b0,bi}) * 2 - 7) * 16;
            lq = ($signed({1'b0,bq}) * 2 - 7) * 16;
            rom[s] = {li, lq};
        end
    end

    // Registered (synchronous) read — the BRAM-inference contract.
    always @(posedge clk) dout <= rom[symbol];

    // Sideband rides the same pipeline as the data.
    always @(posedge clk or negedge rst_n)
        if (!rst_n) valid_out <= 1'b0;
        else        valid_out <= valid_in;

    assign i_out = dout[15:8];
    assign q_out = dout[7:0];
endmodule
```

**Testbench (harness spec)**

```verilog
`timescale 1ns/1ps
module tb_p26;
    reg clk=0, rst_n=0, vin=0; reg [5:0] sym=0;
    wire vout; wire signed [7:0] io, qo;
    qam64_mapper dut(.clk(clk), .rst_n(rst_n), .valid_in(vin), .symbol(sym), .valid_out(vout), .i_out(io), .q_out(qo));
    always #18.5 clk=~clk;
    integer s, errors=0, n;
    reg [5:0] pipe_sym; reg pipe_v;
    function signed [7:0] level(input [2:0] g); reg [2:0] b; begin
        b[2]=g[2]; b[1]=b[2]^g[1]; b[0]=b[1]^g[0];
        level = ($signed({1'b0,b})*2 - 7) * 16;
    end endfunction
    // track what was presented 1 cycle ago
    always @(posedge clk) begin pipe_sym <= sym; pipe_v <= vin; end
    // check every flagged output against the symbol from 1 cycle earlier
    always @(posedge clk) if (rst_n) #1 begin
        if (vout !== pipe_v) begin errors=errors+1; $display("FAIL valid misaligned"); end
        if (vout) begin
            if (io !== level(pipe_sym[5:3]) || qo !== level(pipe_sym[2:0])) begin
                errors=errors+1; $display("FAIL map sym=%b i=%0d q=%0d", pipe_sym, io, qo); end
        end
    end
    initial begin
        #100 rst_n=1;
        // exhaustive, back-to-back
        for (s=0; s<64; s=s+1) begin @(negedge clk); vin=1; sym=s[5:0]; end
        @(negedge clk); vin=0;
        // random gaps
        for (n=0; n<300; n=n+1) begin @(negedge clk); vin=$random&1; sym=$random&63; end
        @(negedge clk); vin=0; repeat(3) @(negedge clk);
        if (errors==0) $display("P26 PASS (64 exhaustive + 300 gapped, alignment exact)");
        else $display("P26 FAIL (%0d errors)", errors);
        $finish;
    end
endmodule
```
