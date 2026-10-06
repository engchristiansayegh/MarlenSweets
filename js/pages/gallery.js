import { boot, esc, productCard, categoryCard, occasionTile, emptyState, ctaBanner, categoryUrl, occasionUrl } from '../layout.js';
import { getCategories, getOccasions, getProducts, getCategoryCounts } from '../api.js';
import { t, pick } from '../i18n.js';
import { icon } from '../icons.js';

const params = new URLSearchParams(location.search);
const catSlug = params.get('c');
const occSlug = params.get('o');
const showAll = params.has('all');

function chips(items, active, urlFn, allHref) {
  return `
    <div class="chips" data-reveal>
      <a class="chip ${active ? '' : 'is-active'}" href="${allHref}">${t('gallery.all')}</a>
      ${items.map((it) => `<a class="chip ${active?.id === it.id ? 'is-active' : ''}" href="${urlFn(it)}" ${active?.id === it.id ? 'aria-current="page"' : ''}>${esc(pick(it, 'name'))}</a>`).join('')}
    </div>`;
}

function pageHeader(title, sub, crumbs = []) {
  return `
    <header class="page-header">
      <div class="container">
        ${crumbs.length ? `<nav class="breadcrumb" aria-label="breadcrumb">${crumbs.map((c) => c.href ? `<a href="${c.href}">${esc(c.label)}</a>` : `<span aria-current="page">${esc(c.label)}</span>`).join(icon('chevron'))}</nav>` : ''}
        <h1 class="page-title hero-in" style="--i:0">${esc(title)}</h1>
        ${sub ? `<p class="page-sub hero-in" style="--i:1">${esc(sub)}</p>` : ''}
      </div>
    </header>`;
}

function productsSection(products, s) {
  return products.length
    ? `<div class="product-grid">${products.map((p, i) => productCard(p, s, i)).join('')}</div>`
    : emptyState(t('gallery.empty'), t('gallery.empty_sub'));
}

boot({
  page: 'gallery',
  title: (d) => (d.category ? pick(d.category, 'name') : d.occasion ? pick(d.occasion, 'name') : t('gallery.title')),
  load: async () => {
    const [categories, occasions, counts] = await Promise.all([getCategories(), getOccasions(), getCategoryCounts()]);
    const category = catSlug ? categories.find((c) => c.slug === catSlug) : null;
    const occasion = occSlug ? occasions.find((o) => o.slug === occSlug) : null;
    let products = null;
    if (category) products = await getProducts({ categoryId: category.id });
    else if (occasion) products = await getProducts({ occasionId: occasion.id });
    else if (showAll || catSlug || occSlug) products = await getProducts();
    return { categories, occasions, counts, category, occasion, products };
  },
  render: (d, s) => {
    const home = { href: 'index.html', label: t('nav.home') };
    const gallery = { href: 'gallery.html', label: t('gallery.title') };

    // Category or occasion page
    if (d.category || d.occasion) {
      const item = d.category || d.occasion;
      const list = d.category ? d.categories : d.occasions;
      const urlFn = d.category ? categoryUrl : occasionUrl;
      return `
        ${pageHeader(pick(item, 'name'), pick(item, 'description'), [home, gallery, { label: pick(item, 'name') }])}
        <section class="section section--tight">
          <div class="container">
            ${chips(list, item, urlFn, 'gallery.html?all=1')}
            ${productsSection(d.products, s)}
          </div>
        </section>
        ${ctaBanner(s)}`;
    }

    // All products
    if (d.products) {
      return `
        ${pageHeader(t('gallery.all'), t('gallery.sub'), [home, gallery, { label: t('gallery.all') }])}
        <section class="section section--tight">
          <div class="container">
            ${chips(d.categories, null, categoryUrl, 'gallery.html?all=1')}
            ${productsSection(d.products, s)}
          </div>
        </section>
        ${ctaBanner(s)}`;
    }

    // Gallery index: categories + occasions
    return `
      ${pageHeader(t('gallery.title'), t('gallery.sub'))}
      <section class="section section--tight">
        <div class="container">
          <div class="section-head" data-reveal>
            <div><h2 class="section-title">${t('gallery.categories')}</h2></div>
            <a class="link-arrow" href="gallery.html?all=1">${t('gallery.all')} ${icon('arrow')}</a>
          </div>
          <div class="category-grid">
            ${d.categories.map((c, i) => categoryCard(c, d.counts[c.id], i)).join('')}
          </div>
        </div>
      </section>
      ${d.occasions.length ? `
      <section class="section section--tint">
        <div class="container">
          <div class="section-head" data-reveal><div>
            <h2 class="section-title">${t('gallery.occasions')}</h2>
            <p class="section-sub">${t('sec.occasions_sub')}</p>
          </div></div>
          <div class="occasion-grid" data-reveal>
            ${d.occasions.map(occasionTile).join('')}
          </div>
        </div>
      </section>` : ''}
      ${ctaBanner(s)}`;
  },
});
