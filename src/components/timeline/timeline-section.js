import gsap from "gsap";
import BaseComponent from "../../core/BaseComponent.js";
import { resolveSectionId } from "../../utils/resolveSectionId.js";
import timelineStyles from "./timeline.scss?inline";

/**
 * @param {unknown} data
 * @returns {object[]}
 */
function resolveItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    const record = /** @type {Record<string, unknown>} */ (data);

    if (Array.isArray(record.items)) {
      return record.items;
    }

    const timeline = record.timeline;
    if (Array.isArray(timeline)) {
      return timeline;
    }

    if (timeline && typeof timeline === "object" && Array.isArray(timeline.items)) {
      return timeline.items;
    }
  }

  return [];
}

/**
 * @param {unknown} data
 * @returns {string}
 */
function resolveTimelineAlignment(data) {
  if (
    data &&
    typeof data === "object" &&
    data.meta &&
    typeof data.meta === "object" &&
    data.meta.timeline &&
    typeof data.meta.timeline === "object"
  ) {
    return data.meta.timeline.alignment === "horizontal" ? "horizontal" : "vertical";
  }
  return "vertical";
}

/**
 * @param {Record<string, unknown> | undefined} item
 * @returns {{ type: 'image' | 'video', src: string, alt: string, poster?: string } | null}
 */
function resolveItemMedia(item) {
  const media = item?.media;
  if (media && typeof media === "object" && media.type && media.src) {
    return {
      type: media.type === "video" ? "video" : "image",
      src: String(media.src),
      alt: String(media.alt ?? item?.title ?? ""),
      poster: typeof media.poster === "string" ? media.poster : undefined,
    };
  }

  const asset = item?.asset;
  if (typeof asset === "string" && asset) {
    return {
      type: "image",
      src: asset,
      alt: String(item?.title ?? ""),
    };
  }

  return null;
}

/**
 * @param {HTMLElement} container
 * @param {{ type: 'image' | 'video', src: string, alt: string, poster?: string }} source
 */
function renderItemMedia(container, source) {
  if (source.type === "video") {
    const video = document.createElement("video");
    video.className = "timeline__media-el";
    video.src = source.src;
    if (source.poster) {
      video.poster = source.poster;
    }
    video.controls = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("aria-label", source.alt);
    container.appendChild(video);
    return;
  }

  const img = document.createElement("img");
  img.className = "timeline__media-el";
  img.src = source.src;
  img.alt = source.alt;
  container.appendChild(img);
}

/**
 * @param {HTMLElement} list
 * @param {object[]} items
 * @param {string} alignment
 * @returns {HTMLElement[]}
 */
function renderTimelineItems(list, items, alignment) {
  const animatedItems = [];
  let index = 0;

  for (const item of items) {
    if (!item?.id || !item?.label || !item?.title || !item?.description) {
      continue;
    }

    const li = document.createElement("li");
    li.className = "timeline__item";
    li.id = String(item.id);

    if (alignment === "vertical") {
      if (index % 2 === 1) {
        li.classList.add("timeline__item--reverse");
      }

      // badge — the pill (e.g. "January 2019"), separate from the dot on the line
      const badge = document.createElement("div");
      badge.className = "timeline__badge";

      if (
        typeof item.label === "object" &&
        item.label.type === "img" &&
        item.label.src
      ) {
        const img = document.createElement("img");
        img.className = "timeline__badge-img";
        img.src = String(item.label.src);
        img.alt = String(item.label.text ?? "");
        badge.appendChild(img);
      } else {
        const pill = document.createElement("span");
        pill.className = "timeline__badge-pill";
        pill.textContent = String(item.label);
        badge.appendChild(pill);
      }
      li.appendChild(badge);

      // marker — just the small dot sitting on the spine
      const marker = document.createElement("div");
      marker.className = "timeline__marker";
      const dot = document.createElement("span");
      dot.className = "timeline__dot";
      marker.appendChild(dot);
      li.appendChild(marker);
    } else {
      // horizontal: unchanged — label renders directly inside the marker
      const marker = document.createElement("div");
      marker.className = "timeline__marker";

      if (
        typeof item.label === "object" &&
        item.label.type === "img" &&
        item.label.src
      ) {
        const img = document.createElement("img");
        img.className = "timeline__step-img";
        img.src = String(item.label.src);
        img.alt = String(item.label.text ?? "");
        marker.appendChild(img);
      } else {
        const step = document.createElement("span");
        step.className = "timeline__step";
        step.textContent = String(item.label);
        marker.appendChild(step);
      }
      li.appendChild(marker);
    }

    const body = document.createElement("div");
    body.className = "timeline__body";

    const title = document.createElement("h2");
    title.className = "timeline__title";
    title.textContent = String(item.title);
    body.appendChild(title);

    const description = document.createElement("p");
    description.className = "timeline__description";
    description.textContent = String(item.description);
    body.appendChild(description);

    const media = resolveItemMedia(item);
    if (media) {
      const figure = document.createElement("figure");
      figure.className = "timeline__media";
      renderItemMedia(figure, media);
      body.appendChild(figure);
    }

    li.appendChild(body);
    list.appendChild(li);
    animatedItems.push(li);
    index += 1;
  }

  return animatedItems;
}

/**
 * @param {HTMLElement} item
 */
function runItemRevealAnimation(item) {
  gsap.to(item, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    clearProps: 'transform',
  });
}

class TimelineSection extends BaseComponent {
  /** @type {IntersectionObserver | null} */
  #itemObserver = null;

  /** @type {HTMLElement[]} */
  #animatedItems = [];

  /** @type {string} */
  #alignment = 'vertical';

  constructor() {
    super();
    this.animate.cleanup = () => this.#cleanupAnimation();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#mountItemObservers();
  }

  #cleanupAnimation() {
    this.#itemObserver?.disconnect();
    this.#itemObserver = null;

    if (this.#animatedItems.length) {
      gsap.killTweensOf(this.#animatedItems);
    }

    this.#animatedItems = [];
    this.#alignment = 'vertical';
  }

  #mountItemObservers() {
    this.#itemObserver?.disconnect();

    if (!this.#animatedItems.length || this.#alignment !== 'vertical') {
      return;
    }

    this.#itemObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.target.dataset.revealed === 'true') {
            continue;
          }

          const item = /** @type {HTMLElement} */ (entry.target);
          item.dataset.revealed = 'true';
          runItemRevealAnimation(item);
          this.#itemObserver?.unobserve(item);
        }
      },
      { threshold: 0.5 },
    );

    for (const item of this.#animatedItems) {
      delete item.dataset.revealed;
      gsap.set(item, { opacity: 0, y: 30 });
      this.#itemObserver.observe(item);
    }
  }

  render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this.#cleanupAnimation();

    const root = this.shadowRoot;
    root.replaceChildren();

    const style = document.createElement("style");
    style.textContent = `${timelineStyles}`;
    root.appendChild(style);

    const alignment = resolveTimelineAlignment(this.data);
    this.#alignment = alignment;
    const sectionId = resolveSectionId(this.data);

    if (sectionId) {
      this.id = sectionId;
    } else {
      this.removeAttribute('id');
    }

    const section = document.createElement('section');
    section.className = `timeline timeline--${alignment}`;

    const list = document.createElement('ol');
    list.className = 'timeline__list';

    const items = resolveItems(this.data);
    this.#animatedItems = renderTimelineItems(list, items, alignment);

    section.appendChild(list);
    root.appendChild(section);

    if (this.isConnected) {
      this.#mountItemObservers();
    }
  }

  animate() {
    if (!this.isConnected || !this.#animatedItems.length || this.#alignment !== 'vertical') {
      return;
    }

    for (const item of this.#animatedItems) {
      if (item.dataset.revealed === 'true') {
        continue;
      }
      item.dataset.revealed = 'true';
      runItemRevealAnimation(item);
    }
  }
}

customElements.define("timeline-section", TimelineSection);

export default TimelineSection;