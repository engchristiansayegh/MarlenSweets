import { sb, q, remembered } from '../sb.js';
import { ic, esc, toast, confirmDialog, friendlyError, busy, field, toggle, formData, pageHead, loadingView, errorView } from '../ui.js';

export async function faqsView(el) {
  el.innerHTML = loadingView();
  let rows;
  try {
    el.dataset.view = 'faqs';
    rows = await remembered('faqs', () => q(sb.from('faqs').select('*').order('sort_order').order('created_at')),
      (d) => { rows = d; if (el.isConnected && el.dataset.view === 'faqs') render(); });
  } catch (err) {
    el.innerHTML = errorView(err);
    return;
  }

  const render = () => {
    el.innerHTML = `
      ${pageHead('الأسئلة الشائعة', { actions: `<button class="btn btn--primary" type="button" data-act="new">${ic.plus}<span>سؤال جديد</span></button>` })}
      <p class="muted intro">تظهر في صفحة "الأسئلة الشائعة". اضغطي على أي سؤال لتعديله.</p>
      ${rows.length ? `
      <ul class="rows">
        ${rows.map((r, i) => `
          <li class="row ${r.is_visible ? '' : 'is-hidden'}" data-id="${r.id}">
            <button class="row-main" type="button" data-act="edit">
              <span class="thumb thumb--icon">${ic.help}</span>
              <span class="row-text">
                <strong>${esc(r.question_ar)}</strong>
                <small class="clamp">${esc(r.answer_ar)}</small>
                ${r.is_visible ? '' : `<span class="badges"><span class="badge">${ic.eyeOff}مخفي</span></span>`}
              </span>
            </button>
            <div class="row-tools">
              <button class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="تحريك للأعلى">${ic.up}</button>
              <button class="icon-btn" data-act="down" ${i === rows.length - 1 ? 'disabled' : ''} aria-label="تحريك للأسفل">${ic.down}</button>
            </div>
          </li>`).join('')}
      </ul>` : `<div class="empty-box">${ic.help}<p>لا توجد أسئلة بعد.</p></div>`}
      <button class="fab" type="button" data-act="new" aria-label="سؤال جديد">${ic.plus}</button>`;

    el.querySelectorAll('[data-act=new]').forEach((b) => b.addEventListener('click', () => editor(null)));
    el.querySelectorAll('.row').forEach((li) => {
      const r = rows.find((x) => x.id === li.dataset.id);
      li.querySelector('[data-act=edit]').addEventListener('click', () => editor(r));
      li.querySelectorAll('[data-act=up],[data-act=down]').forEach((b) => b.addEventListener('click', () => move(r, b.dataset.act === 'up' ? -1 : 1)));
    });
  };

  async function move(r, dir) {
    const i = rows.indexOf(r);
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    const updates = rows.map((x, k) => ({ x, order: k + 1 })).filter(({ x, order }) => x.sort_order !== order);
    updates.forEach(({ x, order }) => { x.sort_order = order; });
    render();
    try {
      await Promise.all(updates.map(({ x, order }) => q(sb.from('faqs').update({ sort_order: order }).eq('id', x.id))));
    } catch (err) {
      toast(friendlyError(err), 'error');
      faqsView(el);
    }
  }

  function editor(r) {
    const isNew = !r;
    r ??= { question_ar: '', question_en: '', answer_ar: '', answer_en: '', is_visible: true };
    const d = document.createElement('dialog');
    d.className = 'sheet';
    d.innerHTML = `
      <form class="form" method="dialog" novalidate>
        <div class="sheet-head">
          <h2>${isNew ? 'سؤال جديد' : 'تعديل السؤال'}</h2>
          <button type="button" class="icon-btn" data-act="close" aria-label="إغلاق">${ic.close}</button>
        </div>
        ${field({ name: 'question_ar', label: 'السؤال بالعربي', value: r.question_ar, required: true })}
        ${field({ name: 'answer_ar', label: 'الجواب بالعربي', value: r.answer_ar, type: 'textarea', rows: 4 })}
        ${field({ name: 'question_en', label: 'السؤال بالإنجليزي', value: r.question_en, dir: 'ltr' })}
        ${field({ name: 'answer_en', label: 'الجواب بالإنجليزي', value: r.answer_en, type: 'textarea', rows: 4, dir: 'ltr' })}
        ${toggle({ name: 'is_visible', label: 'ظاهر للزوار', checked: r.is_visible })}
        <div class="savebar savebar--sheet">
          <button type="submit" class="btn btn--primary">${ic.check}<span>${isNew ? 'إضافة' : 'حفظ'}</span></button>
          ${isNew ? '' : `<button type="button" class="btn btn--ghost btn--danger-text" data-act="delete">${ic.trash}<span>حذف</span></button>`}
        </div>
      </form>`;
    document.body.appendChild(d);
    const close = () => { d.close(); d.remove(); };
    d.querySelector('[data-act=close]').addEventListener('click', close);
    d.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    const form = d.querySelector('form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formData(form);
      if (!data.question_ar) { toast('اكتبي السؤال بالعربي.', 'error'); return; }
      try {
        await busy(form.querySelector('[type=submit]'), 'جارٍ الحفظ…', async () => {
          if (isNew) {
            data.sort_order = (rows.at(-1)?.sort_order ?? 0) + 1;
            const created = await q(sb.from('faqs').insert(data).select('*').single());
            rows.push(created);
          } else {
            await q(sb.from('faqs').update(data).eq('id', r.id));
            Object.assign(r, data);
          }
        });
        toast(isNew ? 'تمت إضافة السؤال' : 'تم حفظ السؤال');
        close();
        render();
      } catch (err) {
        toast(friendlyError(err), 'error');
      }
    });

    d.querySelector('[data-act=delete]')?.addEventListener('click', async (e) => {
      const delBtn = e.currentTarget;
      if (!(await confirmDialog('حذف هذا السؤال؟', { ok: 'نعم، احذف', danger: true }))) return;
      try {
        await busy(delBtn, 'جارٍ الحذف…', () => q(sb.from('faqs').delete().eq('id', r.id)));
        rows.splice(rows.indexOf(r), 1);
        toast('تم حذف السؤال');
        close();
        render();
      } catch (err) {
        toast(friendlyError(err), 'error');
      }
    });

    d.showModal();
  }

  render();
}
