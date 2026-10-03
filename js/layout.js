// Shared layout for every public page: header, footer, loader, scroll-reveal,
// page transitions, language switching and small render helpers.
import { getSettings, imageUrl, setCacheMode, servedFromCache } from './api.js';
import { applyLang, getLang, setLang, t, pick, translateDom } from './i18n.js';
import { icon } from './icons.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------------------------------------------------------- helpers */

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Multi-line text from the admin → paragraphs
export function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');
}

export const productUrl = (p) => `/product.html?p=${encodeURIComponent(p.slug)}`;
export const categoryUrl = (c) => `/gallery.html?c=${encodeURIComponent(c.slug)}`;
export const occasionUrl = (o) => `/gallery.html?o=${encodeURIComponent(o.slug)}`;

export function formatPhone(num) {
  const d = String(num || '').replace(/\D/g, '');
  if (d.startsWith('963') && d.length === 12) return `+963 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return d ? `+${d}` : '';
}

export function waLink(settings, product) {
  const num = String(settings?.whatsapp || '').replace(/\D/g, '');
  if (!num) return '/contact.html';
  let text;
  if (product) {
    const tpl = pick(settings, 'whatsapp_message') || '{product}';
    text = `${tpl.replaceAll('{product}', pick(product, 'name'))}\n${location.origin}${productUrl(product)}`;
  } else {
    text = getLang() === 'ar' ? 'مرحبًا Marlen Sweets 🌸' : 'Hello Marlen Sweets 🌸';
  }
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function logo(extra = '') {
  return `<span class="logo ${extra}" role="img" aria-label="Marlen Sweets"></span>`;
}

// small: use the light copy (cards/lists); falls back to the full photo if no small copy exists
export function img(path, alt, { sizes = '', cls = '', eager = false, small = false } = {}) {
  if (!path) return `<div class="ph ${cls}" aria-hidden="true">${icon('cake')}</div>`;
  const src = imageUrl(path, small ? 'sm' : undefined);
  const fallback = small ? ` data-full="${esc(imageUrl(path))}"` : '';
  return `<img class="${cls}" src="${esc(src)}"${fallback} alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${sizes}>`;
}

// small copy missing (photo uploaded before small copies existed) → load the full photo instead
document.addEventListener('error', (e) => {
  const el = e.target;
  if (el.tagName === 'IMG' && el.dataset.full && el.src !== el.dataset.full) {
    el.src = el.dataset.full;
    delete el.dataset.full;
  }
}, true);

export function sectionHead(title, sub = '', link = null) {
  return `
    <div class="section-head" data-reveal>
      <div>
        <h2 class="section-title">${esc(title)}</h2>
        ${sub ? `<p class="section-sub">${esc(sub)}</p>` : ''}
      </div>
      ${link ? `<a class="link-arrow" href="${link.href}">${esc(link.label)} ${icon('arrow')}</a>` : ''}
    </div>`;
}

export function productCard(p, settings, i = 0) {
  const name = pick(p, 'name');
  const [first, second] = p.images || [];
  return `
    <article class="product-card" data-reveal style="--d:${i % 4}">
      <a class="product-media" href="${productUrl(p)}" aria-label="${esc(name)}">
        ${img(first, name, { small: true })}
        ${second ? img(second, '', { cls: 'img-alt', small: true }) : ''}
        ${p.images?.length > 1 ? `<span class="media-count">${p.images.length}</span>` : ''}
      </a>
      <div class="product-body">
        <h3 class="product-name"><a href="${productUrl(p)}">${esc(name)}</a></h3>
        <p class="product-desc">${esc(pick(p, 'description'))}</p>
        <div class="product-actions">
          <a class="btn btn--wa btn--sm" href="${esc(waLink(settings, p))}" target="_blank" rel="noopener">
            ${icon('whatsapp')}<span>${t('card.order')}</span>
          </a>
          <a class="link-arrow" href="${productUrl(p)}">${t('card.details')} ${icon('arrow')}</a>
        </div>
      </div>
    </article>`;
}

export function categoryCard(c, count, i = 0) {
  return `
    <a class="category-card" href="${categoryUrl(c)}" data-reveal style="--d:${i % 4}">
      <span class="category-media">${img(c.image_path, pick(c, 'name'), { small: true })}</span>
      <span class="category-info">
        <span class="category-name">${esc(pick(c, 'name'))}</span>
        <span class="category-count">${t('card.products', count || 0)}</span>
      </span>
      <span class="category-go" aria-hidden="true">${icon('arrow')}</span>
    </a>`;
}

export function occasionTile(o, i = 0) {
  return `
    <a class="occasion" href="${occasionUrl(o)}" style="--d:${i}">
      <span class="occasion-icon">${o.image_path ? img(o.image_path, '', { small: true }) : icon(o.icon)}</span>
      <span class="occasion-name">${esc(pick(o, 'name'))}</span>
    </a>`;
}

// Arabic letters can't join along a curved path, so the stamp is always in English
export const stampHtml = `
  <div class="stamp" aria-hidden="true">
    <svg viewBox="0 0 120 120">
      <defs><path id="stamp-circle" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0"/></defs>
      <text direction="ltr" textLength="276"><textPath href="#stamp-circle">HANDMADE • WITH LOVE • MARLEN SWEETS •</textPath></text>
    </svg>
    <span class="stamp-icon">${icon('heart')}</span>
  </div>`;

/**
 * Full-bleed photo header (home + about). Framing (focus point + zoom) comes from the admin.
 * Phone → photo on top fading down; laptop → photo beside the text fading towards it.
 */
export function photoHero({ path, x, y, zoom }, innerHtml, extraClass = '') {
  const fx = +(x ?? 50), fy = +(y ?? 50), z = +(zoom ?? 1);
  return `
    <section class="hero hero--photo ${extraClass}">
      <div class="hero-photo hero-in" style="--i:0">
        <div class="hero-photo-media">
          <img src="${esc(imageUrl(path))}" alt="" fetchpriority="high" decoding="async"
               style="object-position:${fx}% ${fy}%; transform-origin:${fx}% ${fy}%; --z:${z}">
        </div>
        ${stampHtml}
      </div>
      <div class="container hero-grid">${innerHtml}</div>
    </section>`;
}

export function emptyState(title, sub) {
  return `
    <div class="empty" data-reveal>
      <div class="empty-icon">${icon('cake')}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(sub)}</p>
    </div>`;
}

export function ctaBanner(settings) {
  return `
    <section class="section">
      <div class="container">
        <div class="cta" data-reveal="zoom">
          <div class="cta-deco" aria-hidden="true">${icon('sparkle')}</div>
          <div class="cta-text">
            <h2>${t('cta.title')}</h2>
            <p>${t('cta.text')}</p>
          </div>
          <a class="btn btn--wa btn--lg" href="${esc(waLink(settings))}" target="_blank" rel="noopener">
            ${icon('whatsapp')}<span>${t('cta.btn')}</span>
          </a>
        </div>
      </div>
    </section>`;
}

// Decorative cake shown in the hero until a hero photo is uploaded
export const cakeArt = `
<svg class="hero-art" viewBox="0 0 320 320" aria-hidden="true">
  <ellipse cx="160" cy="268" rx="118" ry="18" fill="var(--c-sand)"/>
  <rect x="96" y="262" width="128" height="10" rx="5" fill="var(--c-caramel)" opacity=".5"/>
  <path d="M62 170h196v84a14 14 0 0 1-14 14H76a14 14 0 0 1-14-14z" fill="var(--c-cream-2)"/>
  <path d="M62 170h196v22c-14 10-22-6-33 4s-20-6-33 4-20-8-32 2-20-6-33 2-20-8-32 0-19-4-33-8z" fill="var(--c-choco)"/>
  <path d="M62 214c20 8 40-6 65 2s50-6 65 2 45-6 66 0" fill="none" stroke="var(--c-rose)" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 13"/>
  <path d="M100 104h120v66H100z" fill="var(--c-cream-2)"/>
  <path d="M100 104h120v18c-10 8-16-4-24 3s-15-5-24 3-15-6-24 1-15-5-24 1-14-3-24-6z" fill="var(--c-choco)"/>
  <rect x="100" y="104" width="120" height="66" rx="4" fill="none" stroke="var(--c-sand)" stroke-width="2"/>
  <g class="art-cherries">
    <circle cx="136" cy="96" r="11" fill="var(--c-rose-deep)"/><circle cx="160" cy="92" r="12" fill="var(--c-rose-deep)"/><circle cx="184" cy="96" r="11" fill="var(--c-rose-deep)"/>
    <circle cx="132" cy="92" r="3" fill="#fff" opacity=".6"/><circle cx="156" cy="87" r="3" fill="#fff" opacity=".6"/><circle cx="180" cy="92" r="3" fill="#fff" opacity=".6"/>
    <path d="M160 80c2-10 8-16 16-18" stroke="var(--c-brown)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
  <g fill="var(--c-cream)">
    <circle cx="80" cy="176" r="9"/><circle cx="108" cy="178" r="9"/><circle cx="136" cy="176" r="9"/><circle cx="164" cy="178" r="9"/><circle cx="192" cy="176" r="9"/><circle cx="220" cy="178" r="9"/><circle cx="244" cy="176" r="9"/>
  </g>
</svg>`;

/* ---------------------------------------------------------------- header / footer */

const NAV = [
  { key: 'home', href: '/index.html' },
  { key: 'gallery', href: '/gallery.html' },
  { key: 'about', href: '/about.html' },
  { key: 'faq', href: '/faq.html' },
  { key: 'contact', href: '/contact.html' },
];

function headerHtml(page, settings) {
  return `
    <div class="container header-inner">
      <a class="brand" href="/index.html" aria-label="Marlen Sweets">${logo('logo--header')}</a>
      <nav class="nav" id="site-nav" aria-label="${t('nav.menu')}">
        <div class="nav-links">
          ${NAV.map((n) => `<a href="${n.href}" class="${n.key === page ? 'is-active' : ''}" ${n.key === page ? 'aria-current="page"' : ''}>${t(`nav.${n.key}`)}</a>`).join('')}
        </div>
        <a class="btn btn--wa nav-wa" href="${esc(waLink(settings))}" target="_blank" rel="noopener">${icon('whatsapp')}<span>${t('hero.cta_whatsapp')}</span></a>
      </nav>
      <div class="header-actions">
        <button class="lang-btn" type="button" aria-label="${t('lang.label')}">${icon('globe')}<span>${t('lang.switch')}</span></button>
        <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${t('nav.menu')}">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
    <div class="nav-backdrop"></div>`;
}

function footerHtml(settings) {
  const s = settings || {};
  const socials = [
    s.instagram_url && `<a href="${esc(s.instagram_url)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a>`,
    s.facebook_url && `<a href="${esc(s.facebook_url)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a>`,
    s.whatsapp && `<a href="${esc(waLink(s))}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>`,
    s.email && `<a href="mailto:${esc(s.email)}" aria-label="Email">${icon('mail')}</a>`,
  ].filter(Boolean).join('');
  const address = pick(s, 'address');
  return `
    <div class="footer-wave" aria-hidden="true"></div>
    <div class="container footer-grid">
      <div class="footer-brand">
        ${logo('logo--footer')}
        <p>${t('footer.tagline')}</p>
        ${socials ? `<div class="socials">${socials}</div>` : ''}
      </div>
      <div>
        <h3 class="footer-title">${t('footer.links')}</h3>
        <ul class="footer-links">
          ${NAV.map((n) => `<li><a href="${n.href}">${t(`nav.${n.key}`)}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <h3 class="footer-title">${t('footer.contact')}</h3>
        <ul class="footer-contact">
          ${s.whatsapp ? `<li>${icon('whatsapp')}<a href="${esc(waLink(s))}" target="_blank" rel="noopener" dir="ltr">${esc(formatPhone(s.whatsapp))}</a></li>` : ''}
          ${s.email ? `<li>${icon('mail')}<a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : ''}
          ${address ? `<li>${icon('pin')}<span>${esc(address)}</span></li>` : ''}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">© ${new Date().getFullYear()} Marlen Sweets — ${t('footer.rights')}</div>
    </div>`;
}

function bindHeader(header, onLang) {
  const menuBtn = header.querySelector('.menu-btn');
  const setOpen = (open) => {
    document.documentElement.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', t(open ? 'nav.close' : 'nav.menu'));
  };
  menuBtn.addEventListener('click', () => setOpen(!document.documentElement.classList.contains('nav-open')));
  header.querySelector('.nav-backdrop').addEventListener('click', () => setOpen(false));
  header.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  header.querySelector('.lang-btn').addEventListener('click', () => { setOpen(false); onLang(); });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.documentElement.classList.remove('nav-open');
});

// Header gets a solid background once the page scrolls
function watchScroll() {
  const header = document.querySelector('.site-header');
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/* ---------------------------------------------------------------- motion */

let observer;
export function reveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  observer ??= new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // once revealed, hover effects get their own snappy timing again
        const el = e.target;
        const done = (ev) => {
          if (ev.target !== el || ev.propertyName !== 'opacity') return;
          el.classList.add('reveal-done');
          el.removeEventListener('transitionend', done);
        };
        el.addEventListener('transitionend', done);
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => observer.observe(el));
}

// Fade images in once decoded
document.addEventListener('load', (e) => {
  if (e.target.tagName === 'IMG') e.target.classList.add('is-loaded');
}, true);
function markLoadedImages(root) {
  root.querySelectorAll('img').forEach((im) => { if (im.complete && im.naturalWidth) im.classList.add('is-loaded'); });
}

// Soft page transitions. Browsers with cross-document View Transitions use CSS only;
// others get a short fade-out before navigating.
const nativeVT = 'PageRevealEvent' in window;
document.addEventListener('click', (e) => {
  if (nativeVT || reduceMotion.matches) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.hash && url.pathname === location.pathname) return;
  e.preventDefault();
  document.documentElement.classList.add('is-leaving');
  setTimeout(() => { location.href = url.href; }, 220);
});
window.addEventListener('pageshow', () => document.documentElement.classList.remove('is-leaving'));

let loaderHidden = false;
function hideLoader(startedAt) {
  const loader = document.getElementById('loader');
  if (!loader || loaderHidden) return;
  loaderHidden = true;
  let seen = false;
  try { seen = !!sessionStorage.getItem('ms_seen'); sessionStorage.setItem('ms_seen', '1'); } catch { /* ignore */ }
  const minTime = seen || reduceMotion.matches ? 0 : 1400;
  const wait = Math.max(0, minTime - (performance.now() - startedAt));
  setTimeout(() => {
    document.documentElement.classList.add('is-ready');
    // header logo "writes" itself once; later redraws (language switch) only shimmer
    setTimeout(() => document.documentElement.classList.add('logo-drawn'), 2200);
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    setTimeout(() => loader.remove(), 1200);
  }, wait);
}

/* ---------------------------------------------------------------- boot */

/**
 * Starts a public page.
 * @param {object} opts
 * @param {string} opts.page      nav key of the current page
 * @param {() => Promise<any>} opts.load   fetches the page data (runs once)
 * @param {(data, settings) => string} opts.render  returns the <main> HTML (re-run on language change)
 * @param {(data, settings) => string} [opts.title]  document title
 * @param {(main, data, settings) => void} [opts.mount]  wires up interactive bits after each render
 */
export async function boot({ page, load, render, title, mount }) {
  const startedAt = performance.now();
  applyLang();
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const main = document.querySelector('main');
  const state = { settings: {}, data: null, error: null };
  let ready = false;

  const draw = () => {
    header.innerHTML = headerHtml(page, state.settings);
    bindHeader(header, switchLang);
    main.innerHTML = state.error
      ? `<section class="section"><div class="container">
           <div class="empty"><div class="empty-icon">${icon('cake')}</div>
             <h3>${t('error.load')}</h3>
             <button class="btn btn--primary" type="button" onclick="location.reload()">${t('error.retry')}</button>
           </div></div></section>`
      : render(state.data, state.settings);
    footer.innerHTML = footerHtml(state.settings);
    translateDom();
    const pageTitle = !state.error && title ? title(state.data, state.settings) : t(`nav.${page}`);
    document.title = pageTitle ? `${pageTitle} | Marlen Sweets` : 'Marlen Sweets';
    if (!state.error) mount?.(main, state.data, state.settings);
    markLoadedImages(document);
    reveal(document);
  };

  function switchLang() {
    const next = getLang() === 'ar' ? 'en' : 'ar';
    if (!ready) { // still loading: only the header needs to change for now
      setLang(next);
      header.innerHTML = headerHtml(page, state.settings);
      bindHeader(header, switchLang);
      return;
    }
    const swap = () => { setLang(next); draw(); };
    if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(swap);
    else swap();
  }

  header.innerHTML = headerHtml(page, {});
  bindHeader(header, switchLang);
  main.innerHTML = `<div class="page-loading" role="status">${icon('cake')}<span>${t('loading')}</span></div>`;
  // On a slow connection don't hold the splash screen forever
  const splashTimer = setTimeout(() => hideLoader(startedAt), 2500);
  setCacheMode('cache');
  try {
    const [settings, data] = await Promise.all([getSettings().catch(() => ({})), load()]);
    state.settings = settings;
    state.data = data;
  } catch (err) {
    console.error(err);
    state.error = err;
  }
  const fromCache = servedFromCache();
  clearTimeout(splashTimer);
  ready = true;
  draw();
  watchScroll();
  hideLoader(startedAt);

  // keep files + photos on the device for instant repeat visits (not on the local preview,
  // where it would hide your latest edits)
  if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('sw', e));
  }

  // Showed saved data from a previous visit → fetch fresh data and update quietly if it changed.
  if (fromCache || state.error) {
    setCacheMode('network');
    try {
      const [settings, data] = await Promise.all([getSettings(), load()]);
      if (state.error || JSON.stringify([settings, data]) !== JSON.stringify([state.settings, state.data])) {
        Object.assign(state, { settings, data, error: null });
        const root = document.documentElement;
        root.classList.add('no-intro', 'no-trans');
        draw();
        // what is already on screen stays put; the rest still reveals on scroll
        document.querySelectorAll('[data-reveal]').forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible', 'reveal-done');
        });
        void root.offsetHeight;
        root.classList.remove('no-trans');
      }
    } catch (err) {
      console.warn('refresh failed', err);
    }
  }
}
