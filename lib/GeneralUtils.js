/**
 * GeneralUtils.js
 * Centralized constants and helper functions for the Ohmify platform.
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
   * getTimestepForProblem
   * Returns the ideal simulation Δt based on the physics of the domain.
   * @param {Object} problem - The problem object containing a topic array.
   */
  getTimestepForProblem: (problem) => {
    if (!problem || !problem.topics) return 5e-6; // Default 5 microseconds

    // Power Electronics: 50Hz - 1kHz range, 
    if (problem.topics.includes("Power Electronics")) return 5e-6; 

    // RF/Microwave: Gigahertz range (requires nanosecond precision)
    if (problem.topics.some(t => t.includes("RF") || t.includes("Microwave"))) return 1e-9;

    // Digital logic: Standard 1Mhz sampling
    if (GeneralUtils.isDigitalProblem(problem.topics)) return 1e-6; 

    return 5e-6; 
  },
  
  /**
   * toHex
   * Formats a decimal integer into a standard 0x hex string.
   */
  toHex: (val) => `0x${(val || 0).toString(16).toUpperCase()}`,

};