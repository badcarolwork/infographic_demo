import './components/layout/header.js';
import './components/layout/nav.js';
import './components/layout/footer.js';
import './components/hero/hero-section.js';
import './components/timeline/timeline-section.js';
import './components/detailPanel/detailpanel-section.js';
import './components/faq/faq.js';
import './components/comparison/comparison.js';
import data from '../data/ev-car.json';


document.title = data.meta?.title ?? document.title;

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
hero.data = { ...data.hero, theme: data.meta?.theme };
footer.data = data;
timeline.data = data.timeline;
detailPanel.data = data.details;
faq.data = { ...data.faq, theme: data.meta?.theme };
comparison.data = { ...data.comparison, theme: data.meta?.theme };