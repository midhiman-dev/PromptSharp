const axios = require('axios');
const https = require('https');

// OpenRouter API integration
const openRouterAPI = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://promptsharp.ai',
    'X-Title': 'PromptSharp'
  },
  // Disable SSL verification temporarily to resolve certificate issues
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// Model configuration
const PRIMARY_MODEL = 'mistralai/mistral-small-3.2-24b-instruct:free';
const FALLBACK_MODELS = [
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash'
];

/**
 * Optimize a prompt using the OpenRouter API
 * @param {string} prompt - The original prompt to optimize
 * @returns {Promise<string>} - The optimized prompt
 */
exports.optimize = async (prompt, selectedModel = null) => {
  try {
    // Create system prompt for optimization
    const systemPrompt = `You are an expert prompt engineer. Your task is to transform the user's prompt into a well-structured, 
    clear, and effective prompt that will produce optimal results from AI systems. 
    Analyze the provided prompt, identify any issues or ambiguities, and restructure it to be more specific, 
    concise, and aligned with best practices in prompt engineering. 
    Focus on clarity, specificity, and appropriate context. 
    Return ONLY the optimized prompt without any explanations or additional text.`;
    
    const candidateModels = selectedModel
      ? [selectedModel, PRIMARY_MODEL, ...FALLBACK_MODELS].filter((model, index, models) => model && models.indexOf(model) === index)
      : [PRIMARY_MODEL, ...FALLBACK_MODELS];
    let lastError;
    let selectedModelFailure = null;

    for (const model of candidateModels) {
      try {
        console.log(`Attempting to optimize with model: ${model}`);
        const response = await openRouterAPI.post('/chat/completions', {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1
        });

        console.log(`Model response received successfully from ${model}`);
        return {
          optimized: response.data.choices[0].message.content.trim(),
          model,
          fallbackUsed: Boolean(selectedModel && model !== selectedModel),
          selectedModel,
          selectedModelFailure
        };
      } catch (modelError) {
        lastError = modelError;
        if (selectedModel && model === selectedModel) {
          selectedModelFailure = modelError.response?.data?.error?.message || modelError.message;
        }
        console.error(`Model ${model} failed:`, modelError.message);
        console.error('Error details:', JSON.stringify(modelError.response?.data || {}, null, 2));
      }
    }

    throw lastError;
  } catch (error) {
    // Handle specific API errors
    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage = error.response.data.error?.message || 'Unknown API error';
      
      console.error(`API Error (${statusCode}): ${errorMessage}`);
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
      
      const apiError = new Error(`API Error (${statusCode}): ${errorMessage}`);
      apiError.statusCode = statusCode;
      throw apiError;
    }
    
    // Handle network errors
    if (error.request) {
      console.error('Network error details:', error.message);
      const networkError = new Error('Network error, unable to reach API service');
      networkError.statusCode = 503;
      throw networkError;
    }
    
    // Handle other errors
    console.error('General error:', error.message);
      const modelContext = selectedModel || 'configured models';
      const generalError = new Error(`Failed to optimize prompt with ${modelContext}: ${error.message}`);
      generalError.statusCode = 500;
      throw generalError;
  }
};
