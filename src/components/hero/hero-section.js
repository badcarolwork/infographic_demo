/**
 * Expected data shape:
 * {
 *   title?: string,
 *   subtitle?: string,
 *   theme?: string,
 *   backgroundAsset?: string,
 *   media?: { type: 'image' | 'video', src: string, alt?: string }
 * }
 */
import gsap from 'gsap';
import BaseComponent from '../../core/BaseComponent.js';
import { getTheme } from '../../core/themes.js';
import heroStyles from './hero.scss?inline';


/**
 * @param {Record<string, unknown> | undefined} data
 * @returns {{ type: 'image' | 'video', src: string, alt: string } | null}
 */
function resolveMedia(data) {
  const media = data?.media;
  if (media && typeof media === 'object' && media.type && media.src) {
    return {
      type: media.type === 'video' ? 'video' : 'image',
      src: String(media.src),
      alt: String(media.alt ?? data?.title ?? ''),
    };
  }

  const backgroundAsset = data?.backgroundAsset;
  if (typeof backgroundAsset === 'string' && backgroundAsset) {
    const type = /\.(mp4|webm|ogg)(\?.*)?$/i.test(backgroundAsset) ? 'video' : 'image';
    return {
      type,
      src: backgroundAsset,
      alt: String(data?.title ?? ''),
    };
  }

  return null;
}

/**
 * @param {Record<string, string>} theme
 * @returns {string}
 */
function buildThemeVariables(theme) {
  return Object.entries(theme)
    .map(([name, value]) => `${name}: ${value};`)
    .join('\n    ');
}

/**
 * @param {HTMLElement} container
 * @param {{ type: 'image' | 'video', src: string, alt: string }} source
 */
function renderBackgroundMedia(container, source) {
  if (source.type === 'video') {
    const video = document.createElement('video');
    video.className = 'hero__media';
    video.src = source.src;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    container.appendChild(video);
    return;
  }

  const img = document.createElement('img');
  img.className = 'hero__media';
  img.src = source.src;
  img.alt = source.alt;
  container.appendChild(img);
}

/**
 * @param {HTMLElement[]} targets
 */
function runHeroTextAnimation(targets) {
  if (!targets.length) {
    return;
  }

  gsap.from(targets, {
    opacity: 0,
    y: 30,
    duration: 0.7,
    ease: 'power2.out',
  });
}

class HeroSection extends BaseComponent {
  /** @type {IntersectionObserver | null} */
  #viewportObserver = null;

  /** @type {boolean} */
  #hasAnimated = false;

  /** @type {HTMLElement[]} */
  #animatedElements = [];

  constructor() {
    super();
    this.animate.cleanup = () => this.#cleanupAnimation();
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this.#mountViewportObserver();
  }

  #cleanupAnimation() {
    this.#viewportObserver?.disconnect();
    this.#viewportObserver = null;

    if (this.#animatedElements.length) {
      gsap.killTweensOf(this.#animatedElements);
    }

    this.#animatedElements = [];
    this.#hasAnimated = false;
  }

  #mountViewportObserver() {
    this.#viewportObserver?.disconnect();

    const content = this.shadowRoot?.querySelector('.hero__content');
    if (!content) {
      return;
    }

    this.#viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.#hasAnimated) {
            this.#hasAnimated = true;
            runHeroTextAnimation(this.#animatedElements);
            this.#viewportObserver?.disconnect();
            this.#viewportObserver = null;
          }
        }
      },
      { threshold: 0.2 },
    );

    this.#viewportObserver.observe(content);
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#cleanupAnimation();

    const root = this.shadowRoot;
    root.replaceChildren();

    const theme = getTheme(typeof this.data?.theme === 'string' ? this.data.theme : '');
    const style = document.createElement('style');
    style.textContent = `
      :host {
        ${buildThemeVariables(theme)}
      }
      ${heroStyles}
    `;
    root.appendChild(style);

    const section = document.createElement('section');
    section.className = 'hero';

    const media = resolveMedia(this.data);
    if (media) {
      renderBackgroundMedia(section, media);
    }

    const overlay = document.createElement('div');
    overlay.className = 'hero__overlay';
    overlay.setAttribute('aria-hidden', 'true');
    section.appendChild(overlay);

    const content = document.createElement('div');
    content.className = 'hero__content';

    const title = this.data?.title;
    if (title) {
      const h1 = document.createElement('h1');
      h1.className = 'hero__title';
      h1.textContent = title;
      content.appendChild(h1);
      this.#animatedElements.push(h1);
    }

    const subtitle = this.data?.subtitle;
    if (subtitle) {
      const p = document.createElement('p');
      p.className = 'hero__subtitle';
      p.textContent = subtitle;
      content.appendChild(p);
      this.#animatedElements.push(p);
    }

    section.appendChild(content);
    root.appendChild(section);

    if (this.isConnected) {
      this.#mountViewportObserver();
    }
  }

  animate() {
    if (this.isConnected && this.#animatedElements.length) {
      runHeroTextAnimation(this.#animatedElements);
    }
  }
}

customElements.define('hero-section', HeroSection);

export default HeroSection;
