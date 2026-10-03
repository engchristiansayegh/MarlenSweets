import { boot, esc, paragraphs, emptyState, waLink } from '../layout.js';
import { getFaqs } from '../api.js';
import { t, pick } from '../i18n.js';
import { icon } from '../icons.js';

boot({
  page: 'faq',
  load: getFaqs,
  render: (faqs, s) => `
    <header class="page-header">
      <div class="container">
        <h1 class="page-title hero-in" style="--i:0">${t('faq.title')}</h1>
        <p class="page-sub hero-in" style="--i:1">${t('faq.sub')}</p>
      </div>
    </header>

    <section class="section section--tight">
      <div class="container faq-wrap">
        ${faqs.length ? `
        <div class="faq-list">
          ${faqs.map((f, i) => `
            <div class="faq" data-reveal style="--d:${i % 5}">
              <h2 class="faq-q">
                <button type="button" aria-expanded="false" aria-controls="faq-a-${i}" id="faq-q-${i}">
                  <span>${esc(pick(f, 'question'))}</span>
                  <span class="faq-toggle" aria-hidden="true"></span>
                </button>
              </h2>
              <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
                <div class="faq-a-inner">${paragraphs(pick(f, 'answer'))}</div>
              </div>
            </div>`).join('')}
        </div>` : emptyState(t('faq.empty'), '')}

        <div class="faq-more" data-reveal>
          <span class="faq-more-icon">${icon('whatsapp')}</span>
          <div>
            <h3>${t('faq.more')}</h3>
            <p>${t('faq.more_text')}</p>
          </div>
          <a class="btn btn--wa" href="${esc(waLink(s))}" target="_blank" rel="noopener">${icon('whatsapp')}<span>${t('cta.btn')}</span></a>
        </div>
      </div>
    </section>`,
  mount: (main) => {
    main.querySelectorAll('.faq-q button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        btn.closest('.faq').classList.toggle('is-open', open);
      });
    });
  },
});
