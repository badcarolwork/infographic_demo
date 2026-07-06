/**
 * Expected data shape: { meta: { title?: string, subtitle?: string } }
 */
import BaseComponent from "../../../core/BaseComponent.js";
import headerStyles from "./header.scss?inline";

class Header extends BaseComponent {
  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    const root = this.shadowRoot;
    root.replaceChildren();

    const meta = this.data?.meta;
    const title = meta?.title;
    if (!title) {
      return;
    }
    const style = document.createElement("style");
    style.textContent = `
      ${headerStyles}
    `;
    
    root.appendChild(style);
    const header = document.createElement("header");
    const h1 = document.createElement("h1");
    h1.className = "header__title";
    h1.textContent = title;
    header.appendChild(h1);

    const subtitle = meta?.subtitle;
    if (subtitle) {
      const p = document.createElement("p");
      p.textContent = subtitle;
      header.appendChild(p);
    }

    root.appendChild(header);
  }
}

customElements.define("page-header", Header);

export default Header;
