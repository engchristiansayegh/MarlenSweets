// Image pickers used inside forms. Nothing is uploaded until the form is saved.
import { ic, esc, toast } from './ui.js';
import { imageUrl } from './images.js';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*';

/**
 * Single image (category / occasion / hero).
 * mount(el) then later .state() → { file, removed, path }
 */
export function singleImagePicker({ path = null, label = 'الصورة', hint = '', aspect = '1 / 1' }) {
  let current = path;   // existing storage path
  let file = null;      // newly chosen file
  let preview = null;   // object URL for the new file
  let removed = false;
  let root;

  const render = () => {
    const url = preview || (current && !removed ? imageUrl(current) : '');
    root.innerHTML = `
      <div class="field">
        <span class="label">${esc(label)}</span>
        <div class="single-pick" style="--aspect:${aspect}">
          <div class="single-pick-preview">
            ${url ? `<img src="${esc(url)}" alt="">` : `<span class="single-pick-empty">${ic.image}<span>لا توجد صورة</span></span>`}
          </div>
          <div class="single-pick-actions">
            <label class="btn btn--ghost btn--sm">
              ${ic.camera}<span>${url ? 'تغيير الصورة' : 'اختيار صورة'}</span>
              <input type="file" accept="${ACCEPT}" hidden>
            </label>
            ${url ? `<button type="button" class="btn btn--ghost btn--sm btn--danger-text" data-act="remove">${ic.trash}<span>إزالة</span></button>` : ''}
          </div>
        </div>
        ${hint ? `<small class="hint">${hint}</small>` : ''}
      </div>`;
    root.querySelector('input[type=file]').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/') && !/\.(heic|heif)$/i.test(f.name)) { toast('الملف المختار ليس صورة.', 'error'); return; }
      if (preview) URL.revokeObjectURL(preview);
      file = f;
      preview = URL.createObjectURL(f);
      removed = false;
      root.dispatchEvent(new Event('input', { bubbles: true }));
      render();
    });
    root.querySelector('[data-act=remove]')?.addEventListener('click', () => {
      if (preview) URL.revokeObjectURL(preview);
      file = null; preview = null; removed = true;
      root.dispatchEvent(new Event('input', { bubbles: true }));
      render();
    });
  };

  return {
    mount(el) { root = el; render(); },
    state: () => ({ file, removed: removed && !file, path: current }),
    // after a successful save
    commit(newPath) { current = newPath; file = null; removed = false; if (preview) URL.revokeObjectURL(preview); preview = null; render(); },
  };
}

/**
 * Hero photo with framing: live phone + laptop previews that show exactly what gets cropped.
 * Drag the photo inside a frame to choose the visible part, slider to zoom.
 * state() → { file, removed, path, x, y, zoom }
 */
export function heroImagePicker({ path = null, x = 50, y = 50, zoom = 1, label = 'صورة الواجهة (اختياري)', emptyText = 'لا توجد صورة — يظهر رسم الكيكة بدلًا منها' }) {
  let current = path;
  let file = null;
  let preview = null;
  let removed = false;
  let pos = { x, y, zoom };
  let natural = { w: 1, h: 1 };
  let root;

  const url = () => preview || (current && !removed ? imageUrl(current) : '');
  const changed = () => root.dispatchEvent(new Event('input', { bubbles: true }));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // apply the framing to every preview image (same CSS as the public site)
  const apply = () => {
    root.querySelectorAll('.hc-img').forEach((img) => {
      img.style.objectPosition = `${pos.x}% ${pos.y}%`;
      img.style.transformOrigin = `${pos.x}% ${pos.y}%`;
      img.style.transform = `scale(${pos.zoom})`;
    });
    const zl = root.querySelector('.hc-zoom-val');
    if (zl) zl.textContent = `${Math.round(pos.zoom * 100)}%`;
  };

  const frame = (kind) => `
    <figure class="hc-device hc-device--${kind}">
      <div class="hc-screen">
        <div class="hc-bar"></div>
        <div class="hc-photo" data-drag tabindex="0" aria-label="اسحبي لتحريك الصورة">
          <div class="hc-media"><img class="hc-img" src="${esc(url())}" alt="" draggable="false"></div>
          <span class="hc-hand">${ic.move}</span>
        </div>
        <div class="hc-text"><i></i><i></i><i></i><b></b></div>
      </div>
      <figcaption>${kind === 'phone' ? 'على الموبايل' : 'على اللابتوب'}</figcaption>
    </figure>`;

  const render = () => {
    const u = url();
    root.innerHTML = `
      <div class="field">
        <span class="label">${esc(label)}</span>
        ${u ? `
          <div class="hc">
            <p class="hc-help">${ic.move}<span><strong>اسحبي الصورة</strong> داخل أي إطار لتختاري الجزء الذي يظهر. ما يظهر داخل الإطار المنقّط هو بالضبط ما سيراه الزوار، وما خارجه سيُقص.</span></p>
            <div class="hc-frames">${frame('phone')}${frame('laptop')}</div>
            <div class="hc-controls">
              <label class="hc-zoom">
                <span>التكبير</span>
                <input type="range" min="1" max="2.5" step="0.05" value="${pos.zoom}" aria-label="تكبير الصورة">
                <output class="hc-zoom-val"></output>
              </label>
              <button type="button" class="btn btn--ghost btn--sm" data-act="center">توسيط الصورة</button>
            </div>
          </div>` : `
          <div class="single-pick-preview" style="--aspect: 16 / 9"><span class="single-pick-empty">${ic.image}<span>${esc(emptyText)}</span></span></div>`}
        <div class="single-pick-actions">
          <label class="btn btn--ghost btn--sm">
            ${ic.camera}<span>${u ? 'تغيير الصورة' : 'اختيار صورة'}</span>
            <input type="file" accept="${ACCEPT}" hidden>
          </label>
          ${u ? `<button type="button" class="btn btn--ghost btn--sm btn--danger-text" data-act="remove">${ic.trash}<span>إزالة الصورة</span></button>` : ''}
        </div>
        <small class="hint">نصيحة: اختاري صورة أفقية واضحة تكون الحلوى فيها قريبة من المنتصف.</small>
      </div>`;

    root.querySelector('input[type=file]').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/') && !/\.(heic|heif)$/i.test(f.name)) { toast('الملف المختار ليس صورة.', 'error'); return; }
      if (preview) URL.revokeObjectURL(preview);
      file = f;
      preview = URL.createObjectURL(f);
      removed = false;
      pos = { x: 50, y: 50, zoom: 1 };
      changed();
      render();
    });
    root.querySelector('[data-act=remove]')?.addEventListener('click', () => {
      if (preview) URL.revokeObjectURL(preview);
      file = null; preview = null; removed = true;
      changed();
      render();
    });
    if (!u) return;

    const firstImg = root.querySelector('.hc-img');
    const setNatural = () => { natural = { w: firstImg.naturalWidth || 1, h: firstImg.naturalHeight || 1 }; };
    if (firstImg.complete) setNatural(); else firstImg.addEventListener('load', setNatural, { once: true });

    root.querySelector('input[type=range]').addEventListener('input', (e) => {
      pos.zoom = +e.target.value;
      apply();
      changed();
    });
    root.querySelector('[data-act=center]').addEventListener('click', () => {
      pos.x = 50; pos.y = 50;
      apply();
      changed();
    });

    // dragging: moving the finger right reveals more of the left side, like moving a photo in a frame
    root.querySelectorAll('[data-drag]').forEach((box) => {
      let start = null;
      const overflow = () => {
        const fw = box.clientWidth, fh = box.clientHeight;
        const s = Math.max(fw / natural.w, fh / natural.h) * pos.zoom;
        return { ox: Math.max(natural.w * s - fw, fw * (pos.zoom - 1), 1), oy: Math.max(natural.h * s - fh, fh * (pos.zoom - 1), 1) };
      };
      box.addEventListener('pointerdown', (e) => {
        start = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, ...overflow() };
        box.setPointerCapture(e.pointerId);
        box.classList.add('is-dragging');
      });
      box.addEventListener('pointermove', (e) => {
        if (!start) return;
        pos.x = clamp(start.x - ((e.clientX - start.px) / start.ox) * 100, 0, 100);
        pos.y = clamp(start.y - ((e.clientY - start.py) / start.oy) * 100, 0, 100);
        apply();
      });
      const end = () => {
        if (!start) return;
        start = null;
        box.classList.remove('is-dragging');
        changed();
      };
      box.addEventListener('pointerup', end);
      box.addEventListener('pointercancel', end);
      box.addEventListener('keydown', (e) => {
        const step = 3;
        const d = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
        if (!d) return;
        e.preventDefault();
        pos.x = clamp(pos.x + d[0], 0, 100);
        pos.y = clamp(pos.y + d[1], 0, 100);
        apply();
        changed();
      });
    });
    apply();
  };

  return {
    mount(el) { root = el; render(); },
    state: () => ({ file, removed: removed && !file, path: current, x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10, zoom: pos.zoom }),
    commit(newPath) { current = newPath; file = null; removed = false; if (preview) URL.revokeObjectURL(preview); preview = null; render(); },
  };
}

/**
 * Multiple images with reordering (products).
 * Items: { id?, path?, file?, url }. The first item is the main (cover) photo.
 */
export function multiImagePicker(existing = []) {
  let items = existing.map((im) => ({ id: im.id, path: im.path, url: imageUrl(im.path, 'sm'), full: imageUrl(im.path) }));
  const deleted = []; // existing rows removed by the user
  let root;

  const changed = () => root.dispatchEvent(new Event('input', { bubbles: true }));

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    changed();
    render();
  };

  const render = () => {
    root.innerHTML = `
      <div class="multi-pick">
        ${items.map((it, i) => `
          <figure class="mp-item ${it.file ? 'is-new' : ''}">
            <img src="${esc(it.url)}" ${it.full ? `data-full="${esc(it.full)}"` : ''} alt="">
            ${i === 0 ? `<span class="mp-badge">${ic.first}<span>الرئيسية</span></span>` : ''}
            ${it.file ? '<span class="mp-new">جديدة</span>' : ''}
            <div class="mp-tools">
              <button type="button" class="mp-btn" data-act="prev" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="تقديم">${ic.right}</button>
              ${i !== 0 ? `<button type="button" class="mp-btn" data-act="main" data-i="${i}" aria-label="جعلها الصورة الرئيسية">${ic.star}</button>` : ''}
              <button type="button" class="mp-btn mp-btn--danger" data-act="del" data-i="${i}" aria-label="حذف">${ic.trash}</button>
              <button type="button" class="mp-btn" data-act="next" data-i="${i}" ${i === items.length - 1 ? 'disabled' : ''} aria-label="تأخير">${ic.left}</button>
            </div>
          </figure>`).join('')}
        <label class="mp-add">
          ${ic.camera}
          <span>إضافة صور</span>
          <small>يمكنك اختيار عدة صور</small>
          <input type="file" accept="${ACCEPT}" multiple hidden>
        </label>
      </div>
      <small class="hint">الصورة الأولى هي التي تظهر في بطاقة المنتج. استخدمي الأسهم لترتيب الصور، والنجمة لجعل صورة هي الرئيسية.</small>`;

    root.querySelector('input[type=file]').addEventListener('change', (e) => {
      const files = [...e.target.files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
      if (files.length < e.target.files.length) toast('تم تجاهل ملفات ليست صورًا.', 'error');
      files.forEach((f) => items.push({ file: f, url: URL.createObjectURL(f) }));
      if (files.length) { changed(); render(); }
    });
    root.querySelectorAll('.mp-btn').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      const act = b.dataset.act;
      // RTL: "prev" arrow points right (towards the start of the list)
      if (act === 'prev') move(i, -1);
      else if (act === 'next') move(i, 1);
      else if (act === 'main') { const [it] = items.splice(i, 1); items.unshift(it); changed(); render(); }
      else if (act === 'del') {
        const [it] = items.splice(i, 1);
        if (it.id) deleted.push(it);
        else URL.revokeObjectURL(it.url);
        changed();
        render();
      }
    }));
  };

  return {
    mount(el) { root = el; render(); },
    items: () => items,
    deleted: () => deleted,
    // after a successful save: replace with the saved rows
    reset(saved) {
      items.forEach((it) => it.file && URL.revokeObjectURL(it.url));
      items = saved.map((im) => ({ id: im.id, path: im.path, url: imageUrl(im.path, 'sm'), full: imageUrl(im.path) }));
      deleted.length = 0;
      render();
    },
  };
}
