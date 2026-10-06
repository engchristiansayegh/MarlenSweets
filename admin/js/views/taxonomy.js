// Categories and occasions share one editor: name/description (ar+en), image, order, visibility.
import { sb, q, remembered, forget } from '../sb.js';
import { ic, esc, toast, confirmDialog, friendlyError, busy, field, toggle, formData, slugify, pageHead, thumb, loadingView, errorView } from '../ui.js';
import { imageUrl, uploadImage, removeFiles } from '../images.js';
import { singleImagePicker } from '../pickers.js';
import { icon, OCCASION_ICONS } from '../../../js/icons.js';

const CONF = {
  categories: {
    table: 'categories', route: '#/categories', title: 'التصنيفات', one: 'تصنيف', add: 'تصنيف جديد',
    countRel: 'products(count)', countLabel: 'منتج', hasIcon: false,
    placeholder: 'مثال: شوكولا', placeholderEn: 'e.g. Chocolate',
    intro: 'التصنيفات الرئيسية التي تظهر في المعرض (شوكولا، كاتو، كيك بوبس…). اضغطي على أي تصنيف لتعديله.',
  },
  occasions: {
    table: 'occasions', route: '#/occasions', title: 'المناسبات', one: 'مناسبة', add: 'مناسبة جديدة',
    countRel: 'product_occasions(count)', countLabel: 'منتج', hasIcon: true,
    placeholder: 'مثال: أعياد الميلاد', placeholderEn: 'e.g. Birthday',
    intro: 'المناسبات تظهر كأيقونات في الصفحة الرئيسية. يمكن ربط المنتج بأكثر من مناسبة من صفحة المنتج.',
  },
};

const ICON_NAMES = {
  birthday: 'عيد ميلاد', wedding: 'عرس', ring: 'خاتم', heart: 'قلب', kids: 'بالون', baby: 'مواليد',
  graduation: 'تخرج', gift: 'هدية', cake: 'كيك', sparkle: 'لمعة',
};

/* =================================================================== list */
export async function taxonomyList(el, kind) {
  const c = CONF[kind];
  el.innerHTML = loadingView();
  el.dataset.view = `tax-${kind}`;
  let rows;
  try {
    // instant from memory when coming back, refreshed quietly in the background
    rows = await remembered(`tax-${kind}`, () => q(sb.from(c.table).select(`*,${c.countRel}`).order('sort_order').order('created_at')),
      (d) => { rows = d; if (el.isConnected && el.dataset.view === `tax-${kind}`) render(); });
  } catch (err) {
    el.innerHTML = errorView(err);
    return;
  }
  const count = (r) => r[c.countRel.split('(')[0]]?.[0]?.count ?? 0;

  const render = () => {
    el.innerHTML = `
      ${pageHead(c.title, { actions: `<a class="btn btn--primary" href="${c.route}/new">${ic.plus}<span>${c.add}</span></a>` })}
      <p class="muted intro">${c.intro}</p>
      ${rows.length ? `
      <ul class="rows">
        ${rows.map((r, i) => `
          <li class="row ${r.is_visible ? '' : 'is-hidden'}" data-id="${r.id}">
            <a class="row-main" href="${c.route}/${r.id}">
              ${r.image_path || !c.hasIcon ? thumb(imageUrl(r.image_path, 'sm'), ic.image, imageUrl(r.image_path)) : `<span class="thumb thumb--icon">${icon(r.icon)}</span>`}
              <span class="row-text">
                <strong>${esc(r.name_ar)}</strong>
                <small>${esc(r.name_en || '')} · ${count(r)} ${c.countLabel}</small>
                ${r.is_visible ? '' : `<span class="badges"><span class="badge">${ic.eyeOff}مخفي</span></span>`}
              </span>
            </a>
            <div class="row-tools">
              <button class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="تحريك للأعلى">${ic.up}</button>
              <button class="icon-btn" data-act="down" ${i === rows.length - 1 ? 'disabled' : ''} aria-label="تحريك للأسفل">${ic.down}</button>
            </div>
          </li>`).join('')}
      </ul>` : `<div class="empty-box">${ic.grid}<p>لا يوجد شيء هنا بعد.</p></div>`}
      <a class="fab" href="${c.route}/new" aria-label="${c.add}">${ic.plus}</a>`;

    el.querySelectorAll('.row [data-act]').forEach((b) => b.addEventListener('click', async () => {
      const i = rows.findIndex((r) => r.id === b.closest('.row').dataset.id);
      const j = b.dataset.act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= rows.length) return;
      [rows[i], rows[j]] = [rows[j], rows[i]];
      const updates = rows.map((r, k) => ({ r, order: k + 1 })).filter(({ r, order }) => r.sort_order !== order);
      updates.forEach(({ r, order }) => { r.sort_order = order; });
      render();
      try {
        await Promise.all(updates.map(({ r, order }) => q(sb.from(c.table).update({ sort_order: order }).eq('id', r.id))));
      } catch (err) {
        toast(friendlyError(err), 'error');
        taxonomyList(el, kind);
      }
    }));
  };
  render();
}

/* =================================================================== edit / new */
export async function taxonomyEdit(el, kind, id, ctx) {
  const c = CONF[kind];
  const isNew = id === 'new';
  el.innerHTML = loadingView();
  let r;
  try {
    r = isNew ? null : await q(sb.from(c.table).select(`*,${c.countRel}`).eq('id', id).maybeSingle());
  } catch (err) {
    el.innerHTML = errorView(err);
    return;
  }
  if (!isNew && !r) {
    el.innerHTML = `${pageHead('غير موجود', { back: c.route })}<div class="empty-box">${ic.alert}<p>ربما تم حذف هذا العنصر.</p></div>`;
    return;
  }
  r ??= { name_ar: '', name_en: '', description_ar: '', description_en: '', is_visible: true, icon: 'cake', image_path: null };
  const productCount = r[c.countRel.split('(')[0]]?.[0]?.count ?? 0;

  el.innerHTML = `
    ${pageHead(isNew ? c.add : `تعديل ${c.one}`, {
      back: c.route,
      actions: isNew ? '' : `<a class="btn btn--ghost btn--sm" href="../gallery.html?${kind === 'categories' ? 'c' : 'o'}=${encodeURIComponent(r.slug)}" target="_blank" rel="noopener">${ic.external}<span>عرض في الموقع</span></a>`,
    })}
    <form class="form" novalidate>
      <section class="card">
        <h2 class="card-title">${ic.edit} المعلومات</h2>
        <div class="grid-2">
          ${field({ name: 'name_ar', label: 'الاسم بالعربي', value: r.name_ar, required: true, placeholder: c.placeholder })}
          ${field({ name: 'name_en', label: 'الاسم بالإنجليزي', value: r.name_en, dir: 'ltr', placeholder: c.placeholderEn })}
        </div>
        <div class="grid-2">
          ${field({ name: 'description_ar', label: 'وصف قصير بالعربي', value: r.description_ar, type: 'textarea', rows: 2, hint: 'اختياري — يظهر أعلى صفحة التصنيف.' })}
          ${field({ name: 'description_en', label: 'وصف قصير بالإنجليزي', value: r.description_en, type: 'textarea', rows: 2, dir: 'ltr' })}
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">${ic.image} ${c.hasIcon ? 'الأيقونة أو الصورة' : 'الصورة'}</h2>
        ${c.hasIcon ? `
          <span class="label">اختاري أيقونة</span>
          <div class="icon-grid">
            ${OCCASION_ICONS.map((k) => `
              <label class="icon-choice" title="${ICON_NAMES[k] || k}">
                <input type="radio" name="icon" value="${k}" ${r.icon === k ? 'checked' : ''}>
                <span>${icon(k)}<small>${ICON_NAMES[k] || k}</small></span>
              </label>`).join('')}
          </div>
          <p class="muted small">أو ارفعي صورة صغيرة بدل الأيقونة (اختياري):</p>` : ''}
        <div id="image"></div>
      </section>

      <section class="card">
        <h2 class="card-title">${ic.eye} الظهور</h2>
        ${toggle({ name: 'is_visible', label: 'ظاهر للزوار', checked: r.is_visible, hint: kind === 'categories' ? 'عند الإخفاء تختفي معه كل منتجاته من الموقع.' : '' })}
      </section>

      <div class="savebar">
        <button type="submit" class="btn btn--primary btn--lg">${ic.check}<span>${isNew ? 'إضافة' : 'حفظ التغييرات'}</span></button>
        ${isNew ? '' : `<button type="button" class="btn btn--ghost btn--danger-text" data-act="delete">${ic.trash}<span>حذف</span></button>`}
      </div>
    </form>`;

  const form = el.querySelector('form');
  const picker = singleImagePicker({
    path: r.image_path,
    label: c.hasIcon ? 'صورة (اختياري)' : `صورة ${c.one}`,
    hint: c.hasIcon ? 'إذا أضفتِ صورة ستظهر بدل الأيقونة داخل الدائرة.' : 'تظهر في بطاقة التصنيف. يفضّل صورة مربعة والحلوى في منتصفها.',
  });
  picker.mount(el.querySelector('#image'));

  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('change', () => { dirty = true; });
  ctx.setDirtyCheck(() => dirty);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formData(form);
    if (!data.name_ar) { toast('اكتبي الاسم بالعربي.', 'error'); form.name_ar.focus(); return; }
    const btn = form.querySelector('[type=submit]');
    try {
      let savedId = r.id;
      await busy(btn, 'جارٍ الحفظ…', async (setLabel) => {
        const row = {
          name_ar: data.name_ar, name_en: data.name_en,
          description_ar: data.description_ar, description_en: data.description_en,
          is_visible: data.is_visible,
        };
        if (c.hasIcon) row.icon = form.querySelector('input[name=icon]:checked')?.value || 'cake';

        const img = picker.state();
        let oldToDelete = null;
        if (img.file) {
          setLabel('جارٍ رفع الصورة…');
          row.image_path = await uploadImage(kind, img.file, { max: 1000 });
          oldToDelete = img.path;
        } else if (img.removed) {
          row.image_path = null;
          oldToDelete = img.path;
        }
        setLabel('جارٍ الحفظ…');

        if (isNew) {
          row.sort_order = Math.floor(Date.now() / 1000); // goes last; saves a round trip
          row.slug = slugify(data.name_en);
          let created;
          for (let attempt = 0; attempt < 3 && !created; attempt++) {
            const { data: d, error } = await sb.from(c.table).insert(row).select('id').single();
            if (error?.code === '23505') { row.slug = `${slugify(data.name_en)}-${Math.random().toString(36).slice(2, 6)}`; continue; }
            if (error) throw error;
            created = d;
          }
          if (!created) throw new Error('duplicate key');
          savedId = created.id;
        } else {
          await q(sb.from(c.table).update(row).eq('id', r.id));
        }
        if (oldToDelete) removeFiles([oldToDelete]).catch(() => {});
        if ('image_path' in row) { r.image_path = row.image_path; picker.commit(row.image_path); }
      });
      dirty = false;
      forget(`tax-${kind}`, kind === 'categories' ? 'cats' : 'occasions');
      toast(isNew ? `تمت إضافة ${c.one} بنجاح 🎉` : 'تم حفظ التغييرات بنجاح');
      if (isNew) ctx.go(`${c.route}/${savedId}`, { replace: true });
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });

  el.querySelector('[data-act=delete]')?.addEventListener('click', async (e) => {
    const delBtn = e.currentTarget;
    if (kind === 'categories' && productCount > 0) {
      toast(`لا يمكن حذف هذا التصنيف لأن فيه ${productCount} منتج. انقلي المنتجات إلى تصنيف آخر أو احذفيها أولًا، أو أخفي التصنيف بدل حذفه.`, 'error', 8000);
      return;
    }
    const ok = await confirmDialog(`حذف "${r.name_ar}" نهائيًا؟`, {
      ok: 'نعم، احذف', danger: true,
      detail: kind === 'occasions' && productCount ? `سيتم فك ارتباطها بـ ${productCount} منتج (المنتجات نفسها لن تُحذف).` : 'لا يمكن التراجع عن هذا.',
    });
    if (!ok) return;
    try {
      await busy(delBtn, 'جارٍ الحذف…', async () => {
        await q(sb.from(c.table).delete().eq('id', r.id));
        await removeFiles([r.image_path]);
      });
      dirty = false;
      forget(`tax-${kind}`, kind === 'categories' ? 'cats' : 'occasions');
      toast('تم الحذف');
      ctx.go(c.route);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });
}
