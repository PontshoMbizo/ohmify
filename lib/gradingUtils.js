export const gradingUtils = {
  /**
   * Calculates RMSE between two signals.
   * Lower is better. 0 is a perfect match.
   */
  calculateRMSE: (user, expected) => {
    if (!user || !expected || user.length === 0) return Infinity;
    
    const n = Math.min(user.length, expected.length);
    let sumSquaredError = 0;

    for (let i = 0; i < n; i++) {
      const error = user[i] - expected[i];
      sumSquaredError += error * error;
    }

    return Math.sqrt(sumSquaredError / n);
  },

  /**
   * Determines if a submission passes based on category-specific thresholds.
   */
  getVerdict: (rmse, category = "analog") => {
    // Thresholds: These can be adjusted per problem
    const thresholds = {
      power: 0.5,   // Power electronics can be slightly noisier due to ripple
      analog: 0.1,  // Precision analog needs tighter matching
      audio: 0.2    // Filters
    };

    const threshold = thresholds[category] || 0.2;
    const score = Math.max(0, 100 - (rmse * 100)); // Simple 0-100 score
    
    return {
      passed: rmse < threshold,
      score: score.toFixed(2),
      message: rmse < threshold ? "Solution Accepted" : "Solution Incorrect"
    };
  }
};