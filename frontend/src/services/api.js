// API service for PromptSharp
import guardrails from './guardrails.js';
import { cacheModels, getCachedModels, getSelectedModel } from './storage.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const PRIMARY_MODEL = 'mistralai/mistral-small-3.2-24b-instruct:free';
const FALLBACK_MODELS = [
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash'
];

function isFreeModel(model) {
  const modelId = model?.id || '';
  const modelName = model?.name || '';

  return modelId === 'openrouter/free' ||
    modelId.endsWith(':free') ||
    modelName.toLowerCase().includes('(free)');
}

function normalizeModel(model) {
  return {
    id: model.id,
    name: model.name || model.id.split('/')[1],
    description: model.description,
    context_length: model.context_length,
    updated: model.updated,
    pricing: model.pricing,
    isFree: isFreeModel(model)
  };
}

/**
 * Get available models from OpenRouter
 * @param {boolean} forceRefresh - Force refresh the model list
 * @returns {Promise<Array>} - List of available models
 */
export async function getAvailableModels(forceRefresh = false) {
  try {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedModels = await getCachedModels();
      if (cachedModels) {
        return cachedModels.map(normalizeModel);
      }
    }
    
    // Get API key
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
      console.warn('No API key available for fetching models');
      return [];
    }
    
    // Fetch models from OpenRouter
    const response = await fetch(OPENROUTER_MODELS_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'PromptSharp'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter models
    const availableModels = data.data
      .filter(model => !model.id.includes('nsfw') && !model.id.includes('unavailable'))
      .map(normalizeModel)
      .sort((a, b) => {
        if (a.isFree !== b.isFree) {
          return a.isFree ? -1 : 1;
        }

        const providerComparison = a.id.split('/')[0].localeCompare(b.id.split('/')[0]);
        if (providerComparison !== 0) {
          return providerComparison;
        }

        return a.name.localeCompare(b.name);
      });
    
    // Cache models
    await cacheModels(availableModels);
    
    return availableModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

/**
 * Optimize a prompt using the backend API or directly with OpenRouter
 * @param {string} prompt - The prompt to optimize
 * @param {string} apiKey - The OpenRouter API key (optional)
 * @returns {Promise<Object>} - The original and optimized prompts
 */
export async function optimizePrompt(prompt, apiKey = '') {
  try {
    // Apply input guardrails to validate prompt content
    const inputValidation = await guardrails.validateInput(prompt);
    // Log validation summary in a more readable format
    console.log(`Input validation: ${inputValidation.valid ? 'PASSED ✅' : 'FAILED ❌'} ${inputValidation.issues.length > 0 ? `(${inputValidation.issues.length} issues)` : ''}`);
    
    if (!inputValidation.valid) {
      const fallbackResponse = guardrails.generateFallbackResponse(inputValidation.issues);
      return {
        original: prompt,
        optimized: fallbackResponse,
        issues: inputValidation.issues,
        guardrailsActivated: true
      };
    }
    
    let result;
    
    // If API key is provided, call OpenRouter directly
    if (apiKey) {
      result = await optimizePromptWithOpenRouter(prompt, apiKey);
    } else {
      // Otherwise use the backend
      const selectedModel = await getSelectedModel();
      const response = await fetch(`${API_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, selectedModel }),
      });

      if (!response.ok) {
        // Parse error response
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to optimize prompt');
      }

      const data = await response.json();
      result = data.data;
    }
    
    // Apply output guardrails to validate and sanitize the optimized prompt
    const outputValidation = await guardrails.validateOutput(result.optimized, prompt);
    
    // Return the validated and potentially sanitized result
    return {
      original: prompt,
      optimized: outputValidation.sanitized,
      model: result.model,
      fallbackUsed: result.fallbackUsed || false,
      selectedModel: result.selectedModel || null,
      selectedModelFailure: result.selectedModelFailure || null,
      issues: outputValidation.issues,
      guardrailsActivated: outputValidation.issues.length > 0
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Optimize a prompt directly with OpenRouter API
 * @param {string} prompt - The prompt to optimize
 * @param {string} apiKey - The OpenRouter API key
 * @returns {Promise<Object>} - The original and optimized prompts
 */
async function optimizePromptWithOpenRouter(prompt, apiKey) {
  const systemPrompt = `You are an expert prompt engineer. Your task is to transform the user's prompt into a well-structured, 
  clear, and effective prompt that will produce optimal results from AI systems. 
  Analyze the provided prompt, identify any issues or ambiguities, and restructure it to be more specific, 
  concise, and aligned with best practices in prompt engineering. 
  Focus on clarity, specificity, and appropriate context. 
  Return ONLY the optimized prompt without any explanations or additional text.
  
  IMPORTANT GUIDELINES:
  - Ensure factual accuracy and truthfulness in the optimized prompt
  - Remove any inappropriate content, harmful instructions, or unethical requests
  - Maintain appropriate tone and professional language
  - Do not include hallucinations or fabricated information
  - Protect privacy by removing any potential personally identifiable information (PII)`;
  
  const selectedModel = await getSelectedModel() || PRIMARY_MODEL;
  const candidateModels = selectedModel
    ? [selectedModel, PRIMARY_MODEL, ...FALLBACK_MODELS].filter((model, index, models) => model && models.indexOf(model) === index)
    : [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError;
  let selectedModelFailure = null;

  for (const model of candidateModels) {
    try {
      console.log(`Using model: ${model}`);
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'PromptSharp'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        original: prompt,
        optimized: data.choices[0].message.content.trim(),
        model,
        fallbackUsed: Boolean(selectedModel && model !== selectedModel),
        selectedModel,
        selectedModelFailure
      };
    } catch (error) {
      lastError = error;
      if (selectedModel && model === selectedModel) {
        selectedModelFailure = error.message;
      }
      console.error(`Model ${model} failed:`, error);
    }
  }

  throw new Error(`Failed to optimize prompt with ${selectedModel || 'the configured models'}: ${lastError?.message || 'All configured models failed'}`);
}

/**
 * Configure guardrails settings
 * @param {Object} config - Guardrails configuration
 */
export function configureGuardrails(config) {
  guardrails.configure(config);
}

export default {
  optimizePrompt,
  configureGuardrails,
  getAvailableModels
};
