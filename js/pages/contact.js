import { boot, esc, waLink, formatPhone } from '../layout.js';
import { t, pick } from '../i18n.js';
import { icon } from '../icons.js';

function card({ href, iconName, title, text, extra = '', i, external = true }) {
  const tag = href ? 'a' : 'div';
  const attrs = href ? `href="${esc(href)}" ${external ? 'target="_blank" rel="noopener"' : ''}` : '';
  return `
    <${tag} class="contact-card ${extra}" ${attrs} data-reveal style="--d:${i}">
      <span class="contact-icon">${icon(iconName)}</span>
      <span class="contact-body">
        <span class="contact-title">${esc(title)}</span>
        <span class="contact-text">${text}</span>
      </span>
      ${href ? `<span class="contact-go" aria-hidden="true">${icon('arrow')}</span>` : ''}
    </${tag}>`;
}

boot({
  page: 'contact',
  load: async () => null,
  render: (_, s) => {
    const cards = [];
    if (s.whatsapp) cards.push({ href: waLink(s), iconName: 'whatsapp', title: t('contact.whatsapp'), text: `<span dir="ltr">${esc(formatPhone(s.whatsapp))}</span> · ${t('contact.whatsapp_text')}`, extra: 'contact-card--wa' });
    const igHandle = (s.instagram_url || '').match(/instagram\.com\/([^/?#]+)/i)?.[1];
    if (s.instagram_url) cards.push({ href: s.instagram_url, iconName: 'instagram', title: t('contact.instagram'), text: igHandle ? `<span dir="ltr">@${esc(igHandle)}</span> · ${t('contact.follow')}` : t('contact.follow') });
    if (s.facebook_url) cards.push({ href: s.facebook_url, iconName: 'facebook', title: t('contact.facebook'), text: `<span dir="ltr">Marlen Sweets</span> · ${t('contact.follow')}` });
    if (s.email) cards.push({ href: `mailto:${s.email}`, iconName: 'mail', title: t('contact.email'), text: esc(s.email), external: false });
    const address = pick(s, 'address');
    if (address) cards.push({ iconName: 'pin', title: t('contact.address'), text: esc(address) });

    return `
      <header class="page-header">
        <div class="container">
          <h1 class="page-title hero-in" style="--i:0">${t('contact.title')}</h1>
          <p class="page-sub hero-in" style="--i:1">${t('contact.sub')}</p>
        </div>
      </header>
      <section class="section section--tight">
        <div class="container">
          <div class="contact-grid">
            ${cards.map((c, i) => card({ ...c, i })).join('')}
          </div>
        </div>
      </section>`;
  },
});
