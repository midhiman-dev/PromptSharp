const express = require('express');
const router = express.Router();
const promptController = require('../controllers/promptController');

// Prompt optimization endpoint
router.post('/optimize', promptController.optimizePrompt);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is operational' });
});

module.exports = router;
