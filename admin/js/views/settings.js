import { sb, q } from '../sb.js';
import { ic, esc, toast, friendlyError, busy, field, formData, pageHead, loadingView, errorView } from '../ui.js';
import { uploadImage, removeFiles } from '../images.js';
import { heroImagePicker } from '../pickers.js';

// Accepts 0955542024, +963 955 542 024, 00963… → 963955542024
export function normalizeWhatsapp(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0') && d.length === 10) d = `963${d.slice(1)}`;
  return d;
}

const validUrl = (u) => !u || /^https?:\/\/\S+\.\S+/.test(u);

export async function settingsView(el, ctx) {
  el.innerHTML = loadingView();
  let s;
  try {
    s = (await q(sb.from('settings').select('*').eq('id', 1).maybeSingle())) || {};
  } catch (err) {
    el.innerHTML = errorView(err);
    return;
  }
  const user = (await sb.auth.getSession()).data.session?.user; // local, no network

  el.innerHTML = `
    ${pageHead('إعدادات الموقع')}
    <form class="form" id="settings-form" novalidate>
      <section class="card">
        <h2 class="card-title">${ic.whatsapp} التواصل</h2>
        <div class="grid-2">
          ${field({ name: 'whatsapp', label: 'رقم واتساب', value: s.whatsapp ? `+${s.whatsapp}` : '', dir: 'ltr', type: 'tel', hint: 'يمكن كتابته بأي شكل، مثل 0955542024 وسيتحول تلقائيًا إلى الصيغة الدولية.' })}
          ${field({ name: 'email', label: 'البريد الإلكتروني', value: s.email, dir: 'ltr', type: 'email' })}
          ${field({ name: 'instagram_url', label: 'رابط إنستغرام', value: s.instagram_url, dir: 'ltr', placeholder: 'https://www.instagram.com/…' })}
          ${field({ name: 'facebook_url', label: 'رابط فيسبوك', value: s.facebook_url, dir: 'ltr', placeholder: 'https://www.facebook.com/…' })}
          ${field({ name: 'address_ar', label: 'العنوان بالعربي', value: s.address_ar })}
          ${field({ name: 'address_en', label: 'العنوان بالإنجليزي', value: s.address_en, dir: 'ltr' })}
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">${ic.home} أعلى الصفحة الرئيسية</h2>
        <div id="hero-image"></div>
        <div class="grid-2">
          ${field({ name: 'hero_title_ar', label: 'العنوان الكبير بالعربي', value: s.hero_title_ar })}
          ${field({ name: 'hero_title_en', label: 'العنوان الكبير بالإنجليزي', value: s.hero_title_en, dir: 'ltr' })}
          ${field({ name: 'hero_subtitle_ar', label: 'النص تحت العنوان بالعربي', value: s.hero_subtitle_ar, type: 'textarea', rows: 3 })}
          ${field({ name: 'hero_subtitle_en', label: 'النص تحت العنوان بالإنجليزي', value: s.hero_subtitle_en, type: 'textarea', rows: 3, dir: 'ltr' })}
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">${ic.heart} صفحة "من نحن"</h2>
        ${'about_image_path' in s ? '<div id="about-image"></div>' : `
          <p class="hint">لإضافة صورة خلفية لصفحة "من نحن" يجب أولًا تشغيل ملف <code dir="ltr">migration-03.sql</code> في Supabase ثم إعادة فتح هذه الصفحة.</p>`}
        <div class="grid-2">
          ${field({ name: 'about_ar', label: 'النص بالعربي', value: s.about_ar, type: 'textarea', rows: 7, hint: 'اتركي سطرًا فارغًا بين الفقرات.' })}
          ${field({ name: 'about_en', label: 'النص بالإنجليزي', value: s.about_en, type: 'textarea', rows: 7, dir: 'ltr' })}
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">${ic.whatsapp} رسالة واتساب الجاهزة</h2>
        <p class="muted small">هذه الرسالة تُكتب تلقائيًا عندما يضغط الزائر "اطلب عبر واتساب". الكلمة <code dir="ltr">{product}</code> تُستبدل باسم المنتج، ويُضاف رابط المنتج في آخر الرسالة.</p>
        <div class="grid-2">
          ${field({ name: 'whatsapp_message_ar', label: 'بالعربي', value: s.whatsapp_message_ar, type: 'textarea', rows: 2 })}
          ${field({ name: 'whatsapp_message_en', label: 'بالإنجليزي', value: s.whatsapp_message_en, type: 'textarea', rows: 2, dir: 'ltr' })}
        </div>
      </section>

      <div class="savebar">
        <button type="submit" class="btn btn--primary btn--lg">${ic.check}<span>حفظ الإعدادات</span></button>
      </div>
    </form>

    <form class="form" id="password-form" novalidate>
      <section class="card">
        <h2 class="card-title">${ic.lock} الحساب</h2>
        <p class="muted small">مسجلة الدخول باسم <strong dir="ltr">${esc(user?.email || '')}</strong></p>
        <div class="grid-2">
          ${field({ name: 'password', label: 'كلمة مرور جديدة', type: 'password', hint: '8 أحرف على الأقل.' })}
          ${field({ name: 'password2', label: 'تأكيد كلمة المرور', type: 'password' })}
        </div>
        <button type="submit" class="btn btn--ghost">${ic.lock}<span>تغيير كلمة المرور</span></button>
      </section>
    </form>`;

  const form = el.querySelector('#settings-form');
  // Background photos with framing. `prefix` maps to the columns <prefix>_image_path, _focus_x, _focus_y, _zoom.
  const photos = [
    { prefix: 'hero', folder: 'hero', el: '#hero-image', label: 'صورة الواجهة (اختياري)', empty: 'لا توجد صورة — يظهر رسم الكيكة بدلًا منها' },
    { prefix: 'about', folder: 'about', el: '#about-image', label: 'صورة خلفية لصفحة "من نحن" (اختياري)', empty: 'لا توجد صورة — تظهر الصفحة بتصميمها العادي' },
  ]
    .filter((ph) => el.querySelector(ph.el))
    .map((ph) => {
      const picker = heroImagePicker({
        path: s[`${ph.prefix}_image_path`],
        x: s[`${ph.prefix}_focus_x`] ?? 50,
        y: s[`${ph.prefix}_focus_y`] ?? 50,
        zoom: s[`${ph.prefix}_zoom`] ?? 1,
        label: ph.label,
        emptyText: ph.empty,
      });
      picker.mount(el.querySelector(ph.el));
      // framing columns exist only after the matching migration was run
      return { ...ph, picker, hasFraming: `${ph.prefix}_focus_x` in s };
    });

  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  ctx.setDirtyCheck(() => dirty);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = formData(form);
    data.whatsapp = normalizeWhatsapp(data.whatsapp);
    if (data.whatsapp && (data.whatsapp.length < 10 || data.whatsapp.length > 15)) {
      toast('رقم واتساب غير صحيح. مثال صحيح: 0955542024', 'error');
      form.whatsapp.focus();
      return;
    }
    for (const k of ['instagram_url', 'facebook_url']) {
      if (!validUrl(data[k])) { toast('الرابط يجب أن يبدأ بـ https://', 'error'); form[k].focus(); return; }
    }
    try {
      await busy(form.querySelector('[type=submit]'), 'جارٍ الحفظ…', async (setLabel) => {
        const oldToDelete = [];
        for (const ph of photos) {
          const img = ph.picker.state();
          const col = `${ph.prefix}_image_path`;
          if (img.file) {
            setLabel('جارٍ رفع الصورة…');
            data[col] = await uploadImage(ph.folder, img.file, { max: 1800 });
            oldToDelete.push(img.path);
          } else if (img.removed) {
            data[col] = null;
            oldToDelete.push(img.path);
          }
          if (ph.hasFraming) {
            Object.assign(data, { [`${ph.prefix}_focus_x`]: img.x, [`${ph.prefix}_focus_y`]: img.y, [`${ph.prefix}_zoom`]: img.zoom });
          }
        }
        setLabel('جارٍ الحفظ…');
        await q(sb.from('settings').update(data).eq('id', 1));
        removeFiles(oldToDelete).catch(() => {});
        photos.forEach((ph) => {
          const col = `${ph.prefix}_image_path`;
          if (col in data) ph.picker.commit(data[col]);
        });
      });
      form.whatsapp.value = data.whatsapp ? `+${data.whatsapp}` : '';
      dirty = false;
      const missing = photos.some((ph) => !ph.hasFraming);
      toast(missing ? 'تم الحفظ. ملاحظة: لحفظ تحريك الصورة يجب تشغيل ملف migration-02.sql في Supabase.' : 'تم حفظ الإعدادات بنجاح', 'success', missing ? 9000 : 3800);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });

  const pw = el.querySelector('#password-form');
  pw.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { password, password2 } = formData(pw);
    if (password.length < 8) { toast('كلمة المرور يجب أن تكون 8 أحرف على الأقل.', 'error'); return; }
    if (password !== password2) { toast('كلمتا المرور غير متطابقتين.', 'error'); return; }
    try {
      await busy(pw.querySelector('[type=submit]'), 'جارٍ التغيير…', async () => {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
      });
      pw.reset();
      toast('تم تغيير كلمة المرور. استخدميها في المرة القادمة.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });
}
