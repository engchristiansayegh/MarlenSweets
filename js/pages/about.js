import { boot, cakeArt, paragraphs, ctaBanner, photoHero } from '../layout.js';
import { t, pick } from '../i18n.js';
import { icon } from '../icons.js';

const values = [
  { icon: 'hand', title: 'about.v1', text: 'about.v1_text' },
  { icon: 'leaf', title: 'about.v2', text: 'about.v2_text' },
  { icon: 'sparkle', title: 'about.v3', text: 'about.v3_text' },
];

function intro(s) {
  // with a background photo (chosen in the admin) → photo header like the home page
  if (s.about_image_path) {
    return `
      ${photoHero({ path: s.about_image_path, x: s.about_focus_x, y: s.about_focus_y, zoom: s.about_zoom }, `
        <div class="hero-text">
          <span class="kicker hero-in" style="--i:0">${icon('heart')} ${t('about.kicker')}</span>
          <h1 class="hero-title hero-in" style="--i:1">${t('about.title')}</h1>
          <p class="hero-sub hero-in" style="--i:2">${t('about.sub')}</p>
        </div>`, 'hero--about')}
      <section class="section">
        <div class="container">
          <div class="prose prose--center" data-reveal>${paragraphs(pick(s, 'about'))}</div>
        </div>
      </section>`;
  }
  return `
    <header class="page-header">
      <div class="container">
        <h1 class="page-title hero-in" style="--i:0">${t('about.title')}</h1>
      </div>
    </header>
    <section class="section section--tight">
      <div class="container about-grid">
        <div class="about-visual" data-reveal="zoom">
          <div class="about-arch">${cakeArt}</div>
          <span class="float-chip chip-1" aria-hidden="true">${icon('heart')}</span>
          <span class="float-chip chip-2" aria-hidden="true">${icon('sparkle')}</span>
        </div>
        <div class="about-text" data-reveal>
          <span class="kicker">${icon('heart')} ${t('about.kicker')}</span>
          <div class="prose">${paragraphs(pick(s, 'about'))}</div>
        </div>
      </div>
    </section>`;
}

boot({
  page: 'about',
  load: async () => null,
  render: (_, s) => `
    ${intro(s)}

    <section class="section section--tint">
      <div class="container">
        <div class="values">
          ${values.map((v, i) => `
            <div class="value" data-reveal style="--d:${i}">
              <span class="value-icon">${icon(v.icon)}</span>
              <h3>${t(v.title)}</h3>
              <p>${t(v.text)}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    ${ctaBanner(s)}
  `,
});
