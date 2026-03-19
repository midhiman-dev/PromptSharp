// ModelSelection.js - Searchable component for selecting OpenRouter models
import { createElement } from '../utils/renderer.js';
import { getSelectedModel, saveSelectedModel } from '../services/storage.js';
import { getAvailableModels } from '../services/api.js';

export async function initModelSelection(container) {
  const PRIMARY_MODEL = 'mistralai/mistral-small-3.2-24b-instruct:free';
  const FALLBACK_MODEL = 'google/gemini-2.5-flash-lite';

  const component = createElement(`
    <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
      <div class="flex items-center justify-between">
        <label for="model-search" class="block text-sm font-medium text-gray-700">AI Model Selection</label>
        <button id="refresh-models" class="text-xs text-blue-600 hover:underline">Refresh</button>
      </div>
      <div class="mt-2 relative">
        <input
          id="model-search"
          type="text"
          autocomplete="off"
          placeholder="Search models by name or provider"
          class="w-full p-2 border rounded text-black"
        />
        <div
          id="model-results"
          class="hidden absolute z-20 mt-2 w-full max-h-72 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg"
        ></div>
        <p class="text-xs text-gray-500 mt-1">Type to filter models. Free models are ranked first, then paid models.</p>
      </div>
      <div id="selected-model-summary" class="mt-2 text-sm text-gray-700"></div>
      <div id="model-info" class="text-xs text-gray-700 mt-2 hidden">
        <div class="bg-blue-50 p-2 rounded">
          <span id="model-description"></span>
          <div class="mt-1">
            <span class="font-medium">Context:</span> <span id="model-context"></span> tokens |
            <span class="font-medium">Updated:</span> <span id="model-updated"></span>
          </div>
        </div>
      </div>
    </div>
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
      description: 'Default free model for prompt optimization.',
      context_length: 'Unknown',
      updated: null,
      isFree: true
    },
    {
      id: FALLBACK_MODEL,
      name: 'Gemini 2.5 Flash Lite',
      description: 'Fallback free model for prompt optimization.',
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
    const provider = getProvider(model);
    const tier = model.isFree ? 'Free' : 'Paid';
    return `${provider}: ${model.name || model.id} (${tier})`;
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
    selectedModelSummary.textContent = `Selected: ${formatModelLabel(model)}`;

    if (model.description || model.context_length || model.updated) {
      modelDescription.textContent = model.description || 'No description available';
      modelContext.textContent = model.context_length || 'Unknown';
      modelUpdated.textContent = model.updated ? new Date(model.updated * 1000).toLocaleDateString() : 'Unknown';
      modelInfo.classList.remove('hidden');
    } else {
      modelInfo.classList.add('hidden');
    }
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
      modelResults.innerHTML = `
        <div class="px-3 py-2 text-sm text-gray-500">No models match your search.</div>
      `;
      modelResults.classList.remove('hidden');
      return;
    }

    modelResults.innerHTML = filteredModels
      .slice(0, 50)
      .map((model) => {
        const isSelected = model.id === selectedModelId;
        const tierClass = model.isFree
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800';

        return `
          <button
            type="button"
            data-model-id="${model.id}"
            class="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}"
          >
            <span>
              <span class="block text-sm font-medium text-gray-900">${model.name || model.id}</span>
              <span class="block text-xs text-gray-500">${model.id}</span>
            </span>
            <span class="shrink-0 rounded-full px-2 py-1 text-xs font-medium ${tierClass}">
              ${model.isFree ? 'Free' : 'Paid'}
            </span>
          </button>
        `;
      })
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
