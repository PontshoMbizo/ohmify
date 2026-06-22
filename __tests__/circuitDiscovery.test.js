import { describe, it, expect, vi } from "vitest";
import {
  getLabeledNodes,
  findElementByLabel,
  hasLabeledNode,
  findVoltmeter,
  findClock,
  discoverDigitalIO,
  checkCircuitHealth,
} from "../lib/circuitDiscovery.js";

// ─── Element + sim factories ──────────────────────────────────────────────────

const labeledNode = (label) => ({
  getType: () => "LabeledNodeElm",
  getLabelName: () => label,
  getInfo: () => ["Labeled Node"],
});

const voltmeter = () => ({
  getType: () => "ProbeElm",
  getLabelName: () => "",
  getInfo: () => ["Voltmeter", "V = 5"],
});

const squareWave = () => ({
  getType: () => "RailElm",
  getLabelName: () => "",
  getInfo: () => ["square wave gen", "f = 1kHz"],
});

const resistor = () => ({
  getType: () => "ResistorElm",
  getLabelName: () => "",
  getInfo: () => ["Resistor", "100Ω"],
});

/**
 * Build a sim mock. `patched: true` exposes the new typed/indexed accessors
 * (getElementsByType / getElementByLabel); `patched: false` exposes only the
 * legacy getElements() scan so the fallback paths are exercised.
 */
function makeSim(elements, { patched = true } = {}) {
  const sim = {
    getElements: vi.fn(() => elements),
  };
  if (patched) {
    sim.getElementsByType = vi.fn((type) =>
      elements.filter((e) => e.getType() === type)
    );
    sim.getElementByLabel = vi.fn(
      (label) =>
        elements.find(
          (e) => e.getType() === "LabeledNodeElm" && e.getLabelName() === label
        ) || null
    );
  }
  return sim;
}

// ─── getLabeledNodes ──────────────────────────────────────────────────────────

describe("getLabeledNodes", () => {
  it("uses the typed accessor when available (no full scan)", () => {
    const elements = [labeledNode("clk"), resistor(), labeledNode("Output0")];
    const sim = makeSim(elements, { patched: true });

    const nodes = getLabeledNodes(sim);

    expect(nodes).toHaveLength(2);
    expect(sim.getElementsByType).toHaveBeenCalledWith("LabeledNodeElm");
    expect(sim.getElements).not.toHaveBeenCalled();
  });

  it("falls back to a filtered getElements() scan when un-patched", () => {
    const elements = [labeledNode("clk"), resistor(), labeledNode("Output0")];
    const sim = makeSim(elements, { patched: false });

    const nodes = getLabeledNodes(sim);

    expect(nodes).toHaveLength(2);
    expect(sim.getElements).toHaveBeenCalled();
  });
});

// ─── findElementByLabel / hasLabeledNode ──────────────────────────────────────

describe("findElementByLabel", () => {
  it("returns the matching node via the indexed accessor", () => {
    const sim = makeSim([labeledNode("input"), labeledNode("clk")], { patched: true });
    expect(findElementByLabel(sim, "input").getLabelName()).toBe("input");
    expect(sim.getElementByLabel).toHaveBeenCalledWith("input");
  });

  it("returns null when the label is absent", () => {
    const sim = makeSim([labeledNode("clk")], { patched: true });
    expect(findElementByLabel(sim, "input")).toBeNull();
  });

  it("falls back to scanning labeled nodes when un-patched", () => {
    const sim = makeSim([labeledNode("input")], { patched: false });
    expect(findElementByLabel(sim, "input").getLabelName()).toBe("input");
  });
});

describe("hasLabeledNode", () => {
  it("is true only when the exact label exists", () => {
    const sim = makeSim([labeledNode("input")], { patched: true });
    expect(hasLabeledNode(sim, "input")).toBe(true);
    expect(hasLabeledNode(sim, "output")).toBe(false);
  });
});

// ─── findVoltmeter / findClock (behaviour/info-string based) ───────────────────

describe("findVoltmeter", () => {
  it("finds the voltmeter by its (localized) info string, case-insensitively", () => {
    const sim = makeSim([resistor(), voltmeter()]);
    expect(findVoltmeter(sim)).not.toBeNull();
  });

  it("returns null when no voltmeter is present", () => {
    const sim = makeSim([resistor(), labeledNode("input")]);
    expect(findVoltmeter(sim)).toBeNull();
  });
});

describe("findClock", () => {
  it("finds the square-wave generator", () => {
    const sim = makeSim([resistor(), squareWave()]);
    expect(findClock(sim)).not.toBeNull();
  });

  it("returns null without a clock", () => {
    const sim = makeSim([resistor()]);
    expect(findClock(sim)).toBeNull();
  });
});

// ─── discoverDigitalIO ────────────────────────────────────────────────────────

describe("discoverDigitalIO", () => {
  it("collects clk + Input/Output buses in LSB-first numeric order", () => {
    const elements = [
      labeledNode("Output1"),
      labeledNode("Input0"),
      squareWave(),
      labeledNode("Output0"),
      labeledNode("Input1"),
      labeledNode("Output10"), // ensures numeric (not lexicographic) sort
      resistor(),
    ];
    const sim = makeSim(elements, { patched: true });

    const { clkElm, inputs, outputs } = discoverDigitalIO(sim);

    expect(clkElm).not.toBeNull();
    expect(inputs).toEqual(["Input0", "Input1"]);
    expect(outputs).toEqual(["Output0", "Output1", "Output10"]);
  });

  it("ignores unrelated labeled nodes (e.g. clk, input)", () => {
    const sim = makeSim(
      [labeledNode("clk"), labeledNode("input"), labeledNode("Output0"), squareWave()],
      { patched: true }
    );
    const { inputs, outputs } = discoverDigitalIO(sim);
    expect(inputs).toEqual([]);
    expect(outputs).toEqual(["Output0"]);
  });

  it("returns null clkElm when no square-wave generator exists", () => {
    const sim = makeSim([labeledNode("Output0")], { patched: true });
    expect(discoverDigitalIO(sim).clkElm).toBeNull();
  });
});

// ─── checkCircuitHealth ───────────────────────────────────────────────────────

describe("checkCircuitHealth", () => {
  it("reports healthy when isCircuitValid() is true", () => {
    const sim = {
      isCircuitValid: () => true,
      getSimulationErrors: () => null,
    };
    expect(checkCircuitHealth(sim)).toEqual({ valid: true, error: null });
  });

  it("surfaces the solver error when the matrix is unstable", () => {
    const sim = {
      isCircuitValid: () => false,
      getSimulationErrors: () => "Singular matrix!",
    };
    expect(checkCircuitHealth(sim)).toEqual({
      valid: false,
      error: "Singular matrix!",
    });
  });

  it("infers validity from getSimulationErrors() alone", () => {
    const withError = { getSimulationErrors: () => "Convergence failed" };
    expect(checkCircuitHealth(withError)).toEqual({
      valid: false,
      error: "Convergence failed",
    });

    const clean = { getSimulationErrors: () => null };
    expect(checkCircuitHealth(clean)).toEqual({ valid: true, error: null });
  });

  it("degrades to healthy on an un-patched runtime (no health API)", () => {
    expect(checkCircuitHealth({})).toEqual({ valid: true, error: null });
  });
});
