import { sb, q, remembered, forget } from '../sb.js';
import { ic, esc, toast, confirmDialog, friendlyError, busy, field, toggle, formData, slugify, pageHead, thumb, loadingView, errorView } from '../ui.js';
import { imageUrl, uploadImage, removeFiles, runLimited } from '../images.js';
import { multiImagePicker } from '../pickers.js';

const firstImage = (p) => (p.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.path;

/* =================================================================== list */
export const fetchCats = () => q(sb.from('categories').select('id,name_ar,sort_order').order('sort_order').order('created_at'));
export const fetchOccasions = () => q(sb.from('occasions').select('id,name_ar').order('sort_order').order('created_at'));
const fetchProds = () => q(sb.from('products')
  .select('id,slug,name_ar,name_en,category_id,is_featured,is_visible,sort_order,created_at,product_images(path,sort_order)')
  .order('sort_order').order('created_at', { ascending: false }));

export async function productsList(el) {
  el.innerHTML = loadingView();
  let cats, prods;
  // shown instantly from memory when coming back; refreshed quietly in the background
  const refresh = () => { if (el.isConnected && el.dataset.view === 'products') render(); };
  el.dataset.view = 'products';
  try {
    [cats, prods] = await Promise.all([
      remembered('cats', fetchCats, (d) => { cats = d; refresh(); }),
      remembered('prods', fetchProds, (d) => { prods = d; refresh(); }),
    ]);
  } catch (err) {
    el.innerHTML = errorView(err);
    return;
  }

  let search = '';

  const row = (p, i, group) => `
    <li class="row ${p.is_visible ? '' : 'is-hidden'}" data-id="${p.id}">
      <a class="row-main" href="#/products/${p.id}">
        ${thumb(imageUrl(firstImage(p), 'sm'), ic.image, imageUrl(firstImage(p)))}
        <span class="row-text">
          <strong>${esc(p.name_ar)}</strong>
          <small>${esc(p.name_en || '')}</small>
          <span class="badges">
            ${p.is_featured ? `<span class="badge badge--star">${ic.star}مميز</span>` : ''}
            ${p.is_visible ? '' : `<span class="badge">${ic.eyeOff}مخفي</span>`}
            ${(p.product_images || []).length ? '' : `<span class="badge badge--warn">${ic.image}بدون صور</span>`}
          </span>
        </span>
      </a>
      <div class="row-tools">
        <button class="icon-btn ${p.is_featured ? 'is-on' : ''}" data-act="feature" aria-label="${p.is_featured ? 'إلغاء التمييز' : 'تمييز في الرئيسية'}" title="مميز في الصفحة الرئيسية">${ic.star}</button>
        <button class="icon-btn" data-act="visible" aria-label="${p.is_visible ? 'إخفاء' : 'إظهار'}" title="${p.is_visible ? 'إخفاء عن الزوار' : 'إظهار للزوار'}">${p.is_visible ? ic.eye : ic.eyeOff}</button>
        ${search ? '' : `
        <button class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="تحريك للأعلى">${ic.up}</button>
        <button class="icon-btn" data-act="down" ${i === group.length - 1 ? 'disabled' : ''} aria-label="تحريك للأسفل">${ic.down}</button>`}
      </div>
    </li>`;

  const render = () => {
    const s = search.toLowerCase();
    const match = (p) => !s || p.name_ar.toLowerCase().includes(s) || (p.name_en || '').toLowerCase().includes(s);
    const groups = cats.map((c) => ({ c, items: prods.filter((p) => p.category_id === c.id && match(p)) }));
    const total = prods.length;
    el.innerHTML = `
      ${pageHead('المنتجات', { actions: `<a class="btn btn--primary" href="#/products/new">${ic.plus}<span>منتج جديد</span></a>` })}
      ${!cats.length ? `
        <div class="empty-box">${ic.grid}<p>أضيفي تصنيفًا أولًا (مثل شوكولا أو كاتو)، ثم أضيفي المنتجات داخله.</p>
          <a class="btn btn--primary" href="#/categories/new">${ic.plus}<span>إضافة تصنيف</span></a></div>` : `
      <div class="toolbar">
        <input class="search" type="search" placeholder="بحث عن منتج…" value="${esc(search)}" aria-label="بحث">
        <span class="muted">${total} منتج</span>
      </div>
      ${groups.map(({ c, items }) => (search && !items.length) ? '' : `
        <section class="group">
          <h2 class="group-title">${esc(c.name_ar)} <span class="muted">(${items.length})</span></h2>
          ${items.length ? `<ul class="rows">${items.map((p, i) => row(p, i, items)).join('')}</ul>`
            : `<p class="muted small">لا توجد منتجات في هذا التصنيف بعد.</p>`}
        </section>`).join('')}
      `}
      <a class="fab" href="#/products/new" aria-label="منتج جديد">${ic.plus}</a>`;

    const input = el.querySelector('.search');
    input?.addEventListener('input', () => {
      search = input.value.trim();
      const pos = input.selectionStart;
      render();
      const again = el.querySelector('.search');
      again.focus();
      again.setSelectionRange(pos, pos);
    });

    el.querySelectorAll('.row').forEach((li) => {
      const p = prods.find((x) => x.id === li.dataset.id);
      li.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act, p, b)));
    });
  };

  async function act(action, p, btn) {
    try {
      if (action === 'feature' || action === 'visible') {
        const key = action === 'feature' ? 'is_featured' : 'is_visible';
        const value = !p[key];
        btn.disabled = true;
        await q(sb.from('products').update({ [key]: value }).eq('id', p.id));
        p[key] = value;
        toast(action === 'feature'
          ? (value ? 'سيظهر المنتج في "منتجات مميزة" بالرئيسية' : 'تمت إزالة المنتج من المميزة')
          : (value ? 'المنتج ظاهر للزوار الآن' : 'تم إخفاء المنتج عن الزوار'));
        render();
      } else if (action === 'up' || action === 'down') {
        const group = prods.filter((x) => x.category_id === p.category_id);
        const i = group.indexOf(p);
        const j = action === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= group.length) return;
        [group[i], group[j]] = [group[j], group[i]];
        // renumber the whole category so the order is stable
        const updates = group.map((x, k) => ({ x, order: k + 1 })).filter(({ x, order }) => x.sort_order !== order);
        updates.forEach(({ x, order }) => { x.sort_order = order; });
        prods.sort((a, b) => a.sort_order - b.sort_order);
        render();
        await Promise.all(updates.map(({ x, order }) => q(sb.from('products').update({ sort_order: order }).eq('id', x.id))));
      }
    } catch (err) {
      toast(friendlyError(err), 'error');
      productsList(el);
    }
  }

  render();
}

/* =================================================================== edit / new */
export async function productEdit(el, id, ctx) {
  const isNew = id === 'new';
  el.innerHTML = loadingView();
  let cats, occasions, product;
  el.dataset.view = 'product-edit';
  try {
    [cats, occasions, product] = await Promise.all([
      remembered('cats', fetchCats),
      remembered('occasions', fetchOccasions),
      isNew ? null : q(sb.from('products')
        .select('*,product_images(id,path,sort_order),product_occasions(occasion_id)')
        .eq('id', id).maybeSingle()),
    ]);
  } catch (err) {
    el.innerHTML = errorView(err);
    return;
  }
  if (!isNew && !product) {
    el.innerHTML = `${pageHead('منتج غير موجود', { back: '#/products' })}<div class="empty-box">${ic.alert}<p>ربما تم حذف هذا المنتج.</p></div>`;
    return;
  }
  if (!cats.length) {
    el.innerHTML = `${pageHead('منتج جديد', { back: '#/products' })}
      <div class="empty-box">${ic.grid}<p>يجب إضافة تصنيف واحد على الأقل قبل إضافة المنتجات.</p>
      <a class="btn btn--primary" href="#/categories/new">${ic.plus}<span>إضافة تصنيف</span></a></div>`;
    return;
  }

  const p = product || { name_ar: '', name_en: '', description_ar: '', description_en: '', category_id: ctx.params.get('c') || '', is_visible: true, is_featured: false };
  const images = (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order);
  const selectedOcc = new Set((p.product_occasions || []).map((x) => x.occasion_id));

  el.innerHTML = `
    ${pageHead(isNew ? 'منتج جديد' : 'تعديل المنتج', {
      back: '#/products',
      actions: isNew ? '' : `<a class="btn btn--ghost btn--sm" href="../product.html?p=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">${ic.external}<span>عرض في الموقع</span></a>`,
    })}
    <form class="form" novalidate>
      <section class="card">
        <h2 class="card-title">${ic.image} الصور</h2>
        <div id="images"></div>
      </section>

      <section class="card">
        <h2 class="card-title">${ic.edit} المعلومات</h2>
        <div class="field">
          <label for="f-category_id">التصنيف <span class="req">*</span></label>
          <select id="f-category_id" name="category_id" required>
            <option value="">— اختاري التصنيف —</option>
            ${cats.map((c) => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${esc(c.name_ar)}</option>`).join('')}
          </select>
        </div>
        <div class="grid-2">
          ${field({ name: 'name_ar', label: 'الاسم بالعربي', value: p.name_ar, required: true, placeholder: 'مثال: كاتو لوتس' })}
          ${field({ name: 'name_en', label: 'الاسم بالإنجليزي', value: p.name_en, dir: 'ltr', placeholder: 'e.g. Lotus Gateau', hint: 'يظهر عند اختيار الزائر للغة الإنجليزية.' })}
        </div>
        <div class="grid-2">
          ${field({ name: 'description_ar', label: 'الوصف بالعربي', value: p.description_ar, type: 'textarea', placeholder: 'المكونات، الحجم، ما يميز المنتج…' })}
          ${field({ name: 'description_en', label: 'الوصف بالإنجليزي', value: p.description_en, type: 'textarea', dir: 'ltr' })}
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">${ic.heart} المناسبات</h2>
        ${occasions.length ? `
          <p class="muted small">اختاري المناسبات المناسبة لهذا المنتج (يمكن اختيار أكثر من واحدة):</p>
          <div class="check-chips">
            ${occasions.map((o) => `
              <label class="check-chip">
                <input type="checkbox" name="occasions" data-multi="1" value="${o.id}" ${selectedOcc.has(o.id) ? 'checked' : ''}>
                <span>${esc(o.name_ar)}</span>
              </label>`).join('')}
          </div>` : `<p class="muted small">لا توجد مناسبات بعد. <a href="#/occasions/new">إضافة مناسبة</a></p>`}
      </section>

      <section class="card">
        <h2 class="card-title">${ic.eye} الظهور</h2>
        ${toggle({ name: 'is_visible', label: 'ظاهر للزوار', checked: p.is_visible, hint: 'أطفئيه لإخفاء المنتج مؤقتًا دون حذفه.' })}
        ${toggle({ name: 'is_featured', label: 'منتج مميز', checked: p.is_featured, hint: 'يظهر في قسم "منتجات مميزة" في الصفحة الرئيسية.' })}
      </section>

      <div class="savebar">
        <button type="submit" class="btn btn--primary btn--lg">${ic.check}<span>${isNew ? 'إضافة المنتج' : 'حفظ التغييرات'}</span></button>
        ${isNew ? '' : `<button type="button" class="btn btn--ghost btn--danger-text" data-act="delete">${ic.trash}<span>حذف</span></button>`}
      </div>
    </form>`;

  const form = el.querySelector('form');
  const picker = multiImagePicker(images);
  picker.mount(el.querySelector('#images'));

  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('change', () => { dirty = true; });
  el.querySelector('#images').addEventListener('input', () => { dirty = true; });
  ctx.setDirtyCheck(() => dirty);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formData(form);
    if (!data.category_id) { toast('اختاري التصنيف أولًا.', 'error'); form.category_id.focus(); return; }
    if (!data.name_ar) { toast('اكتبي اسم المنتج بالعربي.', 'error'); form.name_ar.focus(); return; }
    const occ = [...form.querySelectorAll('input[name=occasions]:checked')].map((x) => x.value);
    const btn = form.querySelector('[type=submit]');

    // a new product gets its id here, so its photos can be uploaded before it is saved
    p.id ??= crypto.randomUUID();
    const pid = p.id;

    try {
      await busy(btn, 'جارٍ الحفظ…', async (setLabel) => {
        // 1) upload new photos, 3 at a time (already uploaded ones are skipped on a retry)
        const items = picker.items();
        const pending = items.filter((it) => it.file && !it.path);
        let done = 0;
        if (pending.length) setLabel(`جارٍ رفع الصور 0 من ${pending.length}…`);
        await runLimited(pending, 3, async (it) => {
          it.path = await uploadImage(`products/${pid}`, it.file);
          setLabel(`جارٍ رفع الصور ${++done} من ${pending.length}…`);
        });

        // 2) save details + occasions + photo list/order in ONE request
        setLabel('جارٍ الحفظ…');
        const { data: res, error } = await sb.rpc('admin_save_product', {
          p: {
            id: pid,
            slug: slugify(data.name_en || ''),
            category_id: data.category_id,
            name_ar: data.name_ar,
            name_en: data.name_en,
            description_ar: data.description_ar,
            description_en: data.description_en,
            is_visible: data.is_visible,
            is_featured: data.is_featured,
          },
          occ,
          images: items.map((it) => ({ id: it.id || null, path: it.path })),
          is_new: isNew,
        });
        if (error) {
          if (error.code === 'PGRST202') throw new Error('يجب تشغيل ملف migration-04.sql في Supabase أولًا (تحديث السرعة).');
          throw error;
        }
        p.slug = res.slug;
        p.product_occasions = occ.map((occasion_id) => ({ occasion_id }));

        // 3) delete files of removed photos (not urgent → don't wait for it)
        removeFiles(res.removed || []).catch(() => {});
        images.splice(0, images.length, ...res.images);
        if (!isNew) picker.reset(res.images);
      });
      dirty = false;
      forget('prods');
      toast(isNew ? 'تمت إضافة المنتج بنجاح 🎉' : 'تم حفظ التغييرات بنجاح');
      if (isNew) ctx.go(`#/products/${p.id}`, { replace: true });
    } catch (err) {
      toast(err.message?.startsWith('يجب') ? err.message : friendlyError(err), 'error', 9000);
    }
  });

  el.querySelector('[data-act=delete]')?.addEventListener('click', async (e) => {
    const delBtn = e.currentTarget;
    const ok = await confirmDialog(`حذف "${p.name_ar}" نهائيًا؟`, { ok: 'نعم، احذف', danger: true, detail: 'سيتم حذف المنتج وكل صوره. لا يمكن التراجع عن هذا. (لإخفائه مؤقتًا استخدمي خيار "ظاهر للزوار" بدل الحذف)' });
    if (!ok) return;
    try {
      await busy(delBtn, 'جارٍ الحذف…', async () => {
        await q(sb.from('products').delete().eq('id', p.id)); // photo rows go with it (cascade)
        removeFiles(images.map((x) => x.path)).catch(() => {});
      });
      dirty = false;
      forget('prods');
      toast('تم حذف المنتج');
      ctx.go('#/products');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });
}
