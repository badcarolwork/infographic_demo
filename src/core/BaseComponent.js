/**
 * Base class for all infographic custom elements.
 *
 * Subclasses extend BaseComponent, override `render()` to update the shadow DOM
 * from `this.data`, and optionally override `animate()` for GSAP-driven motion.
 *
 * @example
 * class HeroSection extends BaseComponent {
 *   render() {
 *     // read this.data, update this.shadowRoot
 *   }
 *
 *   animate() {
 *     // gsap.from(...) — only in subclasses that need it
 *   }
 * }
 * HeroSection.prototype.animate.cleanup = () => { /* kill tweens *\/ };
 * customElements.define('hero-section', HeroSection);
 */
class BaseComponent extends HTMLElement {
  #data;

  get data() {
    return this.#data;
  }

  set data(value) {
    this.#data = value;
    this.render();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
  }

  disconnectedCallback() {
    this.animate.cleanup?.();
  }

  /**
   * Update shadow DOM from `this.data`. Must be overridden by subclasses.
   * @throws {Error} When the base implementation is invoked directly.
   */
  render() {
    throw new Error(`${this.constructor.name}: render() must be implemented by subclass`);
  }

  /**
   * Optional GSAP entry point. Override in subclasses that need animation.
   * Attach `animate.cleanup` on the subclass for teardown (called on disconnect).
   */
  animate() {}
}

export default BaseComponent;
export { BaseComponent };
