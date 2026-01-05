export const GeneralUtils = {

// Problem Types

PROBLEM_TYPES : [
  "Power Electronics",
  "wave shaping",
  "Digital Systems",
  "Signal Processing",
  "Control Systems",
  "LF analog",
  "Analog-Digital",
  "RF Electronics",
  "Microwave Devices",
  "Optoelectronics",
  "Combinational CCT",
  "Sequential CCT"
],

//Digital Topics
  digitalTopics : [
    "Digital Systems",
    "Combinational CCT",
    "Sequential CCT",
    "Analog-Digital"
  ],

  // Helper to determine if the problem requires bit-vector logic
  isDigitalProblem : (topics) => {
    return topics.some(t => GeneralUtils.digitalTopics.includes(t));
  },

    getTimestepForProblem : (problem) => {
    if (problem.topic.includes("Power Electronics")) return 1e-3; 
    if (problem.topic.some(t => t.includes("RF") || t.includes("Microwave"))) return 1e-9;
    if (GeneralUtils.isDigitalProblem(problem.topic)) return 1e-6; // Standard 1Mhz logic speed
    return 5e-6; 
  },
  
    // to Hex conversion
    toHex : (val) => `0x${(val || 0).toString(16).toUpperCase()}`,

};