import typographyStyles from '../styles/_typography.scss?inline';

/** @type {CSSStyleSheet | null} */
let typographySheet = null;

/** @type {WeakSet<ShadowRoot>} */
const adoptedRoots = new WeakSet();

/**
 * @returns {CSSStyleSheet}
 */
function getTypographySheet() {
  if (!typographySheet) {
    typographySheet = new CSSStyleSheet();
    typographySheet.replaceSync(typographyStyles);
  }
  return typographySheet;
}

/**
 * @param {ShadowRoot | null | undefined} shadowRoot
 */
export function adoptThemeTypography(shadowRoot) {
  if (!shadowRoot || adoptedRoots.has(shadowRoot)) {
    return;
  }

  shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, getTypographySheet()];
  adoptedRoots.add(shadowRoot);
}
