import gsap from 'gsap';
import BaseComponent from '../../core/BaseComponent.js';
import { resolveSectionId } from '../../utils/resolveSectionId.js';
import detailPanelStyles from './detailpanel.scss?inline';

/**
 * @param {unknown} data
 * @returns {{ title: string, description: string, items: object[] }}
 */
function resolvePanelData(data) {
  if (!data) {
    return { title: '', description: '', items: []};
  }

  if (Array.isArray(data)) {
    return { title: '', description: '', items: data};
  }

  if (typeof data === 'object') {
    const record = /** @type {Record<string, unknown>} */ (data);
    const items =
      (Array.isArray(record.items) && record.items) ||
      (Array.isArray(record.details) && record.details) ||
      (Array.isArray(record.detailPanel) && record.detailPanel) ||
      [];

    return {
      title: typeof record.title === 'string' ? record.title : '',
      description: typeof record.description === 'string' ? record.description : '',
      items,
    };
  }

  return { title: '', description: '', items: []};
}
/**
 * @returns {string}
 */

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

  const icon = item?.icon;
  if (typeof icon === 'string' && icon) {
    return {
      type: 'image',
      src: icon,
      alt: String(item?.title ?? ''),
    };
  }

  return null;
}

/**
 * @param {HTMLElement} card
 * @param {{ src: string, alt: string }} source
 */
function renderCardIcon(card, source) {
  const icon = document.createElement('div');
  icon.className = 'detail-panel__icon';
  icon.setAttribute('role', 'img');
  icon.setAttribute('aria-label', source.alt);
  icon.style.setProperty('--icon-url', `url("${source.src}")`);
  card.appendChild(icon);
}

/**
 * @param {HTMLElement[]} targets
 */
function runSectionAnimation(targets) {
  if (!targets.length) {
    return;
  }

  gsap.fromTo(
    targets,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.12,
      clearProps: 'transform',
    },
  );
}

/**
 * @param {HTMLElement} popup
 * @param {() => void} onComplete
 */
function animatePopupOpen(popup, onComplete) {
  gsap.fromTo(
    popup,
    { opacity: 0, scale: 0.95, y: 20 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.35,
      ease: 'power2.out',
      onComplete,
    },
  );
}

/**
 * @param {HTMLElement} popup
 * @param {() => void} onComplete
 */
function animatePopupClose(popup, onComplete) {
  gsap.to(popup, {
    opacity: 0,
    scale: 0.95,
    y: 20,
    duration: 0.35,
    ease: 'power2.out',
    onComplete,
  });
}

class DetailPanelSection extends BaseComponent {
  /** @type {IntersectionObserver | null} */
  #viewportObserver = null;

  /** @type {boolean} */
  #hasAnimated = false;

  /** @type {HTMLElement[]} */
  #animatedTargets = [];

  /** @type {HTMLElement | null} */
  #activePopup = null;

  /** @type {HTMLElement | null} */
  #activeCard = null;

  /** @type {HTMLButtonElement | null} */
  #lastFocusedButton = null;

  /** @type {((event: KeyboardEvent) => void) | null} */
  #onKeydown = null;

  /** @type {((event: PointerEvent) => void) | null} */
  #onPointerDown = null;

  constructor() {
    super();
    this.animate.cleanup = () => this.#cleanupAll();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#mountViewportObserver();
  }

  #cleanupAll() {
    this.#closeActivePopup(false);
    this.#cleanupAnimation();
    this.#unbindPopupDismiss();
  }

  #cleanupAnimation() {
    this.#viewportObserver?.disconnect();
    this.#viewportObserver = null;

    if (this.#animatedTargets.length) {
      gsap.killTweensOf(this.#animatedTargets);
    }

    if (this.#activePopup) {
      gsap.killTweensOf(this.#activePopup);
    }

    this.#animatedTargets = [];
    this.#hasAnimated = false;
  }

  #mountViewportObserver() {
    this.#viewportObserver?.disconnect();

    const section = this.shadowRoot?.querySelector('.detail-panel');
    if (!section || !this.#animatedTargets.length) {
      return;
    }

    this.#viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.#hasAnimated) {
            this.#hasAnimated = true;
            runSectionAnimation(this.#animatedTargets);
            this.#viewportObserver?.disconnect();
            this.#viewportObserver = null;
          }
        }
      },
      { threshold: 0.15 },
    );

    this.#viewportObserver.observe(section);
  }

  #bindPopupDismiss() {
    this.#unbindPopupDismiss();

    this.#onKeydown = (event) => {
      if (event.key === 'Escape') {
        this.#closeActivePopup();
      }
    };

    this.#onPointerDown = (event) => {
      if (!this.#activePopup) {
        return;
      }

      const path = event.composedPath();
      if (!path.includes(this.#activePopup)) {
        this.#closeActivePopup();
      }
    };

    document.addEventListener('keydown', this.#onKeydown);
    requestAnimationFrame(() => {
      document.addEventListener('pointerdown', this.#onPointerDown);
    });
  }

  #unbindPopupDismiss() {
    if (this.#onKeydown) {
      document.removeEventListener('keydown', this.#onKeydown);
      this.#onKeydown = null;
    }

    if (this.#onPointerDown) {
      document.removeEventListener('pointerdown', this.#onPointerDown);
      this.#onPointerDown = null;
    }
  }

  #closeActivePopup(restoreFocus = true) {
    if (!this.#activePopup || !this.#activeCard) {
      return;
    }

    const popup = this.#activePopup;
    const card = this.#activeCard;
    const trigger = this.#lastFocusedButton;

    gsap.killTweensOf(popup);
    animatePopupClose(popup, () => {
      popup.classList.remove('detail-panel__popup--visible');
      popup.hidden = true;
      card.classList.remove('detail-panel__card--open');

      const backdrop = card.querySelector('.detail-panel__backdrop');
      if (backdrop instanceof HTMLElement) {
        backdrop.hidden = true;
      }

      if (restoreFocus && trigger) {
        trigger.focus();
      }
    });

    this.#activePopup = null;
    this.#activeCard = null;
    this.#lastFocusedButton = null;
    this.#unbindPopupDismiss();
  }

  #openPopup(card, item, trigger) {
    this.#closeActivePopup(false);

    const popup = card.querySelector('.detail-panel__popup');
    const backdrop = card.querySelector('.detail-panel__backdrop');
    const popupTitle = card.querySelector('.detail-panel__popup-title');
    const popupContent = card.querySelector('.detail-panel__full-content');
    const closeButton = card.querySelector('.detail-panel__popup-close');

    if (
      !(popup instanceof HTMLElement) ||
      !(backdrop instanceof HTMLElement) ||
      !(popupTitle instanceof HTMLElement) ||
      !(popupContent instanceof HTMLElement) ||
      !(closeButton instanceof HTMLButtonElement)
    ) {
      return;
    }

    this.#lastFocusedButton = trigger;
    this.#activePopup = popup;
    this.#activeCard = card;

    popupTitle.textContent = String(item.title ?? '');
    popupContent.textContent = String(item.fullContent ?? '');


    card.classList.add('detail-panel__card--open');
    backdrop.hidden = false;
    popup.hidden = false;
    popup.classList.add('detail-panel__popup--visible');

    gsap.killTweensOf(popup);
    gsap.set(popup, { opacity: 0, scale: 0.95, y: 20 });
    animatePopupOpen(popup, () => {
      closeButton.focus();
    });

    this.#bindPopupDismiss();
  }

  #createCard(item) {
    if (!item?.id || !item?.title || !item?.summary || !item?.fullContent) {
      return null;
    }

    const card = document.createElement('article');
    card.className = 'detail-panel__card';
    card.id = String(item.id);

    const backdrop = document.createElement('div');
    backdrop.className = 'detail-panel__backdrop';
    backdrop.hidden = true;
    card.appendChild(backdrop);

    const popup = document.createElement('div');
    popup.className = 'detail-panel__popup';
    popup.hidden = true;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'detail-panel__popup-close';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => this.#closeActivePopup());
    popup.appendChild(closeButton);

    const popupTitle = document.createElement('h3');
    popupTitle.className = 'detail-panel__popup-title';
    popupTitle.id = `${item.id}-dialog-title`;
    popup.setAttribute('aria-labelledby', popupTitle.id);
    popup.appendChild(popupTitle);

    const fullContent = document.createElement('p');
    fullContent.className = 'detail-panel__full-content';
    popup.appendChild(fullContent);

    card.appendChild(popup);

    const body = document.createElement('div');
    body.className = 'detail-panel__body';

    const media = resolveItemMedia(item);
    if (media?.type === 'image') {
      renderCardIcon(card, media);
    }

    const title = document.createElement('h3');
    title.className = 'detail-panel__title';
    title.textContent = String(item.title);
    body.appendChild(title);

    const summary = document.createElement('p');
    summary.className = 'detail-panel__summary';
    summary.textContent = String(item.summary);
    body.appendChild(summary);

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'detail-panel__cta';
    cta.textContent = 'Learn More';
    cta.addEventListener('click', () => this.#openPopup(card, item, cta));
    body.appendChild(cta);

    card.appendChild(body);

    return card;
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#cleanupAll();

    const root = this.shadowRoot;
    root.replaceChildren();

    const { title, description, items} = resolvePanelData(this.data);

    const style = document.createElement('style');
    style.textContent = `
      ${detailPanelStyles}
    `;
    root.appendChild(style);

    const section = document.createElement('section');
    section.className = 'detail-panel';
    const sectionId = resolveSectionId(this.data);
    if (sectionId) {
      this.id = sectionId;
    } else {
      this.removeAttribute('id');
    }

    this.#animatedTargets = [];

    if (title || description) {
      const header = document.createElement('header');
      header.className = 'detail-panel__header';

      if (title) {
        const heading = document.createElement('h2');
        heading.className = 'detail-panel__section-title';
        heading.textContent = title;
        header.appendChild(heading);
        this.#animatedTargets.push(heading);
      }

      if (description) {
        const desc = document.createElement('p');
        desc.className = 'detail-panel__description';
        desc.textContent = description;
        header.appendChild(desc);
        this.#animatedTargets.push(desc);
      }

      section.appendChild(header);
    }

    const grid = document.createElement('div');
    grid.className = 'detail-panel__grid';

    for (const item of items) {
      const card = this.#createCard(item);
      if (card) {
        grid.appendChild(card);
        const body = card.querySelector('.detail-panel__body');
        this.#animatedTargets.push(body instanceof HTMLElement ? body : card);
      }
    }

    section.appendChild(grid);
    root.appendChild(section);

    if (this.isConnected) {
      this.#mountViewportObserver();
    }
  }

  animate() {
    if (this.isConnected && this.#animatedTargets.length) {
      runSectionAnimation(this.#animatedTargets);
    }
  }
}

customElements.define('detail-panel-section', DetailPanelSection);

export default DetailPanelSection;
