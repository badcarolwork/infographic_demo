# Interactive Infographic Framework

A reusable, data-driven interactive infographic built with JavaScript, Native Web Components, GSAP and SCSS.
The project demonstrates an embeddable infographic that can be adapted to different topics by replacing the data source.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## Features

- Responsive infographic layout
- Reusable Web Components
- Configuration-driven content (JSON)
- GSAP animations
- Timeline in horiztal/ vertical layout
- Detail cards with popup
- Before/After comparison slider 
- FAQ accordion
- Multiple themes

### Interactions & Animations

- Hero text fade-in animation (GSAP)
- Timeline staggered reveal on scroll with InteractObserver API
- Mouse hover transitions for Timeline icon
- Detail cards with popup for additional information
- Before/After image comparison with draggable slider
- Animated metric cards revealed after slider interaction
- FAQ accordion with expand/collapse animation

---

## Assumptions

- Designed as an embeddable infographic rather than a full website.
- Content is driven entirely by configuration data.
- Uses placeholder media assets for demonstration.

---

## Limitations
- Currently demonstrates one infographic layout.
- No backend or CMS integration.