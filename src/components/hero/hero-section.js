import gsap from 'gsap';
import BaseComponent from '../../core/BaseComponent.js';
import { resolveSectionId } from '../../utils/resolveSectionId.js';
import { playHeroAnimation } from './hero-animate.js';
import heroStyles from './hero.scss?inline';

const HERO_SCENE_ASSETS = {
  car: 'assets/evcar/hero-car.webp',
  charger: 'assets/evcar/hero-charger.webp',
  wire: 'assets/evcar/hero-wire.webp',
};

/**
 * @param {HTMLElement} section
 */
function renderHeroScene(section) {
  const scene = document.createElement('div');
  scene.className = 'hero__scene';
  scene.setAttribute('aria-hidden', 'true');

  const charger = document.createElement('img');
  charger.className = 'hero__media-charger';
  charger.src = HERO_SCENE_ASSETS.charger;
  charger.alt = '';
  charger.decoding = 'async';

  const car = document.createElement('img');
  car.className = 'hero__media-car';
  car.src = HERO_SCENE_ASSETS.car;
  car.alt = '';
  car.decoding = 'async';

  const wire = document.createElement('img');
  wire.className = 'hero__media-wire';
  wire.src = HERO_SCENE_ASSETS.wire;
  wire.alt = '';
  wire.decoding = 'async';

  scene.appendChild(charger);
  scene.appendChild(car);
  scene.appendChild(wire);
  section.appendChild(scene);
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

  /** @type {(() => void) | null} */
  #sceneAnimationCleanup = null;

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

    this.#sceneAnimationCleanup?.();
    this.#sceneAnimationCleanup = null;

    const sceneTargets = this.shadowRoot?.querySelectorAll(
      '.hero__media-car, .hero__media-charger, .hero__media-wire',
    );
    if (sceneTargets?.length) {
      gsap.killTweensOf(sceneTargets);
    }

    if (this.#animatedElements.length) {
      gsap.killTweensOf(this.#animatedElements);
    }

    this.#animatedElements = [];
    this.#hasAnimated = false;
  }

  #runEntranceAnimations() {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    this.#sceneAnimationCleanup?.();
    this.#sceneAnimationCleanup = playHeroAnimation(root).cleanup;
    runHeroTextAnimation(this.#animatedElements);
  }

  #mountViewportObserver() {
    this.#viewportObserver?.disconnect();

    const hero = this.shadowRoot?.querySelector('.hero');
    if (!hero) {
      return;
    }

    this.#viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.#hasAnimated) {
            this.#hasAnimated = true;
            this.#runEntranceAnimations();
            this.#viewportObserver?.disconnect();
            this.#viewportObserver = null;
          }
        }
      },
      { threshold: 0.5 },
    );

    this.#viewportObserver.observe(hero);
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#cleanupAnimation();

    const root = this.shadowRoot;
    root.replaceChildren();

    const style = document.createElement('style');
    style.textContent = heroStyles;
    root.appendChild(style);

    const sectionId = resolveSectionId(this.data);
    if (sectionId) {
      this.id = sectionId;
    } else {
      this.removeAttribute('id');
    }

    const section = document.createElement('section');
    section.className = 'hero';

    renderHeroScene(section);

    // const overlay = document.createElement('div');
    // overlay.className = 'hero__overlay';
    // overlay.setAttribute('aria-hidden', 'true');
    // section.appendChild(overlay);

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
    if (!this.isConnected || this.#hasAnimated) {
      return;
    }

    this.#hasAnimated = true;
    this.#runEntranceAnimations();
  }
}

customElements.define('hero-section', HeroSection);

export default HeroSection;
