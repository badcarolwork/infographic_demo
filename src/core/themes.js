const DEFAULT_THEME = 'dark-blue';

/** @type {Record<string, Record<string, string>>} */
export const THEMES = {
  'dark-blue': {
    '--theme-font-headline': 'Exo, sans-serif',
    '--theme-font-body': 'Noto Sans, sans-serif',
    '--theme-text-color': '#f0f4f8',
    '--theme-overlay-color': 'rgba(10, 25, 47, 0.75)',
    '--theme-accent-color': '#4da3ff',
    '--theme-text-white': '#ffffff',
  },
  'light-warm': {
    '--theme-font-headline': 'Exo, sans-serif',
    '--theme-font-body': 'Noto Sans, sans-serif',
    '--theme-text-color': '#2c2416',
    '--theme-overlay-color': 'rgba(255, 248, 235, 0.85)',
    '--theme-accent-color': '#c45c26',
    '--theme-text-white': '#ffffff',
  },
  'eco-green': {
    '--theme-font-headline': 'Exo, sans-serif',
    '--theme-font-body': 'Noto Sans, sans-serif',
    '--theme-text-color': '#1f3d2b',
    '--theme-overlay-color': 'rgba(240, 250, 240, 0.85)',
    '--theme-accent-color': '#2e8b57',
    '--theme-text-white': '#ffffff',
  },
};

/**
 * @param {string} name
 * @returns {Record<string, string>}
 */
export function getTheme(name) {
  if (!THEMES[name]) {
    console.warn(`Unknown theme "${name}", falling back to "${DEFAULT_THEME}"`);
  }
  return THEMES[name] ?? THEMES[DEFAULT_THEME];
}
