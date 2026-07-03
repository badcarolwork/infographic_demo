# Infographic Data Schema

This schema defines the JSON data contract for the infographic web component system. **The schema must stay topic-agnostic** — field names describe structure and presentation, not domain concepts. A single component codebase should render EV cars, coffee, skincare, or any other topic by swapping data files only. Domain-specific terms (e.g. "battery", "engine", "roast") belong in example values and real data, never in field names or schema definitions.

---

## Top-level keys

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `meta` | object | **required** | Page-level metadata and theming |
| `nav` | array | **required** | In-page navigation links |
| `hero` | object | **required** | Hero / intro section |
| `timeline` | array | optional | Ordered scroll-animated timeline steps |
| `details` | array | optional | Expandable detail cards (popup on click) |
| `comparison` | object | optional | Before/after side-by-side comparison |
| `steps` | array | optional | Numbered step-by-step guide |

---

## `meta`

Page-level metadata and visual theme.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **required** | Main page title (document title, SEO) |
| `subtitle` | string | optional | Supporting tagline shown near the title |
| `theme` | string | **required** | CSS theme class name applied to the root element (e.g. `theme-ev`, `theme-coffee`) |

**Example (`meta`):**

```json
{
  "title": "The Electric Vehicle Revolution",
  "subtitle": "How battery-powered cars are reshaping transport",
  "theme": "theme-ev"
}
```

---

## `nav`

Array of in-page navigation items. Each item scrolls or jumps to a section by anchor id.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | **required** | Visible link text |
| `target` | string | **required** | Anchor id of the target section (no leading `#`) |

**Example (`nav`):**

```json
[
  { "label": "Timeline", "target": "timeline" },
  { "label": "Key Features", "target": "details" },
  { "label": "Then vs Now", "target": "comparison" },
  { "label": "How to Go Electric", "target": "steps" }
]
```

---

## `hero`

Introductory hero section at the top of the infographic.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **required** | Primary hero headline |
| `subtitle` | string | optional | Secondary hero text |
| `backgroundAsset` | string | optional | Path to background image or video asset |

**Example (`hero`):**

```json
{
  "title": "Driving Into the Future",
  "subtitle": "A visual guide to electric vehicles in 2026",
  "backgroundAsset": "assets/images/hero-ev-highway.jpg"
}
```

---

## `timeline`

Ordered list of milestones or phases rendered as a scroll-animated timeline. Array order defines display order.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **required** | Unique anchor id for this timeline item |
| `label` | string | **required** | Short date, era, or phase label (e.g. year, step name) |
| `title` | string | **required** | Headline for this timeline entry |
| `description` | string | **required** | Body copy for this entry |
| `asset` | string | optional | Path to supporting image or illustration |

**Example (`timeline` item):**

```json
{
  "id": "timeline-2010",
  "label": "2010",
  "title": "First Mass-Market EVs",
  "description": "Early adopters embraced limited-range models, proving demand for zero-emission driving.",
  "asset": "assets/images/timeline-early-ev.jpg"
}
```

---

## `details`

Expandable detail cards. Clicking a card opens `fullContent` in a popup or dialog.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **required** | Unique anchor id for this detail card |
| `icon` | string | **required** | Path to icon image |
| `title` | string | **required** | Card headline |
| `summary` | string | **required** | Short preview text shown on the card |
| `fullContent` | string | **required** | Full body content shown in the popup (plain text or HTML, depending on component config) |

**Example (`details` item):**

```json
{
  "id": "detail-range",
  "icon": "assets/icons/range.svg",
  "title": "Driving Range",
  "summary": "Modern EVs routinely exceed 300 miles on a single charge.",
  "fullContent": "Battery chemistry improvements and more efficient motors have pushed average range from under 100 miles in 2012 to over 300 miles today. Factors affecting range include temperature, driving speed, and terrain."
}
```

---

## `comparison`

Before/after (or then/now) side-by-side comparison block.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `before` | object | **required** | The "before" / legacy side |
| `after` | object | **required** | The "after" / modern side |

### `comparison.before` and `comparison.after`

Both sides share the same shape:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | **required** | Heading for this side (e.g. "Gasoline", "Electric") |
| `asset` | string | optional | Path to representative image |
| `points` | array of string | **required** | Bullet points highlighting key attributes |

**Example (`comparison`):**

```json
{
  "before": {
    "label": "Gasoline Car",
    "asset": "assets/images/comparison-gas.jpg",
    "points": [
      "Internal combustion engine with 2,000+ moving parts",
      "Average fuel cost: $1,500/year",
      "Tailpipe emissions contribute to urban air pollution"
    ]
  },
  "after": {
    "label": "Electric Vehicle",
    "asset": "assets/images/comparison-ev.jpg",
    "points": [
      "Electric motor with fewer than 20 moving parts",
      "Average charging cost: $600/year",
      "Zero direct tailpipe emissions"
    ]
  }
}
```

---

## `steps`

Numbered step-by-step guide (DIY-style instructions or process walkthrough).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | number | **required** | Step sequence number (1-based) |
| `title` | string | **required** | Step headline |
| `description` | string | **required** | Step instructions or explanation |
| `asset` | string | optional | Path to supporting image or diagram |

**Example (`steps` item):**

```json
{
  "number": 1,
  "title": "Assess Your Driving Habits",
  "description": "Track your daily mileage for two weeks. Most drivers travel under 40 miles per day — well within the range of any modern EV.",
  "asset": "assets/images/step-assess-driving.jpg"
}
```

---

## Minimal valid document

A data file must include `meta`, `nav`, and `hero`. All other top-level keys are optional and may be omitted when a section is not needed for a given topic.

```json
{
  "meta": { "title": "…", "theme": "theme-ev" },
  "nav": [{ "label": "…", "target": "…" }],
  "hero": { "title": "…" }
}
```
