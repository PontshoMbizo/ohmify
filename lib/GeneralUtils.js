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
   * toHex
   * Formats a decimal integer into a standard 0x hex string.
   */
  toHex: (val) => `0x${(val || 0).toString(16).toUpperCase()}`,

  /**
   * Converts linear magnitude to decibels (dB) and formats for Chart.js.
   * Formula: 20 * log10(val)
   * A floor of -100dB is applied to prevent Math.log10(0) from returning -Infinity.
   */
  formatSpectrumData : (labels, dataArr) => {
    if (!labels || !dataArr) return [];
    
    return dataArr.map((val, i) => {
      const xVal = parseFloat(labels[i]);
      
      // Calculate dB with a safe floor
      let yValdB = -100; 
      if (val > 0) {
        yValdB = 20 * Math.log10(val);
        if (yValdB < -100) yValdB = -100;
      }

      return { x: xVal, y: yValdB };
    }).filter(p => p.x > 0); // Keep X positive for log/linear consistency
  },
};