import { boot, esc, img, paragraphs, productCard, sectionHead, emptyState, waLink, categoryUrl, occasionUrl } from '../layout.js';
import { getProduct, getProducts, getCategories, imageUrl, isCacheMode, peekProduct, cacheOnly, markStale } from '../api.js';
import { t, pick } from '../i18n.js';
import { icon } from '../icons.js';

const slug = new URLSearchParams(location.search).get('p') || '';

function galleryHtml(p) {
  const name = pick(p, 'name');
  if (!p.images.length) {
    return `<div class="pg"><div class="pg-main pg-main--empty">${img(null, name)}</div></div>`;
  }
  const many = p.images.length > 1;
  return `
    <div class="pg" data-reveal="fade">
      <div class="pg-main">
        <div class="pg-track" tabindex="0" aria-roledescription="carousel" aria-label="${esc(name)}">
          ${p.images.map((path, i) => `
            <figure class="pg-slide" aria-label="${i + 1} / ${p.images.length}">
              ${img(path, `${name} ${i + 1}`, { eager: i === 0 })}
            </figure>`).join('')}
        </div>
        <button class="pg-zoom" type="button" aria-label="${t('product.zoom')}">${icon('zoom')}</button>
        ${many ? `
          <button class="pg-nav pg-prev" type="button" aria-label="${t('product.prev')}">${icon('chevronBack')}</button>
          <button class="pg-nav pg-next" type="button" aria-label="${t('product.next')}">${icon('chevron')}</button>
          <div class="pg-dots" aria-hidden="true">${p.images.map((_, i) => `<span class="${i ? '' : 'is-active'}"></span>`).join('')}</div>` : ''}
      </div>
      ${many ? `
      <div class="pg-thumbs">
        ${p.images.map((path, i) => `
          <button type="button" class="pg-thumb ${i ? '' : 'is-active'}" aria-label="${i + 1}">
            <img src="${esc(imageUrl(path, 'sm'))}" data-full="${esc(imageUrl(path))}" alt="" loading="lazy" decoding="async">
          </button>`).join('')}
      </div>` : ''}
    </div>
    <dialog class="lightbox" aria-label="${esc(name)}">
      <img alt="">
      <button class="lb-close" type="button" aria-label="${t('nav.close')}">${icon('close')}</button>
      ${many ? `
        <button class="lb-nav lb-prev" type="button" aria-label="${t('product.prev')}">${icon('chevronBack')}</button>
        <button class="lb-nav lb-next" type="button" aria-label="${t('product.next')}">${icon('chevron')}</button>` : ''}
      <span class="lb-count"></span>
    </dialog>`;
}

function mountGallery(root, p) {
  const track = root.querySelector('.pg-track');
  if (!track) return;
  const slides = [...track.children];
  const dots = [...root.querySelectorAll('.pg-dots span')];
  const thumbs = [...root.querySelectorAll('.pg-thumb')];
  const rtl = () => document.documentElement.dir === 'rtl';
  let index = 0;

  const setActive = (i) => {
    index = i;
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    thumbs.forEach((b, k) => b.classList.toggle('is-active', k === i));
    thumbs[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };
  const go = (i) => {
    const n = slides.length;
    const target = (i + n) % n;
    track.scrollTo({ left: (rtl() ? -1 : 1) * target * track.clientWidth, behavior: 'smooth' });
    setActive(target);
  };

  let raf;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const i = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
      if (i !== index) setActive(Math.min(i, slides.length - 1));
    });
  }, { passive: true });

  root.querySelector('.pg-prev')?.addEventListener('click', () => go(index - 1));
  root.querySelector('.pg-next')?.addEventListener('click', () => go(index + 1));
  thumbs.forEach((b, i) => b.addEventListener('click', () => go(i)));
  track.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const forward = (e.key === 'ArrowRight') !== rtl();
    go(index + (forward ? 1 : -1));
  });

  // Lightbox
  const lb = root.querySelector('.lightbox');
  const lbImg = lb.querySelector('img');
  const lbCount = lb.querySelector('.lb-count');
  const show = (i) => {
    const n = p.images.length;
    const k = (i + n) % n;
    lbImg.src = imageUrl(p.images[k]);
    lbImg.alt = `${pick(p, 'name')} ${k + 1}`;
    lbCount.textContent = n > 1 ? `${k + 1} / ${n}` : '';
    lb.dataset.i = k;
  };
  const open = () => { show(index); lb.showModal(); };
  root.querySelector('.pg-zoom').addEventListener('click', open);
  slides.forEach((s) => s.addEventListener('click', open));
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.querySelector('.lb-prev')?.addEventListener('click', () => show(+lb.dataset.i - 1));
  lb.querySelector('.lb-next')?.addEventListener('click', () => show(+lb.dataset.i + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const forward = (e.key === 'ArrowRight') !== rtl();
    show(+lb.dataset.i + (forward ? 1 : -1));
  });
  lb.addEventListener('close', () => go(+lb.dataset.i || 0));
}

boot({
  page: 'gallery',
  title: (d) => (d.product ? pick(d.product, 'name') : t('product.notfound')),
  load: async () => {
    // Opened from a list on an earlier page → draw instantly from what we already know,
    // boot() then fetches the full details (occasions, fresh images) in the background.
    const seed = isCacheMode() && slug ? peekProduct(slug) : null;
    if (seed) {
      try {
        return await cacheOnly(loadFull);
      } catch {
        markStale();
        const cats = await cacheOnly(getCategories).catch(() => []);
        const related = await cacheOnly(() => getProducts({ categoryId: seed.category_id })).catch(() => []);
        return {
          product: { ...seed, category: cats.find((c) => c.id === seed.category_id) || null, occasions: [] },
          related: related.filter((r) => r.id !== seed.id).slice(0, 4),
        };
      }
    }
    return loadFull();
  },
  render: renderPage,
  mount: (main, d) => { if (d.product) mountGallery(main, d.product); },
});

async function loadFull() {
  const product = slug ? await getProduct(slug) : null;
  let related = [];
  if (product) {
    related = (await getProducts({ categoryId: product.category_id }))
      .filter((r) => r.id !== product.id)
      .slice(0, 4);
  }
  return { product, related };
}

function renderPage({ product: p, related }, s) {
  {
    if (!p) {
      return `
        <section class="section">
          <div class="container">
            ${emptyState(t('product.notfound'), t('product.notfound_sub'))}
            <p class="center"><a class="btn btn--primary" href="gallery.html">${t('product.back')}</a></p>
          </div>
        </section>`;
    }
    const name = pick(p, 'name');
    return `
      <section class="section product-page">
        <div class="container">
          <nav class="breadcrumb" aria-label="breadcrumb">
            <a href="index.html">${t('nav.home')}</a>${icon('chevron')}
            <a href="gallery.html">${t('gallery.title')}</a>${icon('chevron')}
            ${p.category ? `<a href="${categoryUrl(p.category)}">${esc(pick(p.category, 'name'))}</a>${icon('chevron')}` : ''}
            <span aria-current="page">${esc(name)}</span>
          </nav>
          <div class="product-layout">
            ${galleryHtml(p)}
            <div class="pinfo">
              ${p.category ? `<a class="kicker hero-in" style="--i:0" href="${categoryUrl(p.category)}">${esc(pick(p.category, 'name'))}</a>` : ''}
              <h1 class="pinfo-title hero-in" style="--i:1">${esc(name)}</h1>
              <div class="pinfo-desc hero-in" style="--i:2">${paragraphs(pick(p, 'description'))}</div>
              ${p.occasions.length ? `
                <div class="pinfo-occasions hero-in" style="--i:3">
                  <span class="pinfo-label">${t('product.occasions')}</span>
                  <div class="chips chips--small">
                    ${p.occasions.map((o) => `<a class="chip" href="${occasionUrl(o)}">${icon(o.icon)}${esc(pick(o, 'name'))}</a>`).join('')}
                  </div>
                </div>` : ''}
              <div class="pinfo-order hero-in" style="--i:4">
                <a class="btn btn--wa btn--lg btn--block" href="${esc(waLink(s, p))}" target="_blank" rel="noopener">
                  ${icon('whatsapp')}<span>${t('product.order')}</span>
                </a>
                <p class="pinfo-note">${icon('sparkle')} ${t('product.note')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      ${related.length ? `
      <section class="section section--tint">
        <div class="container">
          ${sectionHead(t('product.related'), '', p.category ? { href: categoryUrl(p.category), label: t('sec.view_all') } : null)}
          <div class="product-grid">${related.map((r, i) => productCard(r, s, i)).join('')}</div>
        </div>
      </section>` : ''}
      <div class="sticky-order">
        <a class="btn btn--wa btn--block" href="${esc(waLink(s, p))}" target="_blank" rel="noopener">${icon('whatsapp')}<span>${t('product.order')}</span></a>
      </div>`;
  }
}
