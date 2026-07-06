import gsap from 'gsap';
import BaseComponent from '../../../core/BaseComponent.js';
import footerStyles from './footer.scss?inline';
import fontAwesomeUrl from '@fortawesome/fontawesome-free/css/all.min.css?url';

/**
 * @param {unknown} data
 * @returns {Record<string, unknown>}
 */
function resolveFooter(data) {
  if (data && typeof data === 'object' && data.footer && typeof data.footer === 'object') {
    return data.footer;
  }
  return {};
}

/**
 * @param {HTMLElement[]} icons
 */
function runIconAnimation(icons) {
  if (!icons.length) {
    return;
  }

  gsap.fromTo(
    icons,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.12,
      clearProps: 'transform',
    },
  );
}

class Footer extends BaseComponent {
  /** @type {IntersectionObserver | null} */
  #viewportObserver = null;

  /** @type {boolean} */
  #hasAnimated = false;

  /** @type {HTMLElement[]} */
  #animatedIcons = [];

  constructor() {
    super();
    this.animate.cleanup = () => this.#cleanupAnimation();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#mountViewportObserver();
  }

  #cleanupAnimation() {
    this.#viewportObserver?.disconnect();
    this.#viewportObserver = null;

    if (this.#animatedIcons.length) {
      gsap.killTweensOf(this.#animatedIcons);
    }

    this.#animatedIcons = [];
    this.#hasAnimated = false;
  }

  #mountViewportObserver() {
    this.#viewportObserver?.disconnect();

    const footer = this.shadowRoot?.querySelector('.footer');
    if (!footer || !this.#animatedIcons.length) {
      return;
    }

    this.#viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.#hasAnimated) {
            this.#hasAnimated = true;
            runIconAnimation(this.#animatedIcons);
            this.#viewportObserver?.disconnect();
            this.#viewportObserver = null;
          }
        }
      },
      { threshold: 0.2 },
    );

    this.#viewportObserver.observe(footer);
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#cleanupAnimation();

    const root = this.shadowRoot;
    root.replaceChildren();

    // Font Awesome CSS must be present inside the shadow root too —
    // a global <link> in index.html won't apply its rules across the
    // shadow boundary, even though the @font-face itself is global.
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = fontAwesomeUrl;
    root.appendChild(faLink);

    const style = document.createElement('style');
    style.textContent = `${footerStyles}`;
    root.appendChild(style);

    const footerData = resolveFooter(this.data);

    const footer = document.createElement('footer');
    footer.className = 'footer';

    const media = footerData.media;
    if (media && typeof media === 'object' && media.src) {
      const mediaEl = document.createElement('img');
      mediaEl.className = 'footer__media';
      mediaEl.src = String(media.src);
      mediaEl.alt = String(media.alt ?? '');
      footer.appendChild(mediaEl);

      const overlay = document.createElement('div');
      overlay.className = 'footer__overlay';
      footer.appendChild(overlay);
    }

    const inner = document.createElement('div');
    inner.className = 'footer__inner';

    // ---- social icons ----
    const social = footerData.social;
    this.#animatedIcons = [];

    if (social && typeof social === 'object') {
      const socialRow = document.createElement('div');
      socialRow.className = 'footer__social';

      for (const key of Object.keys(social)) {
        const entry = social[key];
        if (!entry?.link || !entry?.icon) {
          continue;
        }

        const a = document.createElement('a');
        a.className = 'footer__social-link';
        a.href = String(entry.link);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', String(entry.label ?? key));

        const icon = document.createElement('i');
        icon.className = String(entry.icon);
        icon.setAttribute('aria-hidden', 'true');
        a.appendChild(icon);

        socialRow.appendChild(a);
        this.#animatedIcons.push(a);
      }

      inner.appendChild(socialRow);
    }

    if (this.#animatedIcons.length) {
      gsap.set(this.#animatedIcons, { opacity: 0, y: 20 });
    }

    // ---- divider ----
    const divider = document.createElement('hr');
    divider.className = 'footer__divider';
    inner.appendChild(divider);

    // ---- bottom: copyright text + legal links ----
    const bottom = document.createElement('div');
    bottom.className = 'footer__bottom';

    const copyright = document.createElement('p');
    copyright.className = 'footer__copyright';
    copyright.textContent = String(footerData.text ?? '');
    bottom.appendChild(copyright);

    const links = Array.isArray(footerData.links) ? footerData.links : [];
    if (links.length > 0) {
      const legal = document.createElement('ul');
      legal.className = 'footer__legal';

      for (const link of links) {
        if (!link?.label || !link?.url) {
          continue;
        }
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = String(link.url);
        a.textContent = String(link.label);
        li.appendChild(a);
        legal.appendChild(li);
      }
      bottom.appendChild(legal);
    }

    inner.appendChild(bottom);
    footer.appendChild(inner);
    root.appendChild(footer);

    if (this.isConnected) {
      this.#mountViewportObserver();
    }
  }

  animate() {
    if (this.isConnected && this.#animatedIcons.length) {
      runIconAnimation(this.#animatedIcons);
    }
  }
}

customElements.define('page-footer', Footer);

export default Footer;