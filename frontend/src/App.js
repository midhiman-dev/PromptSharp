// Main App for PromptSharp
import { createElement } from './utils/renderer.js';
import { initPromptInput } from './components/PromptInput.js';
import { initPromptCompare } from './components/PromptCompare.js';
import { initPromptHistory } from './components/PromptHistory.js';
import { initModelSelection } from './components/ModelSelection.js';

export default function App() {
  const appElement = createElement(`
    <div class="app-shell">
      <div class="page-glow page-glow-left"></div>
      <div class="page-glow page-glow-right"></div>

      <header class="hero-panel">
        <div class="hero-copy">
          <span class="eyebrow">Prompt optimization workspace</span>
          <h1 class="hero-title">PromptSharp</h1>
          <p class="hero-subtitle">
            Turn rough prompts into production-ready instructions with a cleaner workflow,
            guided model control, and reusable prompt history.
          </p>
        </div>

        <div class="hero-meta">
          <div class="hero-stat">
            <span class="hero-stat-label">Workflow</span>
            <span class="hero-stat-value">Draft, optimize, compare</span>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-label">Data handling</span>
            <span class="hero-stat-value">Stored locally in your browser</span>
          </div>
        </div>
      </header>

      <main class="workspace-stack">
        <section class="workspace-top">
          <div id="prompt-input" class="panel-fill"></div>
          <div id="model-selection" class="panel-fill"></div>
        </section>

        <section class="workspace-lower">
          <div id="prompt-compare"></div>
          <div id="prompt-history"></div>
        </section>
      </main>
    </div>
  `);

  setTimeout(() => {
    initModelSelection(document.getElementById('model-selection'));
    initPromptInput(document.getElementById('prompt-input'));
    initPromptCompare(document.getElementById('prompt-compare'));
    initPromptHistory(document.getElementById('prompt-history'));
  }, 0);

  return appElement;
}
