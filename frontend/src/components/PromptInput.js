// Prompt Input Component
import { createElement } from '../utils/renderer.js';
import { optimizePrompt, configureGuardrails } from '../services/api.js';
import { savePrompt, getApiKey, saveApiKey, clearApiKey, clearAllData } from '../services/storage.js';

window.promptState = window.promptState || {
  original: '',
  optimized: '',
  isLoading: false,
  error: null
};

export function initPromptInput(container) {
  const maxChars = 2000;

  const component = createElement(`
    <section class="panel panel-elevated">
      <div class="section-heading">
        <div>
          <span class="section-kicker">Compose</span>
          <h2 class="section-title">Input prompt</h2>
          <p class="section-description">Paste a rough prompt and refine it into a cleaner, more actionable instruction set.</p>
        </div>
      </div>

      <textarea
        id="prompt"
        class="app-textarea"
        placeholder="Type or paste your prompt here..."
        maxlength="${maxChars}"
      ></textarea>

      <div class="composer-toolbar">
        <span id="char-count" class="muted-meta">0 / ${maxChars} characters</span>
        <button id="optimize-button" class="primary-button" disabled>Optimize prompt</button>
      </div>

      <div class="settings-stack">
        <div id="api-key-section" class="subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Access key</h3>
              <p class="subpanel-description">Your OpenRouter API key stays in local browser storage.</p>
            </div>
            <span class="status-chip">Local only</span>
          </div>

          <label for="api-key" class="field-label">OpenRouter API Key</label>
          <input
            type="password"
            id="api-key"
            class="app-input"
            placeholder="Enter your OpenRouter API key"
          />

          <div class="action-row">
            <button id="clear-api-key-button" type="button" class="secondary-button">Clear key</button>
            <button id="clear-all-button" type="button" class="danger-button">Clear local data</button>
          </div>
        </div>

        <div id="guardrails-settings" class="subpanel subpanel-muted">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Safety checks</h3>
              <p class="subpanel-description">Control which guardrails run before the prompt is returned.</p>
            </div>
            <button id="toggle-guardrails-settings" class="text-button">Show</button>
          </div>

          <div id="guardrails-options" class="guardrails-grid hidden">
            <label class="check-row">
              <input type="checkbox" id="toxicity-check" checked>
              <span>Toxicity screening</span>
            </label>
            <label class="check-row">
              <input type="checkbox" id="pii-protection" checked>
              <span>PII protection</span>
            </label>
            <label class="check-row">
              <input type="checkbox" id="hallucination-detection" checked>
              <span>Hallucination detection</span>
            </label>
            <label class="check-row">
              <input type="checkbox" id="logical-checks" checked>
              <span>Logic checks</span>
            </label>
            <label class="check-row">
              <input type="checkbox" id="strict-mode">
              <span>Strict mode</span>
            </label>
          </div>
        </div>
      </div>

      <div id="error-message" class="status-message hidden"></div>
    </section>
  `);

  container.appendChild(component);

  const promptInput = document.getElementById('prompt');
  const charCount = document.getElementById('char-count');
  const optimizeButton = document.getElementById('optimize-button');
  const errorMessage = document.getElementById('error-message');
  const apiKeyInput = document.getElementById('api-key');
  const clearApiKeyButton = document.getElementById('clear-api-key-button');
  const clearAllButton = document.getElementById('clear-all-button');

  const toggleGuardrailsBtn = document.getElementById('toggle-guardrails-settings');
  const guardrailsOptions = document.getElementById('guardrails-options');
  const toxicityCheck = document.getElementById('toxicity-check');
  const piiProtection = document.getElementById('pii-protection');
  const hallucinationDetection = document.getElementById('hallucination-detection');
  const logicalChecks = document.getElementById('logical-checks');
  const strictMode = document.getElementById('strict-mode');

  toggleGuardrailsBtn.addEventListener('click', () => {
    const isHidden = guardrailsOptions.classList.contains('hidden');
    guardrailsOptions.classList.toggle('hidden', !isHidden);
    toggleGuardrailsBtn.textContent = isHidden ? 'Hide' : 'Show';
  });

  function updateGuardrailsSettings() {
    configureGuardrails({
      enableToxicityChecks: toxicityCheck.checked,
      enablePiiProtection: piiProtection.checked,
      enableHallucinationDetection: hallucinationDetection.checked,
      enableLogicalChecks: logicalChecks.checked,
      strictMode: strictMode.checked
    });
  }

  [toxicityCheck, piiProtection, hallucinationDetection, logicalChecks, strictMode]
    .forEach((checkbox) => {
      checkbox.addEventListener('change', updateGuardrailsSettings);
    });

  updateGuardrailsSettings();

  (async function loadApiKey() {
    const savedApiKey = await getApiKey();
    if (!savedApiKey) {
      return;
    }

    apiKeyInput.value = savedApiKey;
    localStorage.setItem('openrouter_api_key', savedApiKey);
    optimizeButton.disabled = promptInput.value.length === 0;
  })();

  promptInput.addEventListener('input', () => {
    const currentLength = promptInput.value.length;
    charCount.textContent = `${currentLength} / ${maxChars} characters`;
    optimizeButton.disabled = currentLength === 0 || !apiKeyInput.value;
    window.promptState.original = promptInput.value;
  });

  apiKeyInput.addEventListener('input', async () => {
    const apiKey = apiKeyInput.value;
    await saveApiKey(apiKey);
    localStorage.setItem('openrouter_api_key', apiKey);
    optimizeButton.disabled = promptInput.value.length === 0 || !apiKey;
  });

  clearApiKeyButton.addEventListener('click', async () => {
    await clearApiKey();
    apiKeyInput.value = '';
    optimizeButton.disabled = promptInput.value.length === 0 || !apiKeyInput.value;
    showMessage('Saved API key cleared.', 'success');
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

  optimizeButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!prompt) {
      showMessage('Please enter a prompt to optimize.');
      return;
    }

    if (!apiKey) {
      showMessage('Please enter your OpenRouter API key.');
      return;
    }

    try {
      setLoading(true);

      const result = await optimizePrompt(prompt, apiKey);

      window.promptState.original = prompt;
      window.promptState.optimized = result.optimized;
      window.promptState.error = null;

      await savePrompt({
        original: prompt,
        optimized: result.optimized,
        category: 'General',
        guardrailsActivated: result.guardrailsActivated || false
      });

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
      showMessage(error.message || 'Failed to optimize prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  function showMessage(message, type = 'error') {
    errorMessage.textContent = message;
    errorMessage.className = `status-message ${type === 'success' ? 'status-success' : 'status-error'}`;
    errorMessage.classList.remove('hidden');

    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  }

  function setLoading(isLoading) {
    window.promptState.isLoading = isLoading;

    if (isLoading) {
      optimizeButton.disabled = true;
      optimizeButton.textContent = 'Optimizing...';
      return;
    }

    optimizeButton.disabled = promptInput.value.length === 0 || !apiKeyInput.value;
    optimizeButton.textContent = 'Optimize prompt';
  }
}
