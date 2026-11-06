/**
 * GeneralUtils.js
 * Centralized constants and helper functions for the Scope.io platform.
 */

export const GeneralUtils = {

  // Comprehensive list of all supported engineering domains
  PROBLEM_TYPES: [
    "Power Electronics",
    "wave shaping",
    "Digital Systems",
    "Signal Processing",
    "Control Systems",
    "Analog-Digital",
    "RF Electronics",
    "Microwave Devices",
    "Optoelectronics",
    "Combinational CCT",
    "Sequential CCT"
  ],

  // Specific topics that trigger the Digital Discovery engine
  digitalTopics: [
    "Digital Systems",
    "Combinational CCT",
    "Sequential CCT"
  ],

  /**
   * isDigitalProblem
   * Determines if the problem requires bit-vector logic and clock-edge sampling.
   * @param {Array} topics - The topics assigned to a specific problem.
   */
  isDigitalProblem: (topics) => {
    if (!topics || !Array.isArray(topics)) return false;
    return topics.some(t => GeneralUtils.digitalTopics.includes(t));
  },

  /**
   * requiredTests
   * The golden-capture keys a given validation strategy needs. Signal grades a
   * single waveform; load/digital grade three.
   */
  requiredTests: (testType) =>
    testType === "signal" ? ["test1"] : ["test1", "test2", "test3"],

  /**
   * toHex
   * Formats a decimal integer into a standard 0x hex string.
   */
  toHex: (val) => `0x${(val || 0).toString(16).toUpperCase()}`,

  /**
   * Helper to convert linear magnitude to dB
   * Includes a floor of -100dB to prevent math errors with zero values
   */
  toDB : (val) => {
    if (val <= 0) return -100; 
    const db = 20 * Math.log10(val);
    return db < -100 ? -100 : db;
  },

  /**
   * Updated helper to handle dB conversion for Spectrum
   */
  formatSpectrumData : (labels, dataArr) => {
    if (!labels || !dataArr) return [];
    return dataArr
      .map((val, i) => ({ 
        x: parseFloat(labels[i]), 
        y: GeneralUtils.toDB(val) // Convert Y values to dB
      }))
      .filter((p) => p.x > 0); 
  },
};