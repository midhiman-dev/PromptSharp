// ModelSelection.js - Searchable component for selecting OpenRouter models
import { createElement } from '../utils/renderer.js';
import { getSelectedModel, saveSelectedModel } from '../services/storage.js';
import { getAvailableModels } from '../services/api.js';

export async function initModelSelection(container) {
  const PRIMARY_MODEL = 'mistralai/mistral-small-3.2-24b-instruct:free';
  const FALLBACK_MODEL = 'google/gemini-2.5-flash-lite';

  const component = createElement(`
    <section class="panel">
      <div class="section-heading compact">
        <div>
          <span class="section-kicker">Routing</span>
          <h2 class="section-title">Model selection</h2>
          <p class="section-description">Choose the model used for prompt refinement.</p>
        </div>
        <button id="refresh-models" class="text-button">Refresh</button>
      </div>

      <div class="model-search-wrap">
        <input
          id="model-search"
          type="text"
          autocomplete="off"
          placeholder="Search models by name or provider"
          class="app-input"
        />
        <div id="model-results" class="hidden model-results"></div>
        <p class="field-help">Type to filter models. Free models are ranked before paid options.</p>
      </div>

      <div id="selected-model-summary" class="selection-summary"></div>

      <div id="model-info" class="model-info-card hidden">
        <div>
          <span id="model-description"></span>
          <div class="model-info-meta">
            <span><strong>Context:</strong> <span id="model-context"></span> tokens</span>
            <span><strong>Updated:</strong> <span id="model-updated"></span></span>
          </div>
        </div>
      </div>
    </section>
  `);

  container.appendChild(component);

  const modelSearch = document.getElementById('model-search');
  const modelResults = document.getElementById('model-results');
  const refreshButton = document.getElementById('refresh-models');
  const selectedModelSummary = document.getElementById('selected-model-summary');
  const modelInfo = document.getElementById('model-info');
  const modelDescription = document.getElementById('model-description');
  const modelContext = document.getElementById('model-context');
  const modelUpdated = document.getElementById('model-updated');

  let allModels = [
    {
      id: PRIMARY_MODEL,
      name: 'Mistral Small 3.2 24B',
      description: 'Balanced default model for prompt optimization.',
      context_length: 'Unknown',
      updated: null,
      isFree: true
    },
    {
      id: FALLBACK_MODEL,
      name: 'Gemini 2.5 Flash Lite',
      description: 'Fast backup model when routing needs an alternative.',
      context_length: 'Unknown',
      updated: null,
      isFree: true
    }
  ];
  let selectedModelId = await getSelectedModel() || PRIMARY_MODEL;

  function getProvider(model) {
    return model.id.includes('/') ? model.id.split('/')[0] : 'other';
  }

  function normalizeModel(model) {
    return {
      ...model,
      name: model.name || model.id,
      isFree: model.id === 'openrouter/free' ||
        model.id.endsWith(':free') ||
        (model.name || '').toLowerCase().includes('(free)')
    };
  }

  function formatModelLabel(model) {
    return `${model.name || model.id} · ${getProvider(model)}`;
  }

  function sortModels(models, query = '') {
    const normalizedQuery = query.trim().toLowerCase();

    return [...models].sort((a, b) => {
      const aSearch = `${a.name} ${a.id}`.toLowerCase();
      const bSearch = `${b.name} ${b.id}`.toLowerCase();
      const aStarts = normalizedQuery ? aSearch.startsWith(normalizedQuery) : false;
      const bStarts = normalizedQuery ? bSearch.startsWith(normalizedQuery) : false;
      const aIncludes = normalizedQuery ? aSearch.includes(normalizedQuery) : false;
      const bIncludes = normalizedQuery ? bSearch.includes(normalizedQuery) : false;

      if (aStarts !== bStarts) {
        return aStarts ? -1 : 1;
      }

      if (aIncludes !== bIncludes) {
        return aIncludes ? -1 : 1;
      }

      if (a.isFree !== b.isFree) {
        return a.isFree ? -1 : 1;
      }

      const providerComparison = getProvider(a).localeCompare(getProvider(b));
      if (providerComparison !== 0) {
        return providerComparison;
      }

      return (a.name || a.id).localeCompare(b.name || b.id);
    });
  }

  function updateSelectedModel(model) {
    selectedModelId = model.id;
    modelSearch.value = formatModelLabel(model);
    selectedModelSummary.innerHTML = `
      <span class="mini-chip ${model.isFree ? 'mini-chip-accent' : 'mini-chip-warning'}">${model.isFree ? 'Free tier' : 'Paid tier'}</span>
      <span class="selection-summary-text">Active model: ${model.name || model.id}</span>
    `;

    if (model.description || model.context_length || model.updated) {
      modelDescription.textContent = model.description || 'No description available';
      modelContext.textContent = model.context_length || 'Unknown';
      modelUpdated.textContent = model.updated ? new Date(model.updated * 1000).toLocaleDateString() : 'Unknown';
      modelInfo.classList.remove('hidden');
      return;
    }

    modelInfo.classList.add('hidden');
  }

  function renderResults(query = '') {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredModels = sortModels(
      allModels.filter((model) => {
        if (!normalizedQuery) {
          return true;
        }

        return `${model.name} ${model.id}`.toLowerCase().includes(normalizedQuery);
      }),
      query
    );

    if (filteredModels.length === 0) {
      modelResults.innerHTML = '<div class="model-empty">No models match your search.</div>';
      modelResults.classList.remove('hidden');
      return;
    }

    modelResults.innerHTML = filteredModels
      .slice(0, 50)
      .map((model) => `
        <button
          type="button"
          data-model-id="${model.id}"
          class="model-result-item ${model.id === selectedModelId ? 'model-result-selected' : ''}"
        >
          <span>
            <span class="block text-sm font-medium text-slate-950">${model.name || model.id}</span>
            <span class="block text-xs text-slate-500">${model.id}</span>
          </span>
          <span class="${model.isFree ? 'mini-chip mini-chip-accent' : 'mini-chip mini-chip-warning'}">
            ${model.isFree ? 'Free' : 'Paid'}
          </span>
        </button>
      `)
      .join('');

    modelResults.classList.remove('hidden');

    modelResults.querySelectorAll('[data-model-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        const model = allModels.find((item) => item.id === button.dataset.modelId);
        if (!model) {
          return;
        }

        await saveSelectedModel(model.id);
        updateSelectedModel(model);
        modelResults.classList.add('hidden');
      });
    });
  }

  async function loadModels(forceRefresh = false) {
    try {
      modelSearch.value = 'Loading models...';
      const models = await getAvailableModels(forceRefresh);

      if (models && models.length > 0) {
        const uniqueModels = new Map();
        [...allModels, ...models].forEach((model) => {
          const normalizedModel = normalizeModel(model);
          uniqueModels.set(normalizedModel.id, normalizedModel);
        });
        allModels = Array.from(uniqueModels.values());
      }

      const selectedModel = allModels.find((model) => model.id === selectedModelId) ||
        allModels.find((model) => model.id === PRIMARY_MODEL) ||
        allModels[0];

      if (selectedModel) {
        updateSelectedModel(selectedModel);
      }

      renderResults(modelSearch.value === 'Loading models...' ? '' : modelSearch.value);
      modelResults.classList.add('hidden');
    } catch (error) {
      console.error('Error loading models:', error);
      const selectedModel = allModels.find((model) => model.id === selectedModelId) || allModels[0];
      if (selectedModel) {
        updateSelectedModel(selectedModel);
      }
    }
  }

  modelSearch.addEventListener('focus', () => {
    modelSearch.select();
    renderResults('');
  });

  modelSearch.addEventListener('input', () => {
    renderResults(modelSearch.value);
  });

  modelSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      modelResults.classList.add('hidden');
      const selectedModel = allModels.find((model) => model.id === selectedModelId);
      if (selectedModel) {
        modelSearch.value = formatModelLabel(selectedModel);
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (!component.contains(event.target)) {
      modelResults.classList.add('hidden');
      const selectedModel = allModels.find((model) => model.id === selectedModelId);
      if (selectedModel) {
        modelSearch.value = formatModelLabel(selectedModel);
      }
    }
  });

  refreshButton.addEventListener('click', () => {
    loadModels(true);
  });

  document.addEventListener('appdatareset', async () => {
    selectedModelId = PRIMARY_MODEL;
    await saveSelectedModel(PRIMARY_MODEL);
    const selectedModel = allModels.find((model) => model.id === PRIMARY_MODEL) || allModels[0];
    if (selectedModel) {
      updateSelectedModel(selectedModel);
    }
    modelResults.classList.add('hidden');
  });

  await loadModels();

  return component;
}
