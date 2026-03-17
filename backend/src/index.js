// Environment variables configuration
require('dotenv').config();

// Global setup (handles SSL certificate issues)
require('./utils/setup').init();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting - 10 requests per minute as specified in PRD
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window per IP
  standardHeaders: true,
  message: {
    status: 429,
    message: 'Too many requests, please try again after a minute'
  }
});

// Apply rate limiting to all routes
app.use(limiter);

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
