/**
 * Expected data shape:
 * Array<{ id, label, title, description, asset?, media? }>
 * or { items?: array, timeline?: array, theme?: string }
 */
import gsap from 'gsap';
import BaseComponent from '../../core/BaseComponent.js';
import { getTheme } from '../../core/themes.js';
import timelineStyles from './timeline.scss?inline';

/**
 * @param {unknown} data
 * @returns {object[]}
 */
function resolveItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data.timeline)) {
      return data.timeline;
    }
  }

  return [];
}

/**
 * @param {unknown} data
 * @returns {string}
 */
function resolveThemeName(data) {
  if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.theme === 'string') {
    return data.theme;
  }
  return '';
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
 * @param {Record<string, unknown> | undefined} item
 * @returns {{ type: 'image' | 'video', src: string, alt: string, poster?: string } | null}
 */
function resolveItemMedia(item) {
  const media = item?.media;
  if (media && typeof media === 'object' && media.type && media.src) {
    return {
      type: media.type === 'video' ? 'video' : 'image',
      src: String(media.src),
      alt: String(media.alt ?? item?.title ?? ''),
      poster: typeof media.poster === 'string' ? media.poster : undefined,
    };
  }

  const asset = item?.asset;
  if (typeof asset === 'string' && asset) {
    return {
      type: 'image',
      src: asset,
      alt: String(item?.title ?? ''),
    };
  }

  return null;
}

/**
 * @param {HTMLElement} container
 * @param {{ type: 'image' | 'video', src: string, alt: string, poster?: string }} source
 */
function renderItemMedia(container, source) {
  if (source.type === 'video') {
    const video = document.createElement('video');
    video.className = 'timeline__media-el';
    video.src = source.src;
    if (source.poster) {
      video.poster = source.poster;
    }
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('aria-label', source.alt);
    container.appendChild(video);
    return;
  }

  const img = document.createElement('img');
  img.className = 'timeline__media-el';
  img.src = source.src;
  img.alt = source.alt;
  container.appendChild(img);
}

/**
 * @param {HTMLElement} list
 * @param {object[]} items
 * @returns {HTMLElement[]}
 */
function renderTimelineItems(list, items) {
  const animatedItems = [];

  for (const item of items) {
    if (!item?.id || !item?.label || !item?.title || !item?.description) {
      continue;
    }

    const li = document.createElement('li');
    li.className = 'timeline__item';
    li.id = String(item.id);

    const marker = document.createElement('div');
    marker.className = 'timeline__marker';
    const step = document.createElement('span');
    step.className = 'timeline__step';
    step.textContent = String(item.label);
    marker.appendChild(step);
    li.appendChild(marker);

    const body = document.createElement('div');
    body.className = 'timeline__body';

    const title = document.createElement('h2');
    title.className = 'timeline__title';
    title.textContent = String(item.title);
    body.appendChild(title);

    const description = document.createElement('p');
    description.className = 'timeline__description';
    description.textContent = String(item.description);
    body.appendChild(description);

    const media = resolveItemMedia(item);
    if (media) {
      const figure = document.createElement('figure');
      figure.className = 'timeline__media';
      renderItemMedia(figure, media);
      body.appendChild(figure);
    }

    li.appendChild(body);
    list.appendChild(li);
    animatedItems.push(li);
  }

  return animatedItems;
}

/**
 * @param {HTMLElement[]} items
 */
function runTimelineAnimation(items) {
  if (!items.length) {
    return;
  }

  gsap.from(items, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.15,
  });
}

class TimelineSection extends BaseComponent {
  /** @type {IntersectionObserver | null} */
  #viewportObserver = null;

  /** @type {boolean} */
  #hasAnimated = false;

  /** @type {HTMLElement[]} */
  #animatedItems = [];

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

    if (this.#animatedItems.length) {
      gsap.killTweensOf(this.#animatedItems);
    }

    this.#animatedItems = [];
    this.#hasAnimated = false;
  }

  #mountViewportObserver() {
    this.#viewportObserver?.disconnect();

    const section = this.shadowRoot?.querySelector('.timeline');
    if (!section || !this.#animatedItems.length) {
      return;
    }

    this.#viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.#hasAnimated) {
            this.#hasAnimated = true;
            runTimelineAnimation(this.#animatedItems);
            this.#viewportObserver?.disconnect();
            this.#viewportObserver = null;
          }
        }
      },
      { threshold: 0.15 },
    );

    this.#viewportObserver.observe(section);
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#cleanupAnimation();

    const root = this.shadowRoot;
    root.replaceChildren();

    const theme = getTheme(resolveThemeName(this.data));
    const style = document.createElement('style');
    style.textContent = `
      :host {
        ${buildThemeVariables(theme)}
      }
      ${timelineStyles}
    `;
    root.appendChild(style);

    const section = document.createElement('section');
    section.className = 'timeline';

    const list = document.createElement('ol');
    list.className = 'timeline__list';

    const items = resolveItems(this.data);
    this.#animatedItems = renderTimelineItems(list, items);

    section.appendChild(list);
    root.appendChild(section);

    if (this.isConnected) {
      this.#mountViewportObserver();
    }
  }

  animate() {
    if (this.isConnected && this.#animatedItems.length) {
      runTimelineAnimation(this.#animatedItems);
    }
  }
}

customElements.define('timeline-section', TimelineSection);

export default TimelineSection;
