import { describe, it, expect, vi } from "vitest";
import { samplingUtils } from "../lib/samplingUtils.js";

// ─── Shared mock factory ──────────────────────────────────────────────────────

function makeSim({ hasVoltmeter = true, hasInputNode = false, clockValues = [], voltageMap = {} } = {}) {
  // All elements must implement getType/getLabelName because captureAnalog
  // iterates every element and calls those methods during discovery.
  const voltmeter = {
    getInfo: () => ["Voltmeter"],
    getType: () => "VoltmeterElm",
    getLabelName: () => "",
    getVoltageDiff: vi.fn(() => 5.0),
    getCurrent: vi.fn(() => 0.01),
  };

  const inputNode = {
    getInfo: () => ["Node"],
    getType: () => "LabeledNodeElm",
    getLabelName: () => "input",
  };

  const elements = [
    ...(hasVoltmeter ? [voltmeter] : []),
    ...(hasInputNode ? [inputNode] : []),
  ];

  let stepHandler = null;
  let clockIdx = 0;

  const sim = {
    getTimeStep: vi.fn(() => 0.001),
    getElements: vi.fn(() => elements),
    setSimRunning: vi.fn(),
    getNodeVoltage: vi.fn((label) => {
      if (label === "clk") {
        return clockValues[clockIdx++] ?? 0;
      }
      return voltageMap[label] ?? 0;
    }),
    get ontimestep() { return stepHandler; },
    set ontimestep(fn) { stepHandler = fn; },
    // Convenience: fire the current handler once
    tick() { if (stepHandler) stepHandler(); },
  };

  return { sim, voltmeter };
}

// ─── captureAnalog ────────────────────────────────────────────────────────────

describe("samplingUtils.captureAnalog", () => {
  it("rejects when no voltmeter is present in the circuit", async () => {
    const { sim } = makeSim({ hasVoltmeter: false });
    const promise = samplingUtils.captureAnalog(sim, { numSamples: 5 });

    // Trigger one step so the discover phase runs — the rejection should be synchronous
    // (Promise executor runs immediately)
    await expect(promise).rejects.toMatch(/Voltmeter/);
  });

  it("resolves with the correct shape after numSamples steps", async () => {
    const NUM = 4;
    const { sim } = makeSim({ hasVoltmeter: true });
    const promise = samplingUtils.captureAnalog(sim, { numSamples: NUM });

    // Manually fire the timestep handler NUM times to complete the capture
    for (let i = 0; i < NUM; i++) {
      sim.tick();
    }

    const result = await promise;
    expect(result.type).toBe("analog");
    expect(result.data.output).toHaveLength(NUM);
    expect(result.data.input).toHaveLength(NUM);
    expect(result.metrics).toHaveProperty("voltage");
    expect(result.metrics).toHaveProperty("current");
    expect(result.timeLabels).toHaveLength(NUM);
    expect(sim.setSimRunning).toHaveBeenCalledWith(false);
  });

  it("stops the simulation after capture is complete", async () => {
    const NUM = 3;
    const { sim } = makeSim({ hasVoltmeter: true });
    const promise = samplingUtils.captureAnalog(sim, { numSamples: NUM });

    for (let i = 0; i < NUM; i++) sim.tick();
    await promise;

    // Handler should be cleared
    expect(sim.ontimestep).toBeNull();
  });

  it("timeLabels are computed from timeStep in milliseconds", async () => {
    const NUM = 3;
    const { sim } = makeSim({ hasVoltmeter: true });
    sim.getTimeStep.mockReturnValue(0.001); // 1 ms

    const promise = samplingUtils.captureAnalog(sim, { numSamples: NUM });
    for (let i = 0; i < NUM; i++) sim.tick();
    const result = await promise;

    expect(parseFloat(result.timeLabels[0])).toBeCloseTo(0, 4);
    expect(parseFloat(result.timeLabels[1])).toBeCloseTo(1, 4);   // 1 ms
    expect(parseFloat(result.timeLabels[2])).toBeCloseTo(2, 4);   // 2 ms
  });
});

// ─── captureDigital ───────────────────────────────────────────────────────────

describe("samplingUtils.captureDigital", () => {
  it("rejects when the clock node is not found", async () => {
    const { sim } = makeSim({ clockValues: [] });
    sim.getNodeVoltage.mockImplementation(() => undefined); // clk not found
    const promise = samplingUtils.captureDigital(sim, { numCycles: 2 });

    // Fire one step to trigger the error path
    sim.tick();
    await expect(promise).rejects.toMatch(/clk/);
  });

  it("only records on rising clock edges", async () => {
    // Pattern: 0, 1, 1, 0, 1 → 2 rising edges at indices 1 and 4
    const clocks = [0, 3, 3, 0, 3];
    const { sim } = makeSim({ clockValues: clocks });

    const promise = samplingUtils.captureDigital(sim, { numCycles: 2, inputs: [], outputs: [] });
    for (let i = 0; i < clocks.length; i++) sim.tick();
    const result = await promise;

    expect(result.type).toBe("digital");
    expect(result.table).toHaveLength(2);
    expect(result.totalCycles).toBe(2);
  });

  it("resolves with correct structure after numCycles rising edges", async () => {
    // 3 cycles: each needs a 0→1 transition. Pattern: 0,1,0,1,0,1
    const clocks = [0, 3, 0, 3, 0, 3];
    const { sim } = makeSim({ clockValues: clocks });

    const promise = samplingUtils.captureDigital(sim, {
      numCycles: 3,
      inputs: [],
      outputs: [],
    });

    for (let i = 0; i < clocks.length; i++) sim.tick();
    const result = await promise;

    expect(result.table).toHaveLength(3);
    expect(result.table[0]).toMatchObject({ cycle: 0 });
    expect(result.table[1]).toMatchObject({ cycle: 1 });
    expect(result.table[2]).toMatchObject({ cycle: 2 });
    expect(sim.setSimRunning).toHaveBeenCalledWith(false);
  });

  it("packs output bus bits using LSB-first ordering", async () => {
    // Two output nodes: Q0 = high (5V), Q1 = low (0V) → decimal 1
    const clocks = [0, 5];
    const { sim } = makeSim({ clockValues: clocks, voltageMap: { Q0: 5, Q1: 0 } });

    const promise = samplingUtils.captureDigital(sim, {
      numCycles: 1,
      inputs: [],
      outputs: ["Q0", "Q1"],
    });

    for (let i = 0; i < clocks.length; i++) sim.tick();
    const result = await promise;

    expect(result.table[0].decimalOutput).toBe(1); // bit0=1, bit1=0 → 0b01 = 1
  });

  it("packs multi-bit bus correctly (Q0 low, Q1 high → decimal 2)", async () => {
    const clocks = [0, 5];
    const { sim } = makeSim({ clockValues: clocks, voltageMap: { Q0: 0, Q1: 5 } });

    const promise = samplingUtils.captureDigital(sim, {
      numCycles: 1,
      inputs: [],
      outputs: ["Q0", "Q1"],
    });

    for (let i = 0; i < clocks.length; i++) sim.tick();
    const result = await promise;

    expect(result.table[0].decimalOutput).toBe(2); // bit0=0, bit1=1 → 0b10 = 2
  });
});
