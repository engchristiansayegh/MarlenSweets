import { boot, esc, cakeArt, stampHtml, photoHero, sectionHead, productCard, categoryCard, occasionTile, ctaBanner, waLink } from '../layout.js';
import { getCategories, getOccasions, getFeatured, getCategoryCounts, imageUrl } from '../api.js';
import { t, pick } from '../i18n.js';
import { icon } from '../icons.js';

function heroText(s) {
  return `
    <div class="hero-text">
      <span class="kicker hero-in" style="--i:0">${icon('heart')} ${t('hero.badge')}</span>
      <h1 class="hero-title hero-in" style="--i:1">${esc(pick(s, 'hero_title'))}</h1>
      <p class="hero-sub hero-in" style="--i:2">${esc(pick(s, 'hero_subtitle'))}</p>
      <div class="hero-actions hero-in" style="--i:3">
        <a class="btn btn--primary btn--lg" href="/gallery.html">${t('hero.cta_gallery')} ${icon('arrow')}</a>
        <a class="btn btn--ghost btn--lg" href="${esc(waLink(s))}" target="_blank" rel="noopener">${icon('whatsapp')}<span>${t('hero.cta_whatsapp')}</span></a>
      </div>
    </div>`;
}

function hero(data, s) {
  // A dedicated hero photo (uploaded in the admin) gets the full-bleed layout:
  // laptop → photo beside the text fading into beige; phone → photo on top fading down.
  if (s.hero_image_path) {
    return photoHero({ path: s.hero_image_path, x: s.hero_focus_x, y: s.hero_focus_y, zoom: s.hero_zoom }, heroText(s));
  }
  const heroImg = data.featured.find((p) => p.images[0])?.images[0];
  return `
  <section class="hero">
    <div class="hero-bg" aria-hidden="true">
      <span class="blob blob--1"></span><span class="blob blob--2"></span>
      <span class="sprinkle s1"></span><span class="sprinkle s2"></span><span class="sprinkle s3"></span><span class="sprinkle s4"></span><span class="sprinkle s5"></span>
    </div>
    <div class="container hero-grid">
      ${heroText(s)}
      <div class="hero-visual hero-in" style="--i:1">
        <div class="hero-arch ${heroImg ? '' : 'hero-arch--art'}">
          ${heroImg ? `<img src="${esc(imageUrl(heroImg))}" alt="" fetchpriority="high" decoding="async">` : cakeArt}
        </div>
        ${stampHtml}
        <span class="float-chip chip-1" aria-hidden="true">${icon('sparkle')}</span>
        <span class="float-chip chip-2" aria-hidden="true">${icon('cake')}</span>
      </div>
    </div>
  </section>`;
}

function occasionsStrip(occasions) {
  if (!occasions.length) return '';
  return `
  <section class="occasions-strip">
    <div class="container">
      <div class="occasions-card" data-reveal>
        <h2 class="visually-hidden">${t('sec.occasions')}</h2>
        <div class="occasions-row">
          ${occasions.map(occasionTile).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

boot({
  page: 'home',
  title: () => '',
  load: async () => {
    const [categories, occasions, featured, counts] = await Promise.all([
      getCategories(), getOccasions(), getFeatured(8), getCategoryCounts(),
    ]);
    return { categories, occasions, featured, counts };
  },
  render: (data, s) => `
    ${hero(data, s)}
    ${occasionsStrip(data.occasions)}

    <section class="section">
      <div class="container">
        ${sectionHead(t('sec.categories'), t('sec.categories_sub'), { href: '/gallery.html', label: t('sec.view_all') })}
        <div class="category-grid">
          ${data.categories.map((c, i) => categoryCard(c, data.counts[c.id], i)).join('')}
        </div>
      </div>
    </section>

    ${data.featured.length ? `
    <section class="section section--tint">
      <div class="container">
        ${sectionHead(t('sec.featured'), t('sec.featured_sub'), { href: '/gallery.html?all=1', label: t('sec.view_all') })}
        <div class="product-grid">
          ${data.featured.map((p, i) => productCard(p, s, i)).join('')}
        </div>
      </div>
    </section>` : ''}

    ${ctaBanner(s)}
  `,
});
