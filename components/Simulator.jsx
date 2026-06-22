"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { samplingUtils } from "@/lib/samplingUtils";
import { discoverDigitalIO } from "@/lib/circuitDiscovery";
import { patchTimeStep } from "@/lib/netlistUtils";

// Format a frequency in Hz with a thin-space separator, matching the design.
const formatFreq = (f) => {
  if (f == null || !isFinite(f) || f <= 0) return "—";
  if (f >= 1e6) return (f / 1e6).toFixed(3) + " MHz";
  if (f >= 1e3) return (f / 1e3).toFixed(3) + " kHz";
  return f.toFixed(3) + " Hz";
};

// Adaptive time readout: seconds once past 1s, otherwise ms (matches
// circuit.test.html), with a thin-space before the unit.
const formatTime = (t) =>
  t >= 1 ? t.toFixed(2) + " s" : (t * 1000).toFixed(1) + " ms";

// Fallback resonant frequency 1/(2*pi*sqrt(L*C)) parsed straight from the
// netlist, used when the runtime doesn't expose getResonantFrequency().
const computeResFFromNetlist = (netlist) => {
  if (!netlist) return null;
  let L = null;
  let C = null;
  for (const line of netlist.split("\n")) {
    const p = line.trim().split(/\s+/);
    if (p[0] === "l" && L === null && p.length >= 7) L = parseFloat(p[6]);
    if (p[0] === "c" && C === null && p.length >= 7) C = parseFloat(p[6]);
  }
  return L > 0 && C > 0 ? 1 / (2 * Math.PI * Math.sqrt(L * C)) : null;
};

// Full CircuitJS "Draw" menu, mirroring composeMainMenu() in Menus.java.
// Leaves default to the "main" menu (add-element); items can override `menu`.
// Categories use `children`; `divider: true` renders a separator.
const DRAW_MENU = [
  { label: "Add Wire", item: "WireElm" },
  { label: "Add Routed Wire", item: "RoutedWireElm" },
  { label: "Add Resistor", item: "ResistorElm" },
  { label: "Passive Components", children: [
    { label: "Add Capacitor", item: "CapacitorElm" },
    { label: "Add Capacitor (polarized)", item: "PolarCapacitorElm" },
    { label: "Add Inductor", item: "InductorElm" },
    { label: "Add Switch", item: "SwitchElm" },
    { label: "Add Push Switch", item: "PushSwitchElm" },
    { label: "Add SPDT Switch", item: "Switch2Elm" },
    { label: "Add DPDT Switch", item: "DPDTSwitchElm" },
    { label: "Add Make-Before-Break Switch", item: "MBBSwitchElm" },
    { label: "Add Potentiometer", item: "PotElm" },
    { label: "Add Transformer", item: "TransformerElm" },
    { label: "Add Tapped Transformer", item: "TappedTransformerElm" },
    { label: "Add Custom Transformer", item: "CustomTransformerElm" },
    { label: "Add Transmission Line", item: "TransLineElm" },
    { label: "Add Relay", item: "RelayElm" },
    { label: "Add Relay Coil", item: "RelayCoilElm" },
    { label: "Add Relay Contact", item: "RelayContactElm" },
    { label: "Add Photoresistor", item: "LDRElm" },
    { label: "Add Thermistor", item: "ThermistorNTCElm" },
    { label: "Add Memristor", item: "MemristorElm" },
    { label: "Add Spark Gap", item: "SparkGapElm" },
    { label: "Add Fuse", item: "FuseElm" },
    { label: "Add Crystal", item: "CrystalElm" },
    { label: "Add Cross Switch", item: "CrossSwitchElm" },
    { label: "Add Gyrator", item: "GyratorElm" },
  ]},
  { label: "Inputs and Sources", children: [
    { label: "Add Ground", item: "GroundElm" },
    { label: "Add Voltage Source (2-terminal)", item: "DCVoltageElm" },
    { label: "Add A/C Voltage Source (2-terminal)", item: "ACVoltageElm" },
    { label: "Add Voltage Source (1-terminal)", item: "RailElm" },
    { label: "Add A/C Voltage Source (1-terminal)", item: "ACRailElm" },
    { label: "Add Square Wave Source (1-terminal)", item: "SquareRailElm" },
    { label: "Add Clock", item: "ClockElm" },
    { label: "Add A/C Sweep", item: "SweepElm" },
    { label: "Add Variable Voltage", item: "VarRailElm" },
    { label: "Add Antenna", item: "AntennaElm" },
    { label: "Add AM Source", item: "AMElm" },
    { label: "Add FM Source", item: "FMElm" },
    { label: "Add Current Source", item: "CurrentElm" },
    { label: "Add Noise Generator", item: "NoiseElm" },
    { label: "Add Audio Input", item: "AudioInputElm" },
    { label: "Add Data Input", item: "DataInputElm" },
    { label: "Add External Voltage (JavaScript)", item: "ExtVoltageElm" },
  ]},
  { label: "Outputs and Labels", children: [
    { label: "Add Analog Output", item: "OutputElm" },
    { label: "Add LED", item: "LEDElm" },
    { label: "Add Lamp", item: "LampElm" },
    { label: "Add Text", item: "TextElm" },
    { label: "Add Box", item: "BoxElm" },
    { label: "Add Line", item: "LineElm" },
    { label: "Add Labeled Node", item: "LabeledNodeElm" },
    { label: "Add Voltmeter/Scope Probe", item: "ProbeElm" },
    { label: "Add Ohmmeter", item: "OhmMeterElm" },
    { label: "Add Ammeter", item: "AmmeterElm" },
    { label: "Add Wattmeter", item: "WattmeterElm" },
    { label: "Add Test Point", item: "TestPointElm" },
    { label: "Add Decimal Display", item: "DecimalDisplayElm" },
    { label: "Add Instruction Display", item: "InstructionDisplayElm" },
    { label: "Add LED Array", item: "LEDArrayElm" },
    { label: "Add Data Export", item: "DataRecorderElm" },
    { label: "Add Audio Output", item: "AudioOutputElm" },
    { label: "Add Stop Trigger", item: "StopTriggerElm" },
    { label: "Add DC Motor", item: "DCMotorElm" },
    { label: "Add 3-Phase Motor", item: "ThreePhaseMotorElm" },
  ]},
  { label: "Active Components", children: [
    { label: "Add Diode", item: "DiodeElm" },
    { label: "Add Zener Diode", item: "ZenerElm" },
    { label: "Add Transistor (bipolar, NPN)", item: "NTransistorElm" },
    { label: "Add Transistor (bipolar, PNP)", item: "PTransistorElm" },
    { label: "Add MOSFET (N-Channel)", item: "NMosfetElm" },
    { label: "Add MOSFET (P-Channel)", item: "PMosfetElm" },
    { label: "Add JFET (N-Channel)", item: "NJfetElm" },
    { label: "Add JFET (P-Channel)", item: "PJfetElm" },
    { label: "Add SCR", item: "SCRElm" },
    { label: "Add DIAC", item: "DiacElm" },
    { label: "Add TRIAC", item: "TriacElm" },
    { label: "Add Darlington Pair (NPN)", item: "NDarlingtonElm" },
    { label: "Add Darlington Pair (PNP)", item: "PDarlingtonElm" },
    { label: "Add Varactor/Varicap", item: "VaractorElm" },
    { label: "Add Tunnel Diode", item: "TunnelDiodeElm" },
    { label: "Add Triode", item: "TriodeElm" },
    { label: "Add Unijunction Transistor", item: "UnijunctionElm" },
  ]},
  { label: "Active Building Blocks", children: [
    { label: "Add Op Amp (ideal, - on top)", item: "OpAmpElm" },
    { label: "Add Op Amp (ideal, + on top)", item: "OpAmpSwapElm" },
    { label: "Add Op Amp (real)", item: "OpAmpRealElm" },
    { label: "Add Analog Switch (SPST)", item: "AnalogSwitchElm" },
    { label: "Add Analog Switch (SPDT)", item: "AnalogSwitch2Elm" },
    { label: "Add Analog Multiplexer", item: "AnalogMuxElm" },
    { label: "Add Tristate Buffer", item: "TriStateElm" },
    { label: "Add Schmitt Trigger", item: "SchmittElm" },
    { label: "Add Schmitt Trigger (Inverting)", item: "InvertingSchmittElm" },
    { label: "Add Delay Buffer", item: "DelayBufferElm" },
    { label: "Add CCII+", item: "CC2Elm" },
    { label: "Add CCII-", item: "CC2NegElm" },
    { label: "Add Comparator (Hi-Z/GND output)", item: "ComparatorElm" },
    { label: "Add OTA (LM13700 style)", item: "OTAElm" },
    { label: "Add Voltage-Controlled Voltage Source (VCVS)", item: "VCVSElm" },
    { label: "Add Voltage-Controlled Current Source (VCCS)", item: "VCCSElm" },
    { label: "Add Current-Controlled Voltage Source (CCVS)", item: "CCVSElm" },
    { label: "Add Current-Controlled Current Source (CCCS)", item: "CCCSElm" },
    { label: "Add Optocoupler", item: "OptocouplerElm" },
    { label: "Add Time Delay Relay", item: "TimeDelayRelayElm" },
    { label: "Add LM317", item: "CustomCompositeElm:~LM317-v2" },
    { label: "Add TL431", item: "CustomCompositeElm:~TL431" },
    { label: "Add Motor Protection Switch", item: "MotorProtectionSwitchElm" },
    { label: "Add Subcircuit Instance", item: "CustomCompositeElm" },
  ]},
  { label: "Logic Gates, Input and Output", children: [
    { label: "Add Logic Input", item: "LogicInputElm" },
    { label: "Add Logic Output", item: "LogicOutputElm" },
    { label: "Add Bus Input", item: "BusLogicInputElm" },
    { label: "Add Inverter", item: "InverterElm" },
    { label: "Add NAND Gate", item: "NandGateElm" },
    { label: "Add NOR Gate", item: "NorGateElm" },
    { label: "Add AND Gate", item: "AndGateElm" },
    { label: "Add OR Gate", item: "OrGateElm" },
    { label: "Add XOR Gate", item: "XorGateElm" },
    { label: "Add XNOR Gate", item: "XnorGateElm" },
  ]},
  { label: "Digital Chips", children: [
    { label: "Add D Flip-Flop", item: "DFlipFlopElm" },
    { label: "Add JK Flip-Flop", item: "JKFlipFlopElm" },
    { label: "Add T Flip-Flop", item: "TFlipFlopElm" },
    { label: "Add 7 Segment LED", item: "SevenSegElm" },
    { label: "Add 7 Segment Decoder", item: "SevenSegDecoderElm" },
    { label: "Add Multiplexer", item: "MultiplexerElm" },
    { label: "Add Demultiplexer", item: "DeMultiplexerElm" },
    { label: "Add SIPO shift register", item: "SipoShiftElm" },
    { label: "Add PISO shift register", item: "PisoShiftElm" },
    { label: "Add Counter", item: "CounterElm" },
    { label: "Add Counter w/ Load", item: "Counter2Elm" },
    { label: "Add Ring Counter", item: "DecadeElm" },
    { label: "Add Latch", item: "LatchElm" },
    { label: "Add Sequence generator", item: "SeqGenElm" },
    { label: "Add Adder", item: "FullAdderElm" },
    { label: "Add Half Adder", item: "HalfAdderElm" },
    { label: "Add Custom Logic", item: "UserDefinedLogicElm" },
    { label: "Add Static RAM", item: "SRAMElm" },
    { label: "Add ROM", item: "ROMElm" },
    { label: "Add Bus Transceiver", item: "BusTransceiverElm" },
    { label: "Add Bus Splitter", item: "BusSplitterElm" },
  ]},
  { label: "Analog and Hybrid Chips", children: [
    { label: "Add 555 Timer", item: "TimerElm" },
    { label: "Add Phase Comparator", item: "PhaseCompElm" },
    { label: "Add DAC", item: "DACElm" },
    { label: "Add ADC", item: "ADCElm" },
    { label: "Add VCO", item: "VCOElm" },
    { label: "Add Monostable", item: "MonostableElm" },
  ]},
  { label: "Drag", children: [
    { label: "Drag All", item: "DragAll" },
    { label: "Drag Row", item: "DragRow" },
    { label: "Drag Column", item: "DragColumn" },
    { label: "Drag Selected", item: "DragSelected" },
    { label: "Drag Post", item: "DragPost" },
  ]},
  { label: "Select / Drag Sel", item: "Select" },
  { divider: true },
  { label: "Import from Text…", menu: "file", item: "importfromtext" },
  { label: "Save As…", item: "exportaslocalfile" }, // routes via "main" (works on current runtime)
  { label: "Create Subcircuit…", menu: "file", item: "createsubcircuit" },
];

const drawItemClass =
  "w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-md whitespace-nowrap";

// Recursive renderer for a draw-menu node: a leaf button, a divider, or a
// category that reveals its children in a hover flyout to the right.
//
// The flyout is rendered through a portal with fixed positioning rather than
// nested inside the scrolling parent dropdown. The parent uses overflow-y:auto
// (which forces overflow-x to auto), so an in-flow `left-full` flyout would be
// clipped — and the resulting horizontal-scrollbar flicker is what made the
// menu jitter while scrolling. A portal escapes the clip entirely; fixed
// positioning alone is not enough because the dropdown's backdrop-filter
// establishes a containing block.
function DrawMenuNode({ node, onPick }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);

  const cancelClose = () => clearTimeout(closeTimer.current);
  // Small grace period so moving the cursor across the gap to the flyout
  // doesn't close it.
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  const openFlyout = () => {
    cancelClose();
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      const vh = window.innerHeight;
      const maxH = vh * 0.7;
      // Clamp vertically so a category near the bottom still fits on screen.
      const top = Math.max(8, Math.min(r.top, vh - 8 - maxH));
      setPos({ top, left: r.right + 4 });
    }
    setOpen(true);
  };

  // Close the (fixed-positioned) flyout on any scroll so it can't float
  // detached from its trigger when the parent dropdown scrolls.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  if (node.divider) {
    return <div className="my-1 mx-2 h-px bg-white/10" />;
  }

  if (node.children) {
    return (
      <div
        ref={triggerRef}
        onMouseEnter={openFlyout}
        onMouseLeave={scheduleClose}
      >
        <button onClick={(e) => e.stopPropagation()} className={`${drawItemClass} flex items-center justify-between gap-4`}>
          <span>{node.label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </button>
        {open && typeof document !== "undefined" && createPortal(
          <div
            className="fixed flex flex-col min-w-[210px] max-h-[70vh] overflow-y-auto bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-xl py-1.5 px-1 shadow-2xl z-[80]"
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {node.children.map((child, i) => (
              <DrawMenuNode key={i} node={child} onPick={onPick} />
            ))}
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onPick(node.menu || "main", node.item); }}
      className={drawItemClass}
    >
      {node.label}
    </button>
  );
}

export default function Simulator({
  circuit,
  onSubmit,
  mode = "sample",
  isDigital = false,
  loads = null,
  sampleCount,
  timeStep
}) {
  const [fullScreen, setFullScreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Premium UI states
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(78);
  const [simTime, setSimTime] = useState("0.0 s");
  const [resF, setResF] = useState("—");

  const [activeMenu, setActiveMenu] = useState(null);
  const [activeTool, setActiveTool] = useState("draw");

  const iframeRef = useRef(null);
  const loadTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const guardTimerRef = useRef(null);
  const bootedRef = useRef(false);

  const getSim = () => iframeRef.current?.contentWindow?.CircuitJS1 || null;

  // Resonant frequency: prefer the runtime's getResonantFrequency() (added to
  // the patched JSInterface), and fall back to parsing L/C from the netlist
  // prop so the readout still works against an un-patched build.
  const fallbackResF = useMemo(() => computeResFFromNetlist(circuit), [circuit]);
  const readResF = (sim) => {
    if (sim && typeof sim.getResonantFrequency === "function") {
      const f = sim.getResonantFrequency();
      if (isFinite(f) && f > 0) return f;
    }
    return fallbackResF;
  };

  useEffect(() => {
    return () => {
      clearTimeout(loadTimerRef.current);
      clearInterval(pollTimerRef.current);
      clearInterval(guardTimerRef.current);
    };
  }, []);

  // Poll simulator time + resonant frequency.
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      const sim = getSim();
      if (!sim) return;
      if (isRunning) setSimTime(formatTime(sim.getTime()));
      // Resonant frequency only changes when the circuit is edited, but it's
      // cheap to keep in sync here so manual edits are reflected live.
      setResF(formatFreq(readResF(sim)));
    }, 100);
    return () => clearInterval(pollTimerRef.current);
  }, [isRunning, fallbackResF]);

  // Pin the solver to the problem's declared step. The header patch in
  // importTemplate handles a well-formed netlist, but this guarantees it
  // deterministically via the runtime setter (sets sim.timeStep AND
  // sim.maxTimeStep) — covering a netlist with no parseable `$` header. No-op
  // when the step is unknown or the setter is unavailable (un-patched runtime).
  const applySimTimeStep = (sim) => {
    const ts = Number(timeStep);
    if (!isFinite(ts) || ts <= 0) {
      console.warn(`[Simulator] No valid timeStep prop (got ${timeStep}); using netlist default.`);
      return;
    }
    if (typeof sim.setMaxTimeStep === "function") {
      sim.setMaxTimeStep(ts);
    }
  };

  // Pure import: push the template into an already-ready sim. Returns the
  // resulting on-canvas element count so callers can tell a real circuit
  // (>0) from a blank one.
  const importTemplate = () => {
    const sim = getSim();
    if (!sim) return -1;
    try {
      // Force the per-problem time step (from the problem doc) into the netlist
      // header so the solver — and therefore the capture sample rate — runs at
      // the exact rate the golden was graded at. Template headers otherwise
      // carry CircuitJS's default step, which the grader rejects.
      sim.importCircuit(patchTimeStep(circuit, timeStep), false);
      applySimTimeStep(sim);
      sim.setSimRunning(isRunning);
      setSimTime("0.0 s");
      setResF(formatFreq(readResF(sim)));
      return sim.getElements ? sim.getElements().length : 0;
    } catch (e) {
      console.error("❌ Error loading circuit:", e);
      return -1;
    }
  };

  // Used by the Reset-template button — sim is already running, so a plain
  // re-import is enough (no startup race to guard against here).
  const loadCircuit = () => {
    const sim = getSim();
    if (!sim) {
      loadTimerRef.current = setTimeout(loadCircuit, 10);
      return;
    }
    importTemplate();
  };

  // Initial bootstrap. The runtime loads its `startCircuit=blank.txt` via an
  // *async* fetch that resolves shortly after `oncircuitjsloaded` fires — if
  // we import before that lands, blank.txt silently wipes our circuit ~1s
  // later (the "shows then disappears" bug). Rather than racing it with a
  // blind delay, we import immediately and then watch for the canvas being
  // reset to empty, re-asserting our template until it sticks. This is
  // machine-speed independent: a slow device that clobbers late is still
  // corrected, and a fast one that never clobbers stops on the first check.
  const bootCircuit = () => {
    const sim = getSim();
    if (!sim) {
      loadTimerRef.current = setTimeout(bootCircuit, 10);
      return;
    }

    const expected = importTemplate();
    // Blank/empty templates have nothing to protect — a 0-count canvas is the
    // intended state, so there's no clobber to distinguish.
    if (expected <= 0) return;

    let elapsed = 0;
    clearInterval(guardTimerRef.current);
    guardTimerRef.current = setInterval(() => {
      elapsed += 150;
      const s = getSim();
      const count = s && s.getElements ? s.getElements().length : 0;
      // Canvas dropped below our import → the startup load clobbered it.
      if (count < expected) importTemplate();
      if (elapsed >= 3000) clearInterval(guardTimerRef.current);
    }, 150);
  };

  // One-shot bootstrap trigger: whichever readiness signal wins the race.
  const bootOnce = () => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    clearTimeout(loadTimerRef.current);
    bootCircuit();
  };

  const handleIframeLoad = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      loadTimerRef.current = setTimeout(handleIframeLoad, 50);
      return;
    }
    // Patched runtime already up — boot now (the guard still covers the
    // late blank.txt clobber).
    if (win.CircuitJS1) {
      bootOnce();
      return;
    }
    // Preferred path: readiness handshake fired once GWT onModuleLoad
    // completes (see docs/SIMULATOR.md §6C), replacing the old blind 2s delay.
    win.oncircuitjsloaded = () => bootOnce();
    // Safety net for an un-patched runtime that never fires the hook.
    loadTimerRef.current = setTimeout(bootOnce, 2000);
  };

  const toggleRun = () => {
    const sim = getSim();
    if (sim) {
      sim.setSimRunning(!isRunning);
    }
    setIsRunning(!isRunning);
  };

  const handleSpeedDrag = (e) => {
    e.preventDefault();
    const track = e.currentTarget;
    const move = (ev) => {
      const r = track.getBoundingClientRect();
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      let newSpeed = ((x - r.left) / r.width) * 100;
      newSpeed = Math.max(0, Math.min(100, Math.round(newSpeed)));
      setSimSpeed(newSpeed);
      const sim = getSim();
      if (sim && sim.setSpeed) {
        sim.setSpeed(newSpeed);
      }
    };
    move(e);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handleMenuClick = (menu, action) => {
    const sim = getSim();
    if (sim?.triggerMenu) {
      sim.triggerMenu(menu, action);
    }

    if (menu === "main" && (action === "Select" || action === "DragAll")) {
      setActiveTool("select");
    } else if (menu === "main" && action !== "newblankcircuit" && !action.startsWith("export")) {
      setActiveTool("draw");
    }

    setActiveMenu(null);
  };

  const handleInternalSubmit = async () => {
    const sim = getSim();
    if (!sim) return;

    if (mode === "export") {
      onSubmit(null, sim);
      return;
    }

    // Guarantee the capture runs at the problem's declared step right before
    // sampling, regardless of how the current canvas was loaded.
    applySimTimeStep(sim);

    // Auto-reset to t=0 so the capture always starts from a clean operating
    // point — no more "please click Reset" gate. reset() clears transient sim
    // state only, never the circuit topology the user built. The load sweep
    // resets per-load internally, so this is just for the single-capture paths.
    sim.reset?.();

    try {
      setIsAnalyzing(true);

      let digitalParams = { clkElm: null, inputs: [], outputs: [] };

      if (isDigital) {
        // Type/label-based discovery via the shared shim (locale-independent,
        // single typed scan instead of iterating every element here).
        digitalParams = discoverDigitalIO(sim);

        if (!digitalParams.clkElm) {
          throw new Error("Digital Discovery Failed: No element found with 'square wave gen' in its info.");
        }

        if (digitalParams.outputs.length === 0) {
          throw new Error("Digital Discovery Failed: No nodes labeled 'Output0', 'Output1', etc. found.");
        }
      }

      sim.setSimRunning(true);
      setIsRunning(true);

      let capturedData;
      if (isDigital) {
        capturedData = await samplingUtils.captureDigital(sim, {
          inputs: digitalParams.inputs,
          outputs: digitalParams.outputs,
          numCycles: 330
        });
      } else if (loads) {
        // Load problems: one Submit drives all three testbench loads
        // (No-load / Max / Min) in code and returns three captures
        // ({ type: "loadSweep", tests }), graded together downstream.
        capturedData = await samplingUtils.captureLoadSweep(sim, {
          loads,
          numSamples: Number(sampleCount) || 30720,
        });
      } else {
        capturedData = await samplingUtils.captureAnalog(sim, {
          numSamples: Number(sampleCount) || 30720,
        });
      }

      onSubmit(capturedData, sim);
    } catch (err) {
      alert(err.message || err);
    } finally {
      setIsAnalyzing(false);
      // Ensure local state matches sim state
      setIsRunning(sim.isRunning ? sim.isRunning() : false);
    }
  };

  return (
    <div className={`w-full h-full flex flex-col p-2 bg-[#070707] font-sans ${fullScreen ? "fixed inset-0 z-50 p-0" : ""}`}>
      <div className="relative h-full w-full rounded-lg border border-white/10 overflow-hidden shadow-inner bg-[#070707]">

        {/* Premium canvas surface: dotted grid + radial wash, matching the
            Simulator Premium design. Sits behind the (transparent) sim canvas. */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundColor: "#070707",
            backgroundImage:
              "radial-gradient(#161616 1.1px, transparent 1.1px), radial-gradient(125% 95% at 50% 30%, #191919 0%, #070707 72%)",
            backgroundSize: "26px 26px, 100% 100%",
          }}
        />

        {isAnalyzing && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center">
            <span className="loading loading-ring loading-lg text-green-400"></span>
            <p className="mt-4 font-mono text-sm animate-pulse uppercase">
              {isDigital ? "Sampling Logic signals..." : "Sampling Analog Signal..."}
            </p>
          </div>
        )}

        {/* Invisible overlay for closing dropdown menus */}
        {activeMenu && (
          <div
            className="absolute inset-0 z-10"
            onClick={() => setActiveMenu(null)}
          />
        )}

        {/* Top-left : tools */}
        <div className="absolute top-[18px] left-[18px] z-20 flex items-center gap-[3px] p-[4px] bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-[0_6px_22px_rgba(0,0,0,0.4)]">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "draw" ? null : "draw"); }}
              title="Draw"
              className={`w-[34px] h-[34px] border-0 rounded-full flex items-center justify-center cursor-pointer transition-all ${activeTool === 'draw' ? 'bg-green-600/20 text-green-400' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.586 7.586"/></svg>
            </button>
            {activeMenu === "draw" && (
              <div className="absolute top-full left-0 mt-2 min-w-[210px] max-h-[78vh] overflow-y-auto bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-xl py-1.5 px-1 shadow-2xl z-50">
                {DRAW_MENU.map((node, i) => (
                  <DrawMenuNode key={i} node={node} onPick={handleMenuClick} />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "scopes" ? null : "scopes"); }}
              title="Scopes"
              className="w-[34px] h-[34px] border-0 bg-transparent rounded-full flex items-center justify-center text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2 6 4-14 2 8h6"/></svg>
            </button>
            {activeMenu === "scopes" && (
              <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-xl py-1.5 shadow-2xl z-50">
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("scopes", "stackAll"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Stack All Scopes</button>
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("scopes", "unstackAll"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Unstack All Scopes</button>
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("scopes", "combineAll"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Combine All Scopes</button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "select" ? null : "select"); }}
              title="Edit / select"
              className={`w-[34px] h-[34px] border-0 rounded-full flex items-center justify-center cursor-pointer transition-all ${activeTool === 'select' ? 'bg-green-600/20 text-green-400' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 17 2.51-7.39L20 10.07z"/></svg>
            </button>
            {activeMenu === "select" && (
              <div className="absolute top-full left-0 mt-2 min-w-[150px] bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-xl py-1.5 shadow-2xl z-50">
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("main", "Select"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Select / Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("main", "DragAll"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Drag All</button>
              </div>
            )}
          </div>

          <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "more" ? null : "more"); }}
              title="More tools"
              className="w-[34px] h-[34px] border-0 bg-transparent rounded-full flex items-center justify-center text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {activeMenu === "more" && (
              <div className="absolute top-full left-0 mt-2 min-w-[150px] bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-xl py-1.5 shadow-2xl z-50">
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("main", "newblankcircuit"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Clear Canvas</button>
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("main", "exportasurl"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Export as Link</button>
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("main", "exportasimage"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Export as Image</button>
                <button onClick={(e) => { e.stopPropagation(); handleMenuClick("main", "exportastext"); }} className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">Export as Text</button>
              </div>
            )}
          </div>
        </div>

        {/* Top-right : status readout / reset / run-stop / reset-template / submit / fullscreen */}
        <div className="absolute top-[18px] right-[18px] z-20 flex items-center gap-[9px]">

          {/* status readout */}
          <div className="flex items-center gap-[14px] px-[15px] py-[7px] bg-[#121214]/80 backdrop-blur-md border border-white/10 rounded-[13px] shadow-[0_6px_22px_rgba(0,0,0,0.4)]">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500 mb-[2px]">Time</div>
              <div className="font-mono text-[13px] font-semibold text-gray-200">{simTime}</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500 mb-[2px]">Res&middot;F</div>
              <div className="font-mono text-[13px] font-semibold text-green-400">{resF}</div>
            </div>
            {isRunning ? (
              <span className="w-[9px] h-[9px] rounded-full bg-green-500 shadow-[0_0_9px_#22c55e] animate-pulse"></span>
            ) : (
              <span className="w-[9px] h-[9px] rounded-full bg-gray-600"></span>
            )}
          </div>

          {/* reset simulation (time -> 0) */}
          <button onClick={() => getSim()?.reset?.()} title="Reset simulation" className="w-10 h-10 border border-white/10 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-all">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/></svg>
          </button>

          {/* run / stop toggle */}
          <button onClick={toggleRun} title={isRunning ? "Stop" : "Run"} className={`w-[42px] h-[42px] border-0 rounded-full flex items-center justify-center text-white cursor-pointer transition-all ${isRunning ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_0_1px_rgba(239,68,68,0.5),0_4px_16px_rgba(239,68,68,0.5)]' : 'bg-green-600 hover:bg-green-700 shadow-[0_0_0_1px_rgba(22,163,74,0.5),0_4px_16px_rgba(22,163,74,0.55)]'}`}>
            {isRunning ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <div className="w-[1px] h-[24px] bg-white/15"></div>

          {/* reset to template */}
          <button onClick={loadCircuit} title="Reset to template" className="w-10 h-10 border border-white/10 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-all">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20" fill="currentColor" stroke="none"/><line x1="5" y1="5" x2="5" y2="19"/></svg>
          </button>

          {/* submit solution (runs the capture/grading) */}
          <button onClick={handleInternalSubmit} disabled={isAnalyzing} title="Submit solution" className={`w-10 h-10 border-0 bg-green-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-[0_2px_14px_rgba(22,163,74,0.5)] hover:bg-green-700 transition-all ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>

          {/* fullscreen */}
          <button onClick={() => setFullScreen(!fullScreen)} title="Fullscreen" className="w-10 h-10 border border-white/10 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-all">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        </div>

        {/* Bottom-right : sim speed */}
        <div className="absolute bottom-[18px] right-[18px] z-20 flex items-center gap-[10px] px-[14px] py-[8px] bg-[#121214]/80 backdrop-blur-md border border-white/10 rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Speed</span>
          <div onPointerDown={handleSpeedDrag} className="relative w-[116px] h-[14px] flex items-center cursor-pointer touch-none">
            <div className="absolute left-0 right-0 h-1 rounded-full bg-white/10"></div>
            <div className="absolute left-0 h-1 rounded-full bg-green-500" style={{ width: `${simSpeed}%` }}></div>
            <div className="absolute w-[15px] h-[15px] rounded-full bg-white border-2 border-green-500 shadow-[0_1px_5px_rgba(0,0,0,0.55)]" style={{ left: `${simSpeed}%`, transform: 'translateX(-50%)' }}></div>
          </div>
          <span className="font-mono text-[12px] font-semibold text-gray-200 min-w-[30px] text-right">{simSpeed}%</span>
        </div>

        <iframe
          ref={iframeRef}
          src="/circuitAPI/circuitjs.html?startCircuit=blank.txt&hideMenu=true&hideSidebar=true&whitebg=false"
          onLoad={handleIframeLoad}
          className="absolute inset-0 w-full h-full border-none z-[1]"
          style={{ background: "transparent" }}
        />

        {/* Inner vignette — frames the canvas, matches the design's inset shadow.
            pointer-events-none so it never intercepts clicks on the sim. */}
        <div className="absolute inset-0 z-[2] pointer-events-none shadow-[inset_0_0_160px_40px_rgba(0,0,0,0.6)]" />
      </div>
    </div>
  );
}