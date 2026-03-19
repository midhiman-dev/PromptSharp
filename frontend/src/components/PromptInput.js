// Prompt Input Component
import { createElement } from '../utils/renderer.js';
import { optimizePrompt, configureGuardrails } from '../services/api.js';
import { savePrompt, getApiKey, saveApiKey, clearApiKey, clearAllData } from '../services/storage.js';

// Global state for the prompt application
window.promptState = window.promptState || {
  original: '',
  optimized: '',
  isLoading: false,
  error: null
};

export function initPromptInput(container) {
  const maxChars = 2000;
  
  // Create the component
  const component = createElement(`
    <div>
      <label for="prompt" class="font-semibold mb-3 text-gray-700">Enter your prompt</label>
      <textarea
        id="prompt"
        class="w-full h-32 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        placeholder="Type or paste your prompt here (up to 2000 characters)..."
        maxlength="${maxChars}"
      ></textarea>
      <div class="flex justify-between items-center mt-2 text-sm text-black">
        <span id="char-count">0 / ${maxChars} characters</span>
        <div>
          <button id="optimize-button" class="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700" disabled>
            <span class="flex items-center">
              <span class="mr-1">✨</span>
              Improve with AI
            </span>
          </button>
        </div>
      </div>
      <div id="api-key-section" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <label for="api-key" class="block text-sm font-medium mb-1">OpenRouter API Key</label>
        <input 
          type="password" 
          id="api-key" 
          class="w-full p-2 border rounded text-black" 
          placeholder="Enter your OpenRouter API key"
        />
        <p class="text-xs text-black mt-1">Your API key is stored locally and never sent to our servers.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button id="clear-api-key-button" type="button" class="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700">
            Clear API Key
          </button>
          <button id="clear-all-button" type="button" class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
            Clear All Data
          </button>
        </div>
      </div>
      <div id="guardrails-settings" class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-black">Guardrails Settings</label>
          <button id="toggle-guardrails-settings" class="text-xs text-blue-600 hover:underline">Show</button>
        </div>
        <div id="guardrails-options" class="mt-2 hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label class="flex items-center">
              <input type="checkbox" id="toxicity-check" class="mr-2" checked>
              <span class="text-sm text-black">Toxicity Checks</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="pii-protection" class="mr-2" checked>
              <span class="text-sm text-black">PII Protection</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="hallucination-detection" class="mr-2" checked>
              <span class="text-sm text-black">Hallucination Detection</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="logical-checks" class="mr-2" checked>
              <span class="text-sm text-black">Logical Contradiction Checks</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="strict-mode" class="mr-2">
              <span class="text-sm text-black">Strict Mode</span>
            </label>
          </div>
        </div>
      </div>
      <div id="error-message" class="text-red-500 mt-2 hidden"></div>
    </div>
  `);
  
  container.appendChild(component);
  
  // Get DOM elements
  const promptInput = document.getElementById('prompt');
  const charCount = document.getElementById('char-count');
  const optimizeButton = document.getElementById('optimize-button');
  const errorMessage = document.getElementById('error-message');
  const apiKeyInput = document.getElementById('api-key');
  const clearApiKeyButton = document.getElementById('clear-api-key-button');
  const clearAllButton = document.getElementById('clear-all-button');
  
  // Guardrails settings elements
  const toggleGuardrailsBtn = document.getElementById('toggle-guardrails-settings');
  const guardrailsOptions = document.getElementById('guardrails-options');
  const toxicityCheck = document.getElementById('toxicity-check');
  const piiProtection = document.getElementById('pii-protection');
  const hallucinationDetection = document.getElementById('hallucination-detection');
  const logicalChecks = document.getElementById('logical-checks');
  const strictMode = document.getElementById('strict-mode');
  
  // Toggle guardrails settings
  toggleGuardrailsBtn.addEventListener('click', () => {
    const isHidden = guardrailsOptions.classList.contains('hidden');
    if (isHidden) {
      guardrailsOptions.classList.remove('hidden');
      toggleGuardrailsBtn.textContent = 'Hide';
    } else {
      guardrailsOptions.classList.add('hidden');
      toggleGuardrailsBtn.textContent = 'Show';
    }
  });
  
  // Update guardrails settings
  function updateGuardrailsSettings() {
    configureGuardrails({
      enableToxicityChecks: toxicityCheck.checked,
      enablePiiProtection: piiProtection.checked,
      enableHallucinationDetection: hallucinationDetection.checked,
      enableLogicalChecks: logicalChecks.checked,
      strictMode: strictMode.checked
    });
  }
  
  // Add event listeners for guardrails settings
  [toxicityCheck, piiProtection, hallucinationDetection, logicalChecks, strictMode]
    .forEach(checkbox => {
      checkbox.addEventListener('change', updateGuardrailsSettings);
    });
  
  // Initialize guardrails settings
  updateGuardrailsSettings();
  
  // Load saved API key
  (async function loadApiKey() {
    const savedApiKey = await getApiKey();
    if (savedApiKey) {
      apiKeyInput.value = savedApiKey;
      
      // Also store in localStorage for OpenRouter API functions
      localStorage.setItem('openrouter_api_key', savedApiKey);
      
      optimizeButton.disabled = promptInput.value.length === 0;
    }
  })();
  
  // Update char count on input
  promptInput.addEventListener('input', () => {
    const currentLength = promptInput.value.length;
    charCount.textContent = `${currentLength} / ${maxChars} characters`;
    
    // Enable/disable optimize button
    optimizeButton.disabled = currentLength === 0 || !apiKeyInput.value;
    
    // Update global state
    window.promptState.original = promptInput.value;
  });
  
  // Update API key
  apiKeyInput.addEventListener('input', async () => {
    const apiKey = apiKeyInput.value;
    await saveApiKey(apiKey);
    
    // Also store in localStorage for OpenRouter API functions
    localStorage.setItem('openrouter_api_key', apiKey);
    
    optimizeButton.disabled = promptInput.value.length === 0 || !apiKey;
  });

  clearApiKeyButton.addEventListener('click', async () => {
    await clearApiKey();
    apiKeyInput.value = '';
    optimizeButton.disabled = promptInput.value.length === 0 || !apiKeyInput.value;
    showError('Saved API key cleared.');
    document.dispatchEvent(new CustomEvent('apikeycleared'));
  });

  clearAllButton.addEventListener('click', async () => {
    if (!window.confirm('Clear API key, saved prompts, and all local data for this page?')) {
      return;
    }

    await clearAllData();
    apiKeyInput.value = '';
    promptInput.value = '';
    charCount.textContent = `0 / ${maxChars} characters`;
    optimizeButton.disabled = true;
    errorMessage.classList.add('hidden');

    window.promptState.original = '';
    window.promptState.optimized = '';
    window.promptState.error = null;

    document.dispatchEvent(new CustomEvent('appdatareset'));
  });
  
  // Handle optimize button click
  optimizeButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    if (!prompt) {
      showError('Please enter a prompt to optimize');
      return;
    }
    
    if (!apiKey) {
      showError('Please enter your OpenRouter API key');
      return;
    }
    
    try {
      // Show loading state
      setLoading(true);
      
      // Call API to optimize prompt
      const result = await optimizePrompt(prompt, apiKey);
      
      // Update global state
      window.promptState.original = prompt;
      window.promptState.optimized = result.optimized;
      window.promptState.error = null;
      
      // Save to history automatically
      await savePrompt({
        original: prompt,
        optimized: result.optimized,
        category: 'General',
        guardrailsActivated: result.guardrailsActivated || false
      });
      
      // Trigger a custom event to notify other components
      document.dispatchEvent(new CustomEvent('promptoptimized', { 
        detail: { 
          original: prompt, 
          optimized: result.optimized,
          model: result.model,
          fallbackUsed: result.fallbackUsed || false,
          selectedModel: result.selectedModel || null,
          selectedModelFailure: result.selectedModelFailure || null,
          issues: result.issues || [],
          guardrailsActivated: result.guardrailsActivated || false
        }
      }));
      
    } catch (error) {
      showError(error.message || 'Failed to optimize prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  });
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Hide error after 5 seconds
    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  }
  
  function setLoading(isLoading) {
    window.promptState.isLoading = isLoading;
    
    if (isLoading) {
      optimizeButton.disabled = true;
      optimizeButton.textContent = 'Optimizing...';
    } else {
      optimizeButton.disabled = promptInput.value.length === 0 || !apiKeyInput.value;
      optimizeButton.textContent = 'Optimize';
    }
  }
}
