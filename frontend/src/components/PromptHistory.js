// Prompt History & Management Component
import { createElement } from '../utils/renderer.js';
import { getSavedPrompts, searchPrompts, deletePrompt, exportPrompts, toggleFavorite } from '../services/storage.js';

export function initPromptHistory(container) {
  // Create the component
  const component = createElement(`
    <div>
      <h2 class="font-semibold mb-3 text-gray-700">Saved Prompts</h2>
      <div class="mb-3 flex gap-2">
        <input id="search-input" class="flex-1 p-2 border rounded" placeholder="Search saved prompts..." />
        <button id="export-button" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Export (JSON)</button>
      </div>
      <div id="prompt-list" class="bg-white rounded shadow divide-y max-h-[300px] overflow-y-auto">
        <div class="p-3 text-gray-500">No saved prompts yet.</div>
      </div>
    </div>
  `);
  
  container.appendChild(component);
  
  // Get DOM elements
  const searchInput = document.getElementById('search-input');
  const exportButton = document.getElementById('export-button');
  const promptList = document.getElementById('prompt-list');
  
  // Initialize prompts
  renderPromptList();
  
  // Listen for search input
  searchInput.addEventListener('input', () => {
    renderPromptList(searchInput.value);
  });
  
  // Listen for export button click
  exportButton.addEventListener('click', async () => {
    const json = await exportPrompts();
    
    // Create downloadable file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptsharp-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // Listen for prompt optimization/save events
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
  
  // Render the list of saved prompts
  async function renderPromptList(searchQuery = '') {
    const prompts = await (searchQuery ? searchPrompts(searchQuery) : getSavedPrompts());
    
    // Clear the list
    promptList.innerHTML = '';
    
    if (prompts.length === 0) {
      promptList.innerHTML = '<div class="p-3 text-gray-500">No saved prompts yet.</div>';
      return;
    }
    
    // Render each prompt
    prompts.forEach(prompt => {
      const item = document.createElement('div');
      item.className = 'p-3 hover:bg-gray-50';
      
      // Format the date
      const date = new Date(prompt.timestamp);
      const formattedDate = date.toLocaleDateString();
      
      // Add favorite icon
      const favoriteIcon = prompt.isFavorite 
        ? `<span class="text-yellow-500 mr-1">★</span>` 
        : `<span class="text-gray-300 mr-1 hover:text-yellow-500 cursor-pointer favorite-toggle">☆</span>`;
      
      // Add guardrails icon if activated
      const guardrailsIcon = prompt.guardrailsActivated 
        ? `<span class="text-amber-500 ml-1" title="Guardrails were activated">⚠️</span>` 
        : '';
      
      item.innerHTML = `
        <div class="flex justify-between">
          <div class="flex-1">
            <div class="font-medium truncate text-black">${favoriteIcon}${escapeHTML(prompt.original.substring(0, 50))}${prompt.original.length > 50 ? '...' : ''} ${guardrailsIcon}</div>
            <div class="text-sm text-gray-500">${formattedDate}</div>
          </div>
          <div class="flex gap-2">
            <button class="use-button text-blue-600 hover:underline" data-id="${prompt.id}">Use</button>
            <button class="delete-button text-red-500 hover:underline" data-id="${prompt.id}">Delete</button>
          </div>
        </div>
      `;
      
      // Add click event for the delete button
      const deleteButton = item.querySelector('.delete-button');
      deleteButton.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        
        if (confirm('Are you sure you want to delete this prompt?')) {
          await deletePrompt(parseInt(id));
          renderPromptList(searchQuery);
        }
      });
      
      // Add click event for the favorite toggle
      const favoriteToggle = item.querySelector('.favorite-toggle');
      if (favoriteToggle) {
        favoriteToggle.addEventListener('click', async (e) => {
          e.stopPropagation();
          await toggleFavorite(parseInt(prompt.id));
          renderPromptList(searchQuery);
        });
      }
      
      // Add click event for the use button
      const useButton = item.querySelector('.use-button');
      useButton.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        
        // Get prompt directly from the current list to avoid another DB lookup
        const savedPrompt = prompts.find(p => p.id === id);
        
        if (savedPrompt) {
          // Update the display
          document.getElementById('original-prompt').textContent = savedPrompt.original;
          document.getElementById('optimized-prompt').textContent = savedPrompt.optimized;
          document.getElementById('prompt').value = savedPrompt.original;
          
          // Update char count
          const charCount = document.getElementById('char-count');
          const maxChars = 2000;
          charCount.textContent = `${savedPrompt.original.length} / ${maxChars} characters`;
          
          // Enable buttons
          document.getElementById('copy-button').disabled = false;
          document.getElementById('save-button').disabled = false;
        }
      });
      
      promptList.appendChild(item);
    });
  }
  
  // Helper function to escape HTML
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
