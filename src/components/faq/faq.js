import gsap from 'gsap';
import BaseComponent from '../../core/BaseComponent.js';
import faqStyles from './faq.scss?inline';
import { resolveSectionId } from '../../utils/resolveSectionId.js';

/**
 * @param {unknown} data
 * @returns {{
 *   title: string,
 *   description: string,
 *   allowMultipleOpen: boolean,
 *   items: object[],
 * }}
 */
function resolveFaqData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      title: '',
      description: '',
      allowMultipleOpen: false,
      items: [],
    };
  }

  const record = /** @type {Record<string, unknown>} */ (data);

  return {
    title: typeof record.title === 'string' ? record.title : '',
    description: typeof record.description === 'string' ? record.description : '',
    allowMultipleOpen: record.allowMultipleOpen === true,
    items: Array.isArray(record.items) ? record.items : [],
  };
}

/**
 * @returns {string}
 */

/**
 * @param {HTMLElement} panel
 * @param {HTMLElement} icon
 */
function animateOpen(panel, icon) {
  gsap.killTweensOf([panel, icon]);

  panel.hidden = false;
  gsap.set(panel, { height: 0, opacity: 0, overflow: 'hidden' });

  const targetHeight = panel.scrollHeight;

  gsap.to(panel, {
    height: targetHeight,
    opacity: 1,
    duration: 0.35,
    ease: 'power2.out',
    onComplete: () => {
      gsap.set(panel, { height: 'auto', overflow: 'hidden' });
    },
  });

  gsap.to(icon, {
    rotation: 180,
    duration: 0.35,
    ease: 'power2.out',
  });
}

/**
 * @param {HTMLElement} panel
 * @param {HTMLElement} icon
 * @param {() => void} onComplete
 */
function animateClose(panel, icon, onComplete) {
  gsap.killTweensOf([panel, icon]);

  gsap.set(panel, { height: panel.scrollHeight, overflow: 'hidden' });

  gsap.to(panel, {
    height: 0,
    opacity: 0,
    duration: 0.35,
    ease: 'power2.out',
    onComplete: () => {
      panel.hidden = true;
      gsap.set(panel, { height: 0, opacity: 0 });
      onComplete();
    },
  });

  gsap.to(icon, {
    rotation: 0,
    duration: 0.35,
    ease: 'power2.out',
  });
}

class FaqSection extends BaseComponent {
  /** @type {boolean} */
  #allowMultipleOpen = false;

  /** @type {Map<HTMLElement, { button: HTMLButtonElement, panel: HTMLElement, icon: HTMLElement }>} */
  #items = new Map();

  /** @type {Set<HTMLElement>} */
  #openItems = new Set();

  constructor() {
    super();
    this.animate.cleanup = () => this.#cleanupAnimation();
  }

  #cleanupAnimation() {
    for (const { panel, icon } of this.#items.values()) {
      gsap.killTweensOf([panel, icon]);
    }

    this.#items.clear();
    this.#openItems.clear();
  }

  #closeItem(itemEl) {
    const entry = this.#items.get(itemEl);
    if (!entry || !this.#openItems.has(itemEl)) {
      return;
    }

    const { button, panel, icon } = entry;
    this.#openItems.delete(itemEl);

    animateClose(panel, icon, () => {
      button.setAttribute('aria-expanded', 'false');
      itemEl.classList.remove('faq__item--open');
    });
  }

  #openItem(itemEl) {
    const entry = this.#items.get(itemEl);
    if (!entry) {
      return;
    }

    const { button, panel, icon } = entry;

    if (!this.#allowMultipleOpen) {
      for (const openItem of [...this.#openItems]) {
        if (openItem !== itemEl) {
          this.#closeItem(openItem);
        }
      }
    }

    button.setAttribute('aria-expanded', 'true');
    itemEl.classList.add('faq__item--open');
    this.#openItems.add(itemEl);
    animateOpen(panel, icon);
  }

  #toggleItem(itemEl) {
    if (this.#openItems.has(itemEl)) {
      this.#closeItem(itemEl);
      return;
    }

    this.#openItem(itemEl);
  }

  #createItem(item) {
    if (!item?.id || !item?.question || !item?.answer) {
      return null;
    }

    const answerId = `${item.id}-answer`;

    const itemEl = document.createElement('div');
    itemEl.className = 'faq__item';
    itemEl.id = String(item.id);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'faq__question';
    button.id = `${item.id}-question`;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', answerId);

    const questionText = document.createElement('span');
    questionText.className = 'faq__question-text';
    questionText.textContent = String(item.question);
    button.appendChild(questionText);

    const icon = document.createElement('span');
    icon.className = 'faq__icon';
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);

    const panel = document.createElement('div');
    panel.className = 'faq__answer';
    panel.id = answerId;
    panel.hidden = true;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', button.id);

    const inner = document.createElement('div');
    inner.className = 'faq__answer-inner';

    const answerText = document.createElement('p');
    answerText.className = 'faq__answer-text';
    answerText.textContent = String(item.answer);
    inner.appendChild(answerText);

    panel.appendChild(inner);

    button.addEventListener('click', () => this.#toggleItem(itemEl));

    itemEl.appendChild(button);
    itemEl.appendChild(panel);

    this.#items.set(itemEl, { button, panel, icon });

    return itemEl;
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#cleanupAnimation();

    const root = this.shadowRoot;
    root.replaceChildren();

    const { title, description, allowMultipleOpen, items} = resolveFaqData(this.data);
    this.#allowMultipleOpen = allowMultipleOpen;
    

    const style = document.createElement('style');
    style.textContent = `
      ${faqStyles}
    `;
    root.appendChild(style);

    const section = document.createElement('section');
    section.className = 'faq';
    const sectionId = resolveSectionId(this.data);
    if (sectionId) {
      this.id = sectionId;
    } else {
      this.removeAttribute('id');
    }

    if (title || description) {
      const header = document.createElement('header');
      header.className = 'faq__header';

      if (title) {
        const heading = document.createElement('h2');
        heading.className = 'faq__title';
        heading.textContent = title;
        header.appendChild(heading);
      }

      if (description) {
        const desc = document.createElement('p');
        desc.className = 'faq__description';
        desc.textContent = description;
        header.appendChild(desc);
      }

      section.appendChild(header);
    }

    const list = document.createElement('div');
    list.className = 'faq__list';

    for (const item of items) {
      const itemEl = this.#createItem(item);
      if (itemEl) {
        list.appendChild(itemEl);
      }
    }

    section.appendChild(list);
    root.appendChild(section);
  }

  animate() {}
}

customElements.define('faq-section', FaqSection);

export default FaqSection;
