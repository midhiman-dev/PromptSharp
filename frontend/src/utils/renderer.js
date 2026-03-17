// Simple DOM renderer utility (lightweight alternative to a full framework)

/**
 * Renders a component to a DOM container
 * @param {HTMLElement|string} component - The HTML element or string to render
 * @param {HTMLElement} container - The container element to render into
 */
export function renderApp(component, container) {
  if (typeof component === 'string') {
    container.innerHTML = component;
  } else if (component instanceof HTMLElement) {
    container.innerHTML = '';
    container.appendChild(component);
  } else {
    console.error('Invalid component type');
  }
}

/**
 * Creates an HTML element from a string
 * @param {string} html - The HTML string
 * @returns {HTMLElement} The created element
 */
export function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export default {
  renderApp,
  createElement
};
