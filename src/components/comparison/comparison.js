import gsap from 'gsap';
import BaseComponent from '../../core/BaseComponent.js';
import { resolveSectionId } from '../../utils/resolveSectionId.js';
import comparisonStyles from './comparison.scss?inline';

const SLIDER_MIN = 10;
const SLIDER_MAX = 90;
const SLIDER_DEFAULT = 50;
const SLIDER_STEP = 2;
const METRICS_FADE_OUT = 0.2;
const METRICS_FADE_IN = 0.25;

/**
 * @param {unknown} data
 * @returns {{
 *   title: string,
 *   description: string,
 *   before: object | null,
 *   after: object | null,
 * }}
 */
function resolveComparisonData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { title: '', description: '', before: null, after: null};
  }

  const record = /** @type {Record<string, unknown>} */ (data);

  return {
    title: typeof record.title === 'string' ? record.title : '',
    description: typeof record.description === 'string' ? record.description : '',
    before: record.before && typeof record.before === 'object' ? record.before : null,
    after: record.after && typeof record.after === 'object' ? record.after : null,
  };
}

/**
 * @returns {string}
 */

/**
 * @param {unknown} media
 * @param {string} fallbackLabel
 * @returns {{ type: 'image' | 'video', src: string, alt: string } | null}
 */
function resolveMedia(media, fallbackLabel) {
  if (!media || typeof media !== 'object') {
    return null;
  }

  const record = /** @type {Record<string, unknown>} */ (media);
  if (!record.src) {
    return null;
  }

  return {
    type: record.type === 'video' ? 'video' : 'image',
    src: String(record.src),
    alt: String(record.alt ?? fallbackLabel),
  };
}

/**
 * @param {HTMLElement} container
 * @param {{ type: 'image' | 'video', src: string, alt: string }} source
 * @param {string} className
 */
function renderMedia(container, source, className) {
  if (source.type === 'video') {
    const video = document.createElement('video');
    video.className = className;
    video.src = source.src;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;
    video.setAttribute('aria-label', source.alt);
    container.appendChild(video);
    return;
  }

  const img = document.createElement('img');
  img.className = className;
  img.src = source.src;
  img.alt = source.alt;
  container.appendChild(img);
}

/**
 * @param {HTMLElement[]} targets
 */
function runSectionAnimation(targets) {
  if (!targets.length) {
    return;
  }

  gsap.from(targets, {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out',
    stagger: 0.12,
  });
}

/**
 * @param {HTMLElement[]} targets
 */
function runMetricsAnimation(targets) {
  if (!targets.length) {
    return;
  }

  gsap.from(targets, {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.12,
  });
}

class ComparisonSection extends BaseComponent {
  /** @type {number} */
  #position = SLIDER_DEFAULT;

  /** @type {boolean} */
  #isDragging = false;

  /** @type {number | null} */
  #rafId = null;

  /** @type {number | null} */
  #pendingClientX = null;

  /** @type {boolean} */
  #metricsRevealed = false;

  /** @type {IntersectionObserver | null} */
  #viewportObserver = null;

  /** @type {boolean} */
  #hasAnimated = false;

  /** @type {HTMLElement[]} */
  #sectionTargets = [];

  /** @type {HTMLElement[]} */
  #metricTargets = [];

  /** @type {HTMLElement | null} */
  #viewer = null;

  /** @type {HTMLElement | null} */
  #afterClip = null;

  /** @type {HTMLButtonElement | null} */
  #handle = null;

  /** @type {HTMLElement | null} */
  #details = null;

  /** @type {HTMLElement | null} */
  #metricsGrid = null;

  /** @type {HTMLElement | null} */
  #highlightsEl = null;

  /** @type {object | null} */
  #beforeSide = null;

  /** @type {object | null} */
  #afterSide = null;

  /** @type {'before' | 'after' | null} */
  #activeSide = null;

  /** @type {boolean} */
  #isMetricsTransitioning = false;

  /** @type {((event: PointerEvent) => void) | null} */
  #onPointerMove = null;

  /** @type {((event: PointerEvent) => void) | null} */
  #onPointerUp = null;

  constructor() {
    super();
    this.animate.cleanup = () => this.#cleanupAll();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#mountViewportObserver();
  }

  #cleanupAll() {
    this.#stopDragging();
    this.#cleanupAnimation();
  }

  #cleanupAnimation() {
    this.#viewportObserver?.disconnect();
    this.#viewportObserver = null;

    if (this.#sectionTargets.length) {
      gsap.killTweensOf(this.#sectionTargets);
    }

    if (this.#metricTargets.length) {
      gsap.killTweensOf(this.#metricTargets);
    }

    const detailContainers = this.#detailContainers();
    if (detailContainers.length) {
      gsap.killTweensOf(detailContainers);
    }

    this.#sectionTargets = [];
    this.#metricTargets = [];
    this.#hasAnimated = false;
    this.#metricsRevealed = false;
    this.#activeSide = null;
    this.#isMetricsTransitioning = false;
  }

  #detailContainers() {
    return [this.#metricsGrid, this.#highlightsEl].filter(Boolean);
  }

  #mountViewportObserver() {
    this.#viewportObserver?.disconnect();

    const section = this.shadowRoot?.querySelector('.comparison');
    if (!section || !this.#sectionTargets.length) {
      return;
    }

    this.#viewportObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.#hasAnimated) {
            this.#hasAnimated = true;
            runSectionAnimation(this.#sectionTargets);
            this.#viewportObserver?.disconnect();
            this.#viewportObserver = null;
          }
        }
      },
      { threshold: 0.15 },
    );

    this.#viewportObserver.observe(section);
  }

  #clampPosition(value) {
    return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, value));
  }

  #afterVisiblePercent() {
    return 100 - this.#position;
  }

  #updateSliderVisuals() {
    if (!this.#afterClip || !this.#handle) {
      return;
    }

    this.#afterClip.style.clipPath = `inset(0 0 0 ${this.#position}%)`;
    this.#handle.style.left = `${this.#position}%`;
    this.#handle.setAttribute('aria-valuenow', String(Math.round(this.#position)));

    this.#syncDetailsToPosition();
  }

  #populateDetails(side) {
    if (!this.#metricsGrid || !this.#highlightsEl) {
      return;
    }

    this.#metricsGrid.replaceChildren();
    this.#highlightsEl.replaceChildren();
    this.#metricTargets = [];

    const metrics = side?.metrics;
    if (Array.isArray(metrics)) {
      for (const metric of metrics) {
        if (!metric?.label || metric?.value === undefined) {
          continue;
        }

        const card = document.createElement('div');
        card.className = 'comparison__metric-card';

        const label = document.createElement('span');
        label.className = 'comparison__metric-label';
        label.textContent = String(metric.label);

        const value = document.createElement('strong');
        value.className = 'comparison__metric-value';
        value.textContent = String(metric.value);

        card.appendChild(label);
        card.appendChild(value);
        this.#metricsGrid.appendChild(card);
        this.#metricTargets.push(card);
      }
    }

    const highlights = side?.highlights;
    if (Array.isArray(highlights)) {
      for (const highlight of highlights) {
        if (typeof highlight !== 'string' || !highlight) {
          continue;
        }

        const pill = document.createElement('span');
        pill.className = 'comparison__highlight';
        pill.textContent = highlight;
        this.#highlightsEl.appendChild(pill);
        this.#metricTargets.push(pill);
      }
    }
  }

  #applyMetricsForCurrentPosition() {
    const showingAfter = this.#afterVisiblePercent() > 50;
    const nextSide = showingAfter ? 'after' : 'before';
    const sideData = showingAfter ? this.#afterSide : this.#beforeSide;

    this.#populateDetails(sideData);
    this.#activeSide = nextSide;
  }

  #fadeSwitchMetrics() {
    const containers = this.#detailContainers();
    if (!containers.length) {
      return;
    }

    this.#isMetricsTransitioning = true;
    gsap.killTweensOf(containers);

    if (this.#metricTargets.length) {
      gsap.killTweensOf(this.#metricTargets);
    }

    gsap.to(containers, {
      opacity: 0,
      duration: METRICS_FADE_OUT,
      ease: 'power2.out',
      onComplete: () => {
        this.#applyMetricsForCurrentPosition();

        gsap.to(containers, {
          opacity: 1,
          duration: METRICS_FADE_IN,
          ease: 'power2.out',
          onComplete: () => {
            this.#isMetricsTransitioning = false;

            const showingAfter = this.#afterVisiblePercent() > 50;
            const expectedSide = showingAfter ? 'after' : 'before';
            if (this.#activeSide !== expectedSide) {
              this.#syncDetailsToPosition();
            }
          },
        });
      },
    });
  }

  #syncDetailsToPosition() {
    if (!this.#details || !this.#beforeSide || !this.#afterSide) {
      return;
    }

    const showingAfter = this.#afterVisiblePercent() > 50;
    const nextSide = showingAfter ? 'after' : 'before';

    if (this.#activeSide === nextSide && !this.#details.hidden && !this.#isMetricsTransitioning) {
      return;
    }

    this.#details.hidden = false;

    if (!this.#metricsRevealed) {
      this.#metricsRevealed = true;
      this.#applyMetricsForCurrentPosition();
      runMetricsAnimation(this.#metricTargets);
      return;
    }

    if (this.#isMetricsTransitioning) {
      return;
    }

    if (this.#activeSide === nextSide) {
      return;
    }

    this.#fadeSwitchMetrics();
  }

  #setPositionFromClientX(clientX) {
    if (!this.#viewer) {
      return;
    }

    const rect = this.#viewer.getBoundingClientRect();
    if (!rect.width) {
      return;
    }

    const percent = ((clientX - rect.left) / rect.width) * 100;
    this.#position = this.#clampPosition(percent);
    this.#updateSliderVisuals();
  }

  #schedulePositionUpdate(clientX) {
    this.#pendingClientX = clientX;

    if (this.#rafId !== null) {
      return;
    }

    this.#rafId = requestAnimationFrame(() => {
      if (this.#pendingClientX !== null) {
        this.#setPositionFromClientX(this.#pendingClientX);
      }
      this.#rafId = null;
      this.#pendingClientX = null;
    });
  }

  #stopDragging() {
    this.#isDragging = false;

    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }

    this.#pendingClientX = null;

    if (this.#onPointerMove) {
      document.removeEventListener('pointermove', this.#onPointerMove);
      this.#onPointerMove = null;
    }

    if (this.#onPointerUp) {
      document.removeEventListener('pointerup', this.#onPointerUp);
      document.removeEventListener('pointercancel', this.#onPointerUp);
      this.#onPointerUp = null;
    }

    if (this.#handle) {
      this.#handle.removeAttribute('aria-grabbed');
    }
  }

  #startDragging(clientX) {
    this.#isDragging = true;

    if (this.#handle) {
      this.#handle.setAttribute('aria-grabbed', 'true');
    }

    this.#setPositionFromClientX(clientX);

    this.#onPointerMove = (event) => {
      if (!this.#isDragging) {
        return;
      }
      this.#schedulePositionUpdate(event.clientX);
    };

    this.#onPointerUp = () => {
      this.#stopDragging();
    };

    document.addEventListener('pointermove', this.#onPointerMove);
    document.addEventListener('pointerup', this.#onPointerUp);
    document.addEventListener('pointercancel', this.#onPointerUp);
  }

  #nudgePosition(delta) {
    this.#position = this.#clampPosition(this.#position + delta);
    this.#updateSliderVisuals();
  }

  #createViewer(before, after) {
    const viewer = document.createElement('div');
    viewer.className = 'comparison__viewer';
    this.#viewer = viewer;

    const beforeMedia = resolveMedia(before?.media, before?.label ?? 'Before');
    const afterMedia = resolveMedia(after?.media, after?.label ?? 'After');

    if (beforeMedia) {
      renderMedia(viewer, beforeMedia, 'comparison__image comparison__image--before');
    }

    const afterClip = document.createElement('div');
    afterClip.className = 'comparison__after-clip';
    this.#afterClip = afterClip;

    if (afterMedia) {
      renderMedia(afterClip, afterMedia, 'comparison__image comparison__image--after');
    }

    viewer.appendChild(afterClip);

    const labels = document.createElement('div');
    labels.className = 'comparison__labels';

    if (before?.label) {
      const beforeLabel = document.createElement('span');
      beforeLabel.className = 'comparison__label comparison__label--before';
      beforeLabel.textContent = String(before.label);
      labels.appendChild(beforeLabel);
    }

    if (after?.label) {
      const afterLabel = document.createElement('span');
      afterLabel.className = 'comparison__label comparison__label--after';
      afterLabel.textContent = String(after.label);
      labels.appendChild(afterLabel);
    }

    viewer.appendChild(labels);

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'comparison__handle';
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-label', 'Comparison slider');
    handle.setAttribute('aria-valuemin', String(SLIDER_MIN));
    handle.setAttribute('aria-valuemax', String(SLIDER_MAX));
    handle.setAttribute('aria-valuenow', String(SLIDER_DEFAULT));

    const line = document.createElement('span');
    line.className = 'comparison__handle-line';
    line.setAttribute('aria-hidden', 'true');

    const grip = document.createElement('span');
    grip.className = 'comparison__handle-grip';
    grip.setAttribute('aria-hidden', 'true');

    handle.appendChild(line);
    handle.appendChild(grip);

    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      this.#startDragging(event.clientX);
    });

    handle.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.#nudgePosition(-SLIDER_STEP);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.#nudgePosition(SLIDER_STEP);
      }
    });

    viewer.appendChild(handle);
    this.#handle = handle;

    this.#position = SLIDER_DEFAULT;
    this.#updateSliderVisuals();

    return viewer;
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.#cleanupAll();

    const root = this.shadowRoot;
    root.replaceChildren();

    const { title, description, before, after } = resolveComparisonData(this.data);

    this.#beforeSide = before;
    this.#afterSide = after;
    this.#activeSide = null;

    const style = document.createElement('style');
    style.textContent = `
      ${comparisonStyles}
    `;
    root.appendChild(style);

    const sectionId = resolveSectionId(this.data);
    if (sectionId) {
      this.id = sectionId;
    } else {
      this.removeAttribute('id');
    }

    const section = document.createElement('section');
    section.className = 'comparison';

    if (title || description) {
      const header = document.createElement('header');
      header.className = 'comparison__header';

      if (title) {
        const heading = document.createElement('h2');
        heading.className = 'comparison__title';
        heading.textContent = title;
        header.appendChild(heading);
        this.#sectionTargets.push(heading);
      }

      if (description) {
        const desc = document.createElement('p');
        desc.className = 'comparison__description';
        desc.textContent = description;
        header.appendChild(desc);
        this.#sectionTargets.push(desc);
      }

      section.appendChild(header);
    }

    const stage = document.createElement('div');
    stage.className = 'comparison__stage';
    stage.appendChild(this.#createViewer(before, after));
    section.appendChild(stage);
    this.#sectionTargets.push(stage);

    const details = document.createElement('div');
    details.className = 'comparison__details';
    details.hidden = true;
    this.#details = details;

    this.#metricsGrid = document.createElement('div');
    this.#metricsGrid.className = 'comparison__metrics';
    details.appendChild(this.#metricsGrid);

    this.#highlightsEl = document.createElement('div');
    this.#highlightsEl.className = 'comparison__highlights';
    details.appendChild(this.#highlightsEl);

    section.appendChild(details);
    root.appendChild(section);

    if (this.isConnected) {
      this.#mountViewportObserver();
    }
  }

  animate() {
    if (this.isConnected && this.#sectionTargets.length) {
      runSectionAnimation(this.#sectionTargets);
    }
  }
}

customElements.define('comparison-section', ComparisonSection);

export default ComparisonSection;
