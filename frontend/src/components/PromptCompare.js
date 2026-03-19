// Side-by-Side Comparison Component
import { createElement } from '../utils/renderer.js';
import { savePrompt } from '../services/storage.js';

export function initPromptCompare(container) {
  const component = createElement(`
    <div class="hidden" id="compare-container">
      <h2 class="font-semibold mb-3 text-gray-700">Comparison</h2>
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 bg-white p-3 rounded shadow">
          <h3 class="font-semibold mb-2 text-gray-700">Original Prompt</h3>
          <pre id="original-prompt" class="whitespace-pre-wrap text-gray-800 min-h-[100px] max-h-[300px] overflow-y-auto">Your original prompt will appear here.</pre>
        </div>
        <div class="flex-1 bg-blue-50 p-3 rounded shadow">
          <h3 class="font-semibold mb-2 text-blue-700">Optimized Prompt</h3>
          <pre id="optimized-prompt" class="whitespace-pre-wrap text-gray-900 min-h-[100px] max-h-[300px] overflow-y-auto">Your optimized prompt will appear here.</pre>
          <div id="model-info" class="text-xs text-gray-500 mt-1 flex items-center">
            <span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs mr-2">
              <span class="h-2 w-2 bg-blue-500 rounded-full mr-1"></span>
              <span id="model-name">Model</span>
            </span>
            <span id="model-provider" class="text-gray-500"></span>
          </div>
          <div id="guardrails-warning" class="hidden mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-950"></div>
          <div class="mt-3 flex gap-2">
            <button id="copy-button" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" disabled>Copy</button>
            <button id="save-button" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700" disabled>Save</button>
          </div>
        </div>
      </div>
    </div>
    <style>
      .hallucination {
        background-color: rgba(255, 240, 128, 0.3);
        border-bottom: 1px dashed orange;
        position: relative;
        cursor: help;
      }
      .redacted {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        padding: 0 2px;
        color: #666;
        font-style: italic;
      }
      #guardrails-details {
        margin-top: 8px;
      }
      .guardrail-issue {
        margin-bottom: 4px;
        padding: 4px;
        border-radius: 4px;
        color: #1f2937;
      }
      .guardrail-issue.toxicity {
        background-color: rgba(248, 113, 113, 0.2);
      }
      .guardrail-issue.pii {
        background-color: rgba(96, 165, 250, 0.2);
      }
      .guardrail-issue.hallucination {
        background-color: rgba(251, 191, 36, 0.2);
      }
      .guardrail-issue.logical_contradiction {
        background-color: rgba(167, 139, 250, 0.2);
      }
    </style>
  `);

  container.appendChild(component);

  const compareContainer = document.getElementById('compare-container');
  const originalPrompt = document.getElementById('original-prompt');
  const optimizedPrompt = document.getElementById('optimized-prompt');
  const modelInfo = document.getElementById('model-info');
  const modelName = document.getElementById('model-name');
  const modelProvider = document.getElementById('model-provider');
  const guardrailsWarning = document.getElementById('guardrails-warning');
  const copyButton = document.getElementById('copy-button');
  const saveButton = document.getElementById('save-button');

  document.addEventListener('promptoptimized', (event) => {
    const {
      original,
      optimized,
      model,
      issues,
      guardrailsActivated,
      fallbackUsed,
      selectedModel,
      selectedModelFailure
    } = event.detail;

    compareContainer.classList.remove('hidden');
    originalPrompt.textContent = original;

    if (optimized.includes('<span class="hallucination"') || optimized.includes('<span class="redacted"')) {
      optimizedPrompt.innerHTML = optimized;
    } else {
      optimizedPrompt.textContent = optimized;
    }

    if (model) {
      const modelParts = model.split('/');
      if (modelParts.length > 1) {
        const providerName = modelParts[0];
        let displayName = modelParts[1].replace(':free', '');

        displayName = displayName
          .replace('-instruct', '')
          .replace('-exp', '')
          .replace('mistral-small-3.2-24b', 'Mistral Small')
          .replace('gemini-2.0-flash', 'Gemini Flash');

        modelName.textContent = displayName;
        modelProvider.textContent = providerName;
        modelInfo.classList.remove('hidden');
      } else {
        modelName.textContent = model.replace(':free', '');
        modelProvider.textContent = '';
        modelInfo.classList.remove('hidden');
      }
    } else {
      modelInfo.classList.add('hidden');
    }

    const notices = [];
    if (fallbackUsed && selectedModel && model && model !== selectedModel) {
      notices.push(`Selected model ${selectedModel} failed${selectedModelFailure ? `: ${selectedModelFailure}` : '.'} PromptSharp used fallback model ${model}.`);
    }

    if (notices.length > 0 || (guardrailsActivated && issues && issues.length > 0)) {
      displayGuardrailsWarning(issues || [], notices);
    } else {
      guardrailsWarning.classList.add('hidden');
    }

    copyButton.disabled = false;
    saveButton.disabled = false;
  });

  document.addEventListener('appdatareset', () => {
    compareContainer.classList.add('hidden');
    originalPrompt.textContent = 'Your original prompt will appear here.';
    optimizedPrompt.textContent = 'Your optimized prompt will appear here.';
    guardrailsWarning.classList.add('hidden');
    modelInfo.classList.add('hidden');
    copyButton.disabled = true;
    saveButton.disabled = true;
  });

  function displayGuardrailsWarning(issues, notices = []) {
    guardrailsWarning.classList.remove('hidden');

    let warningHTML = notices
      .map((notice) => `<div class="font-medium text-amber-800">Model fallback used</div><div class="text-xs mb-2 text-gray-900">${notice}</div>`)
      .join('');

    if (issues.length > 0) {
      warningHTML += `<div class="font-medium text-yellow-900">Guardrails activated</div>`;
    }

    warningHTML += `<div id="guardrails-details">`;

    issues.forEach((issue) => {
      const severity = issue.severity === 'high'
        ? 'text-red-600'
        : issue.severity === 'medium'
          ? 'text-amber-600'
          : 'text-blue-600';

      let detailsHTML = `<div class="text-xs text-gray-900">${issue.details}</div>`;

      if (issue.type === 'toxicity' && issue.indicators) {
        const indicators = issue.indicators;

        if (indicators.toxicCategories && Object.keys(indicators.toxicCategories).length > 0) {
          detailsHTML += `<div class="text-xs mt-1 text-gray-900">Detected categories: ${Object.keys(indicators.toxicCategories).join(', ')}</div>`;
        }

        if (indicators.harmfulIntent) {
          detailsHTML += `<div class="text-xs mt-1 text-gray-900">Harmful intent detected</div>`;
        }

        if (indicators.targetedNegative) {
          detailsHTML += `<div class="text-xs mt-1 text-gray-900">Targeted negative content detected</div>`;
        }
      }

      warningHTML += `
        <div class="guardrail-issue ${issue.type}">
          <div class="${severity} font-medium">${capitalizeFirstLetter(issue.type)}</div>
          ${detailsHTML}
        </div>
      `;
    });

    warningHTML += `</div>`;
    guardrailsWarning.innerHTML = warningHTML;
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).replace('_', ' ');
  }

  copyButton.addEventListener('click', () => {
    const text = optimizedPrompt.textContent || optimizedPrompt.innerText;

    if (text && text !== 'Your optimized prompt will appear here.') {
      navigator.clipboard.writeText(text)
        .then(() => {
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    }
  });

  saveButton.addEventListener('click', async () => {
    const original = originalPrompt.textContent;
    const optimized = optimizedPrompt.textContent || optimizedPrompt.innerText;

    if (original && optimized && original !== 'Your original prompt will appear here.') {
      await savePrompt({
        original,
        optimized,
        category: 'Favorite',
        isFavorite: true
      });

      document.dispatchEvent(new CustomEvent('promptsaved'));

      const originalText = saveButton.textContent;
      saveButton.textContent = 'Saved!';
      setTimeout(() => {
        saveButton.textContent = originalText;
      }, 2000);
    }
  });
}
