/**
 * Expected data shape: Array<{ label: string, target: string }>
 */
import BaseComponent from '../../../core/BaseComponent.js';
import navStyles from './nav.scss?inline';

class Nav extends BaseComponent {
  /** @type {HTMLElement | null} */
  #panel = null;

  /** @type {HTMLButtonElement | null} */
  #toggle = null;

  /** @type {HTMLElement | null} */
  #mobileOverlay = null;

  /** @type {HTMLUListElement | null} */
  #mobileOverlayList = null;

  /** @type {((event: KeyboardEvent) => void) | null} */
  #onKeyDown = null;

  constructor() {
    super();
    this.animate.cleanup = () => this.#closeMenu();
  }

  disconnectedCallback() {
    this.#mobileOverlay?.remove();
    this.#mobileOverlay = null;
    this.#mobileOverlayList = null;
  }

  #setMenuOpen(open) {
    if (!this.#toggle) {
      return;
    }

    this.#toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.#mobileOverlay?.classList.toggle('nav-mobile-overlay--open', open);
    this.#mobileOverlay?.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('nav-menu-open', open);
  }

  #openMenu() {
    this.#setMenuOpen(true);
  }

  #closeMenu() {
    this.#setMenuOpen(false);
  }

  #bindMenuEvents() {
    this.#onKeyDown = (event) => {
      if (event.key === 'Escape') {
        this.#closeMenu();
      }
    };

    this.#toggle?.addEventListener('click', () => this.#openMenu());
    document.addEventListener('keydown', this.#onKeyDown);
  }

  #createNavLink(item) {
    const a = document.createElement('a');
    a.href = `#${item.target}`;
    a.textContent = item.label;
    a.addEventListener('click', (event) => {
      event.preventDefault();
      this.#closeMenu();
      const target = document.getElementById(item.target);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return a;
  }

  #ensureMobileOverlay() {
    if (this.#mobileOverlay) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'nav-mobile-overlay';
    overlay.id = 'nav-mobile-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nav-mobile-overlay__close';
    close.setAttribute('aria-label', 'Close menu');
    close.textContent = '×';
    close.addEventListener('click', () => this.#closeMenu());
    overlay.appendChild(close);

    const ul = document.createElement('ul');
    overlay.appendChild(ul);

    document.body.appendChild(overlay);
    this.#mobileOverlay = overlay;
    this.#mobileOverlayList = ul;
  }

  #populateMobileOverlay(items) {
    this.#ensureMobileOverlay();
    if (!this.#mobileOverlayList) {
      return;
    }

    this.#mobileOverlayList.replaceChildren();

    for (const item of items) {
      if (!item?.label || !item?.target) {
        continue;
      }

      const li = document.createElement('li');
      li.appendChild(this.#createNavLink(item));
      this.#mobileOverlayList.appendChild(li);
    }
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#closeMenu();
    if (this.#onKeyDown) {
      document.removeEventListener('keydown', this.#onKeyDown);
      this.#onKeyDown = null;
    }

    const root = this.shadowRoot;
    root.replaceChildren();

    const style = document.createElement('style');
    style.textContent = navStyles;
    root.appendChild(style);

    const nav = document.createElement('nav');
    nav.className = 'nav';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav__toggle';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'nav-mobile-overlay');
    this.#toggle = toggle;

    const panel = document.createElement('div');
    panel.className = 'nav__panel';
    panel.id = 'nav-panel';
    this.#panel = panel;

    const items = Array.isArray(this.data) ? this.data : [];

    if (items.length > 0) {
      const ul = document.createElement('ul');

      for (const item of items) {
        if (!item?.label || !item?.target) {
          continue;
        }

        const li = document.createElement('li');
        li.appendChild(this.#createNavLink(item));
        ul.appendChild(li);
      }

      panel.appendChild(ul);
      this.#populateMobileOverlay(items);
    }

    nav.appendChild(toggle);
    nav.appendChild(panel);
    root.appendChild(nav);

    this.#bindMenuEvents();
  }
}

customElements.define('page-nav', Nav);

export default Nav;
