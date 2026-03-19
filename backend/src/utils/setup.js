/**
 * Global setup for Node.js environment
 * Sets up process-wide configuration for better compatibility and security
 */

// Only disable certificate verification when explicitly requested for local troubleshooting.
if (process.env.ALLOW_INSECURE_SSL === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

module.exports = {
  // Add any setup functions or configuration here
  init: () => {
    console.log('Environment setup complete');
  }
};
