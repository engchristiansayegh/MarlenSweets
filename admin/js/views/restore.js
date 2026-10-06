// One-time tool (#/restore): uploads the images saved by tools/backup.py into the current project.
// Works only on the local preview (http://localhost:5500/admin/#/restore) where /backup exists.
import { sb, q, storage } from '../sb.js';
import { ic, esc, toast, friendlyError, busy, pageHead } from '../ui.js';
import { makeThumb, runLimited } from '../images.js';

export async function restoreView(el) {
  el.innerHTML = `
    ${pageHead('أدوات الصور', { back: '#/' })}
    <section class="card">
      <h2 class="card-title">${ic.image} تسريع الصور الحالية</h2>
      <p>تنشئ نسخة صغيرة وخفيفة من كل صورة رُفعت سابقًا، لتظهر بطاقات المنتجات أسرع بكثير. الصور الجديدة تحصل على نسختها الصغيرة تلقائيًا.</p>
      <button class="btn btn--primary btn--lg" type="button" data-act="thumbs">${ic.sparkle}<span>إنشاء النسخ الصغيرة</span></button>
      <ul class="thumbs-log muted small"></ul>
    </section>
    <section class="card">
      <h2 class="card-title">${ic.image} استرجاع الصور من النسخة الاحتياطية</h2>
      <p>هذه الأداة ترفع الصور المحفوظة في مجلد <code dir="ltr">backup/media</code> إلى المشروع الحالي، بنفس أسمائها، حتى تظهر المنتجات بصورها كما كانت.</p>
      <p class="muted small">شغّليها مرة واحدة فقط بعد تشغيل ملف <code dir="ltr">restore.sql</code>. تشغيلها مرة ثانية لا يسبب مشكلة.</p>
      <button class="btn btn--primary btn--lg" type="button">${ic.image}<span>بدء رفع الصور</span></button>
      <ul class="restore-log muted small"></ul>
    </section>`;
  const log = el.querySelector('.restore-log');
  const line = (t, ok = true, box = log) => box.insertAdjacentHTML('beforeend', `<li>${ok ? '✓' : '✗'} ${esc(t)}</li>`);

  el.querySelector('[data-act=thumbs]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const box = el.querySelector('.thumbs-log');
    box.innerHTML = '';
    try {
      await busy(btn, 'جارٍ التحضير…', async (setLabel) => {
        const [imgs, cats, occs, s] = await Promise.all([
          q(sb.from('product_images').select('path')),
          q(sb.from('categories').select('image_path')),
          q(sb.from('occasions').select('image_path')),
          q(sb.from('settings').select('*').eq('id', 1).maybeSingle()),
        ]);
        const paths = [...new Set([
          ...imgs.map((r) => r.path), ...cats.map((r) => r.image_path), ...occs.map((r) => r.image_path),
          s?.hero_image_path, s?.about_image_path,
        ].filter(Boolean))];
        let done = 0, ok = 0;
        setLabel(`جارٍ العمل 0 من ${paths.length}…`);
        await runLimited(paths, 2, async (p) => {
          try { await makeThumb(p); ok++; line(p, true, box); } catch (err) { line(`${p} — ${friendlyError(err)}`, false, box); }
          setLabel(`جارٍ العمل ${++done} من ${paths.length}…`);
        });
        toast(ok === paths.length ? `تم تجهيز ${ok} صورة 🎉` : `تم ${ok} من ${paths.length}. أعيدي المحاولة للباقي.`, ok === paths.length ? 'success' : 'error');
      });
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });

  el.querySelector('section:last-of-type button').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    let data;
    try {
      data = await (await fetch('../backup/data.json', { cache: 'no-store' })).json();
    } catch {
      toast('لم يتم العثور على النسخة الاحتياطية. هذه الأداة تعمل فقط على الكمبيوتر (localhost).', 'error');
      return;
    }
    const paths = new Set(data.product_images.map((r) => r.path));
    [...data.categories, ...data.occasions].forEach((r) => r.image_path && paths.add(r.image_path));
    data.settings.forEach((r) => r.hero_image_path && paths.add(r.hero_image_path));
    const list = [...paths];
    let ok = 0;
    try {
      await busy(btn, 'جارٍ الرفع…', async (setLabel) => {
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          setLabel(`جارٍ رفع الصورة ${i + 1} من ${list.length}…`);
          try {
            const blob = await (await fetch(`../backup/media/${p}`)).blob();
            const { error } = await storage().upload(p, blob, { contentType: blob.type || 'image/webp', cacheControl: '31536000', upsert: true });
            if (error) throw error;
            ok++;
            line(p);
          } catch (err) {
            line(`${p} — ${friendlyError(err)}`, false);
          }
        }
      });
      toast(ok === list.length ? `تم رفع كل الصور (${ok}) بنجاح 🎉` : `تم رفع ${ok} من ${list.length} صور. أعيدي المحاولة للباقي.`, ok === list.length ? 'success' : 'error');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });
}
