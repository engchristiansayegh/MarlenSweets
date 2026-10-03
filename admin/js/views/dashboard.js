import { sb, remembered } from '../sb.js';
import { ic, pageHead } from '../ui.js';

async function count(table, filter) {
  let qb = sb.from(table).select('*', { count: 'exact', head: true });
  if (filter) qb = filter(qb);
  const { count: n, error } = await qb;
  return error ? '—' : n;
}

export async function dashboard(el) {
  const tiles = [
    { key: 'products', label: 'منتج', icon: ic.box, href: '#/products' },
    { key: 'categories', label: 'تصنيف', icon: ic.grid, href: '#/categories' },
    { key: 'occasions', label: 'مناسبة', icon: ic.heart, href: '#/occasions' },
    { key: 'faqs', label: 'سؤال', icon: ic.help, href: '#/faqs' },
  ];
  el.innerHTML = `
    ${pageHead('أهلًا مارلين 🌸')}
    <div class="stats">
      ${tiles.map((t) => `
        <a class="stat" href="${t.href}">
          <span class="stat-icon">${t.icon}</span>
          <strong data-count="${t.key}"><span class="spinner"></span></strong>
          <span>${t.label}</span>
        </a>`).join('')}
    </div>

    <div class="notice" id="no-images" hidden>
      ${ic.image}
      <div><strong>منتجات بدون صور</strong><p><span data-count="noimg"></span> منتج لا يحتوي على صور بعد. أضيفي صورًا لتظهر بشكل أجمل.</p></div>
      <a class="btn btn--ghost btn--sm" href="#/products">عرض</a>
    </div>

    <h2 class="section-label">إجراءات سريعة</h2>
    <div class="quick">
      <a class="quick-item" href="#/products/new">${ic.plus}<span>إضافة منتج</span></a>
      <a class="quick-item" href="#/categories/new">${ic.grid}<span>إضافة تصنيف</span></a>
      <a class="quick-item" href="#/restore">${ic.image}<span>أدوات الصور</span></a>
      <a class="quick-item" href="/" target="_blank" rel="noopener">${ic.external}<span>فتح الموقع</span></a>
    </div>

    <div class="tip">
      <strong>💡 نصائح</strong>
      <ul>
        <li>لإخفاء منتج مؤقتًا (مثلًا غير متوفر) استخدمي زر العين بدل حذفه.</li>
        <li>النجمة ⭐ تجعل المنتج يظهر في "منتجات مميزة" بالصفحة الرئيسية.</li>
        <li>الصور تُصغَّر تلقائيًا قبل الرفع، يمكنك رفع صور الكاميرا مباشرة.</li>
        <li>بعد أي تعديل قد يحتاج الموقع لحظات حتى يظهر التغيير عند الزوار.</li>
      </ul>
    </div>`;

  const set = (key, v) => el.querySelectorAll(`[data-count="${key}"]`).forEach((n) => { n.textContent = v; });
  const show = (st) => {
    tiles.forEach((t) => set(t.key, st[t.key] ?? '—'));
    if (st.no_images) { set('noimg', st.no_images); el.querySelector('#no-images').hidden = false; }
  };

  // all numbers in one request (migration-04); older databases fall back to one request per number
  const st = await remembered('stats', async () => {
    const { data, error } = await sb.rpc('admin_stats');
    if (!error) return data;
    const out = {};
    await Promise.all(tiles.map(async (t) => { out[t.key] = await count(t.key); }));
    return out;
  }, (fresh) => { if (el.isConnected) show(fresh); }).catch(() => ({}));
  if (el.isConnected) show(st);
}
