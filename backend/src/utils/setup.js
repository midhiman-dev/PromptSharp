/**
 * Global setup for Node.js environment
 * Sets up process-wide configuration for better compatibility and security
 */

// This can be used to safely disable certificate verification in development environments
// For production, you should properly configure certificates instead
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = {
  // Add any setup functions or configuration here
  init: () => {
    console.log('Environment setup complete');
  }
};
