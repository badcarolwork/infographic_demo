/**
 * Expected data shape: { meta: { title?: string } }
 * Copyright year is derived at render time via Date, not from data.
 */
import BaseComponent from '../../core/BaseComponent.js';

class Footer extends BaseComponent {
  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const root = this.shadowRoot;
    root.replaceChildren();

    const title = this.data?.meta?.title ?? '';
    const year = new Date().getFullYear();

    const footer = document.createElement('footer');
    const p = document.createElement('p');
    p.textContent = `© ${year} ${title}`.trim();
    footer.appendChild(p);

    root.appendChild(footer);
  }
}

customElements.define('page-footer', Footer);

export default Footer;
