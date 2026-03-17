// Main App for PromptSharp
import { createElement } from './utils/renderer.js';
import { initPromptInput } from './components/PromptInput.js';
import { initPromptCompare } from './components/PromptCompare.js';
import { initPromptHistory } from './components/PromptHistory.js';
import { initModelSelection } from './components/ModelSelection.js';

export default function App() {
  // Create the app container
  const appElement = createElement(`
    <div class="flex flex-col items-center p-4">
      <div id="model-selection" class="w-full max-w-xl mb-4"></div>
      <div id="prompt-input" class="w-full max-w-xl mb-6"></div>
      <div id="prompt-compare" class="w-full max-w-xl mb-6"></div>
      <div id="prompt-history" class="w-full max-w-xl mb-6"></div>
    </div>
  `);
  
  // Initialize the app when it's mounted
  setTimeout(() => {
    initModelSelection(document.getElementById('model-selection'));
    initPromptInput(document.getElementById('prompt-input'));
    initPromptCompare(document.getElementById('prompt-compare'));
    initPromptHistory(document.getElementById('prompt-history'));
  }, 0);
  
  return appElement;
}
