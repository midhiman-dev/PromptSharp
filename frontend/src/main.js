import './styles/tailwind.css';
import './styles/styles.css';
import App from './App.js';
import { renderApp } from './utils/renderer.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  renderApp(App(), appContainer);
});