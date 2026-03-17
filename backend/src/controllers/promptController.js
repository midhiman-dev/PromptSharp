const promptService = require('../services/promptService');

exports.optimizePrompt = async (req, res, next) => {
  try {
    const { prompt, selectedModel } = req.body;
    
    // Validate input
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt text is required'
      });
    }
    
    if (prompt.length > 2000) {
      return res.status(400).json({
        status: 'error',
        message: 'Prompt exceeds maximum length of 2000 characters'
      });
    }
    
    // Call service to optimize prompt
    const optimizationResult = await promptService.optimize(prompt, selectedModel);
    
    // Return original and optimized prompts
    return res.status(200).json({
      status: 'success',
      data: {
        original: prompt,
        optimized: optimizationResult.optimized,
        model: optimizationResult.model,
        fallbackUsed: optimizationResult.fallbackUsed || false,
        selectedModel: optimizationResult.selectedModel || selectedModel || null,
        selectedModelFailure: optimizationResult.selectedModelFailure || null
      }
    });
    
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
};
