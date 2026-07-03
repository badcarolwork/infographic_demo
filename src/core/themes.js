const DEFAULT_THEME = 'dark-blue';

/** @type {Record<string, Record<string, string>>} */
export const THEMES = {
  'dark-blue': {
    '--theme-text-color': '#f0f4f8',
    '--theme-overlay-color': 'rgba(10, 25, 47, 0.75)',
    '--theme-accent-color': '#4da3ff',
  },
  'light-warm': {
    '--theme-text-color': '#2c2416',
    '--theme-overlay-color': 'rgba(255, 248, 235, 0.85)',
    '--theme-accent-color': '#c45c26',
  },
};

/**
 * @param {string} name
 * @returns {Record<string, string>}
 */
export function getTheme(name) {
  return THEMES[name] ?? THEMES[DEFAULT_THEME];
}
