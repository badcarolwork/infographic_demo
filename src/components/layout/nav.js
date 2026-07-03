/**
 * Expected data shape: Array<{ label: string, target: string }>
 */
import BaseComponent from '../../core/BaseComponent.js';

class Nav extends BaseComponent {
  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const root = this.shadowRoot;
    root.replaceChildren();

    const nav = document.createElement('nav');
    const items = Array.isArray(this.data) ? this.data : [];

    if (items.length > 0) {
      const ul = document.createElement('ul');

      for (const item of items) {
        if (!item?.label || !item?.target) {
          continue;
        }

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${item.target}`;
        a.textContent = item.label;
        a.addEventListener('click', (event) => {
          event.preventDefault();
          console.log(item.target);
        });
        li.appendChild(a);
        ul.appendChild(li);
      }

      nav.appendChild(ul);
    }

    root.appendChild(nav);
  }
}

customElements.define('page-nav', Nav);

export default Nav;
