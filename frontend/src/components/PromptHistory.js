// Prompt History & Management Component
import { createElement } from '../utils/renderer.js';
import { getSavedPrompts, searchPrompts, deletePrompt, exportPrompts, toggleFavorite } from '../services/storage.js';

export function initPromptHistory(container) {
  const component = createElement(`
    <section class="panel">
      <div class="section-heading compact">
        <div>
          <span class="section-kicker">Library</span>
          <h2 class="section-title">Saved prompts</h2>
          <p class="section-description">Search, reuse, or export prompts you want to keep.</p>
        </div>
      </div>

      <div class="history-toolbar">
        <input id="search-input" class="app-input" placeholder="Search saved prompts..." />
        <button id="export-button" class="secondary-button">Export JSON</button>
      </div>

      <div id="prompt-list" class="history-list">
        <div class="history-empty">No saved prompts yet.</div>
      </div>
    </section>
  `);

  container.appendChild(component);

  const searchInput = document.getElementById('search-input');
  const exportButton = document.getElementById('export-button');
  const promptList = document.getElementById('prompt-list');

  renderPromptList();

  searchInput.addEventListener('input', () => {
    renderPromptList(searchInput.value);
  });

  exportButton.addEventListener('click', async () => {
    const json = await exportPrompts();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `promptsharp-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.addEventListener('promptoptimized', () => {
    renderPromptList();
  });

  document.addEventListener('promptsaved', () => {
    renderPromptList();
  });

  document.addEventListener('appdatareset', () => {
    searchInput.value = '';
    renderPromptList();
  });

  async function renderPromptList(searchQuery = '') {
    const prompts = await (searchQuery ? searchPrompts(searchQuery) : getSavedPrompts());

    promptList.innerHTML = '';

    if (prompts.length === 0) {
      promptList.innerHTML = '<div class="history-empty">No saved prompts yet.</div>';
      return;
    }

    prompts.forEach((prompt) => {
      const item = document.createElement('div');
      item.className = 'history-item';

      const date = new Date(prompt.timestamp);
      const formattedDate = date.toLocaleDateString();
      const favoriteBadge = prompt.isFavorite
        ? '<span class="mini-chip mini-chip-accent">Starred</span>'
        : '<button type="button" class="favorite-toggle mini-chip mini-chip-muted">Star</button>';
      const guardrailsBadge = prompt.guardrailsActivated
        ? '<span class="mini-chip mini-chip-warning" title="Guardrails were activated">Guardrails</span>'
        : '';

      item.innerHTML = `
        <div class="history-item-row">
          <div class="flex-1">
            <div class="history-item-title">${escapeHTML(prompt.original.substring(0, 72))}${prompt.original.length > 72 ? '...' : ''}</div>
            <div class="history-meta-row">
              <span class="history-date">${formattedDate}</span>
              ${favoriteBadge}
              ${guardrailsBadge}
            </div>
          </div>
          <div class="history-actions">
            <button class="ghost-button use-button" data-id="${prompt.id}">Use</button>
            <button class="ghost-button danger-text delete-button" data-id="${prompt.id}">Delete</button>
          </div>
        </div>
      `;

      const deleteButton = item.querySelector('.delete-button');
      deleteButton.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;

        if (confirm('Are you sure you want to delete this prompt?')) {
          await deletePrompt(parseInt(id, 10));
          renderPromptList(searchQuery);
        }
      });

      const favoriteToggle = item.querySelector('.favorite-toggle');
      if (favoriteToggle) {
        favoriteToggle.addEventListener('click', async (e) => {
          e.stopPropagation();
          await toggleFavorite(parseInt(prompt.id, 10));
          renderPromptList(searchQuery);
        });
      }

      const useButton = item.querySelector('.use-button');
      useButton.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        const savedPrompt = prompts.find((entry) => entry.id === id);

        if (!savedPrompt) {
          return;
        }

        document.getElementById('compare-container')?.classList.remove('hidden');
        document.getElementById('original-prompt').textContent = savedPrompt.original;
        document.getElementById('optimized-prompt').textContent = savedPrompt.optimized;
        document.getElementById('prompt').value = savedPrompt.original;

        const charCount = document.getElementById('char-count');
        const maxChars = 2000;
        charCount.textContent = `${savedPrompt.original.length} / ${maxChars} characters`;

        const optimizeButton = document.getElementById('optimize-button');
        const apiKeyInput = document.getElementById('api-key');
        if (optimizeButton) {
          optimizeButton.disabled = !apiKeyInput?.value;
        }

        document.getElementById('copy-button').disabled = false;
        document.getElementById('save-button').disabled = false;
      });

      promptList.appendChild(item);
    });
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
