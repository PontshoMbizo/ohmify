import { describe, it, expect } from "vitest";
import { patchTimeStep } from "../lib/netlistUtils.js";

describe("patchTimeStep", () => {
  it("rewrites the time step token of the $ header", () => {
    const netlist = "$ 1 0.001 10 50 5.0\nr 1 2 0 0 100";
    const out = patchTimeStep(netlist, 5e-6);
    expect(out.split("\n")[0]).toBe("$ 1 0.000005 10 50 5.0");
  });

  it("preserves the flags and trailing options on the header", () => {
    const out = patchTimeStep("$ 64 0.001 19 5 50 5e-11", 5e-6);
    const tokens = out.split("\n")[0].split(" ");
    expect(tokens[1]).toBe("64");           // flags untouched
    expect(tokens[2]).toBe("0.000005");     // time step replaced
    expect(tokens.slice(3)).toEqual(["19", "5", "50", "5e-11"]);
  });

  it("leaves component lines untouched", () => {
    const netlist = "$ 1 0.001 10 50 5.0\nr 96 96 208 96 0 100\nw 1 2 0";
    const out = patchTimeStep(netlist, 1e-7).split("\n");
    expect(out[1]).toBe("r 96 96 208 96 0 100");
    expect(out[2]).toBe("w 1 2 0");
  });

  it("accepts a numeric string for the step", () => {
    const out = patchTimeStep("$ 1 0.001 10 50 5.0", "5e-6");
    expect(out.split(" ")[2]).toBe("0.000005");
  });

  it("tolerates leading blank lines before the header", () => {
    const out = patchTimeStep("\n$ 1 0.001 10 50 5.0\nr 1 2 0 0 100", 2e-6);
    expect(out.split("\n")[1]).toBe("$ 1 0.000002 10 50 5.0");
  });

  it("returns the netlist unchanged when there is no $ header", () => {
    const netlist = "r 1 2 0 0 100\nw 1 2 0";
    expect(patchTimeStep(netlist, 5e-6)).toBe(netlist);
  });

  it("returns the netlist unchanged for an invalid or missing step", () => {
    const netlist = "$ 1 0.001 10 50 5.0";
    expect(patchTimeStep(netlist, undefined)).toBe(netlist);
    expect(patchTimeStep(netlist, 0)).toBe(netlist);
    expect(patchTimeStep(netlist, -1)).toBe(netlist);
    expect(patchTimeStep(netlist, "abc")).toBe(netlist);
  });

  it("returns the netlist unchanged for a malformed (too short) header", () => {
    const netlist = "$ 1";
    expect(patchTimeStep(netlist, 5e-6)).toBe(netlist);
  });

  it("is a no-op for non-string input", () => {
    expect(patchTimeStep(null, 5e-6)).toBe(null);
    expect(patchTimeStep(undefined, 5e-6)).toBe(undefined);
  });
});
