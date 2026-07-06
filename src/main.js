import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/main.scss';
import './components/layout/header/header.js';
import './components/layout/nav/nav.js';
import './components/layout/footer/footer.js';
import './components/hero/hero-section.js';
import './components/timeline/timeline-section.js';
import './components/detailPanel/detailpanel-section.js';
import './components/faq/faq.js';
import './components/comparison/comparison.js';
import data from '../data/ev-car.json';
// import data from '../data/coffee-shop.json';
import { getTheme } from './core/themes.js';

document.title = data.meta?.title ?? document.title;
applyTheme(data.meta?.theme);

const header = document.querySelector('page-header');
const nav = document.querySelector('page-nav');
const hero = document.querySelector('hero-section');
const footer = document.querySelector('page-footer');
const timeline = document.querySelector('timeline-section');
const detailPanel = document.querySelector('detail-panel-section');
const faq = document.querySelector('faq-section');
const comparison = document.querySelector('comparison-section');

header.data = data;
nav.data = data.nav;
hero.data = data.hero;
footer.data = data;
timeline.data = { timeline: data.timeline, meta: data.meta };
detailPanel.data = data.details;
faq.data = data.faq;
comparison.data = data.comparison;

/**
 * @param {string} name
 */
function applyTheme(name) {
  const theme = getTheme(name);
  for (const [key, value] of Object.entries(theme)) {
    document.documentElement.style.setProperty(key, value);
  }
}