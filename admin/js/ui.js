// Small UI toolkit for the admin: icons, toasts, confirm dialog, form helpers, errors.
import { icons as siteIcons } from '/js/icons.js';

const line = (d) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ic = {
  ...siteIcons,
  home: line('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>'),
  box: line('<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>'),
  grid: line('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
  help: line('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'),
  settings: line('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plus: line('<path d="M12 5v14M5 12h14"/>'),
  edit: line('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  trash: line('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  up: line('<path d="m6 15 6-6 6 6"/>'),
  down: line('<path d="m6 9 6 6 6-6"/>'),
  eye: line('<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: line('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 3.8M6.6 6.6A16.5 16.5 0 0 0 2.5 12S6 19 12 19a9.6 9.6 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  star: line('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  image: line('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  logout: line('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/>'),
  external: line('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  camera: line('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  check: line('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  alert: line('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.5" r=".6" fill="currentColor"/>'),
  lock: line('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  move: line('<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>'),
  // The admin is always RTL: fixed arrows (no mirroring)
  right: line('<path d="m9 6 6 6-6 6"/>'),
  left: line('<path d="m15 6-6 6 6 6"/>'),
  back: line('<path d="m9 6 6 6-6 6"/>'),
  first: line('<path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.5L12 16.6 7.1 19.2l.9-5.5-4-3.9 5.6-.8z" fill="currentColor"/>'),
};

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------------------------------------------------------------- toasts */
let toastBox;
export function toast(message, type = 'success', ms = 3800) {
  toastBox ??= Object.assign(document.body.appendChild(document.createElement('div')), { className: 'toasts', role: 'status' });
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `${type === 'error' ? ic.alert : ic.check}<span>${esc(message)}</span>`;
  toastBox.appendChild(el);
  const close = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 300); };
  el.addEventListener('click', close);
  setTimeout(close, type === 'error' ? ms + 3000 : ms);
}

/* ---------------------------------------------------------------- confirm dialog */
export function confirmDialog(message, { ok = 'تأكيد', danger = false, detail = '' } = {}) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'confirm';
    d.innerHTML = `
      <div class="confirm-icon ${danger ? 'is-danger' : ''}">${danger ? ic.trash : ic.help}</div>
      <p class="confirm-msg">${esc(message)}</p>
      ${detail ? `<p class="confirm-detail">${esc(detail)}</p>` : ''}
      <div class="confirm-actions">
        <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" value="ok">${esc(ok)}</button>
        <button type="button" class="btn btn--ghost" value="cancel">إلغاء</button>
      </div>`;
    document.body.appendChild(d);
    const done = (v) => { d.close(); d.remove(); resolve(v); };
    d.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) done(b.value === 'ok');
      else if (e.target === d) done(false);
    });
    d.addEventListener('cancel', (e) => { e.preventDefault(); done(false); });
    d.showModal();
  });
}

/* ---------------------------------------------------------------- errors in plain Arabic */
export function friendlyError(err) {
  console.error(err);
  const msg = String(err?.message || err || '');
  const code = err?.code || err?.statusCode;
  if (/Invalid login credentials/i.test(msg)) return 'الإيميل أو كلمة المرور غير صحيحة.';
  if (/Email not confirmed/i.test(msg)) return 'هذا الحساب غير مفعّل بعد.';
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(msg)) return 'لا يوجد اتصال بالإنترنت أو الاتصال ضعيف. حاولي مرة أخرى.';
  if (code === '23503' || /foreign key/i.test(msg)) return 'لا يمكن الحذف لأن هناك عناصر مرتبطة به (مثلًا منتجات داخل هذا التصنيف). انقلي المنتجات أو احذفيها أولًا.';
  if (code === '23505' || /duplicate key/i.test(msg)) return 'يوجد عنصر آخر بنفس الاسم المختصر. غيّري الاسم قليلًا.';
  if (code === '42501' || /row-level security|permission denied|Unauthorized|403/i.test(msg)) return 'ليست لديك صلاحية لهذا الإجراء. تأكدي أنك مسجلة الدخول بحساب الأدمن.';
  if (/JWT expired|session/i.test(msg)) return 'انتهت الجلسة. سجلي الدخول مرة أخرى.';
  if (/Password should be at least/i.test(msg)) return 'كلمة المرور قصيرة، يجب أن تكون 8 أحرف على الأقل.';
  if (/same.*password/i.test(msg)) return 'كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة.';
  if (/rate limit|too many/i.test(msg)) return 'محاولات كثيرة خلال وقت قصير. انتظري قليلًا ثم حاولي مجددًا.';
  if (/payload too large|exceeded the maximum/i.test(msg)) return 'حجم الصورة كبير جدًا.';
  if (/mime type/i.test(msg)) return 'نوع الملف غير مدعوم. اختاري صورة (JPG أو PNG أو WebP).';
  return `حدث خطأ غير متوقع: ${msg || 'غير معروف'}`;
}

/* ---------------------------------------------------------------- buttons with loading state */
export async function busy(button, label, fn) {
  const old = button.innerHTML;
  button.disabled = true;
  button.classList.add('is-busy');
  const setLabel = (t) => { button.innerHTML = `<span class="spinner"></span><span>${esc(t)}</span>`; };
  setLabel(label);
  try {
    return await fn(setLabel);
  } finally {
    button.disabled = false;
    button.classList.remove('is-busy');
    button.innerHTML = old;
  }
}

/* ---------------------------------------------------------------- form helpers */
export function field({ name, label, value = '', type = 'text', required = false, hint = '', dir = '', rows = 4, placeholder = '' }) {
  const id = `f-${name}`;
  const control = type === 'textarea'
    ? `<textarea id="${id}" name="${name}" rows="${rows}" ${dir ? `dir="${dir}"` : ''} ${required ? 'required' : ''} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
    : `<input id="${id}" name="${name}" type="${type}" value="${esc(value)}" ${dir ? `dir="${dir}"` : ''} ${required ? 'required' : ''} placeholder="${esc(placeholder)}" autocomplete="off">`;
  return `
    <div class="field">
      <label for="${id}">${esc(label)}${required ? ' <span class="req">*</span>' : ''}</label>
      ${control}
      ${hint ? `<small class="hint">${hint}</small>` : ''}
    </div>`;
}

export function toggle({ name, label, checked, hint = '' }) {
  return `
    <label class="toggle">
      <input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>
      <span class="toggle-track"><span class="toggle-thumb"></span></span>
      <span class="toggle-text"><span>${esc(label)}</span>${hint ? `<small>${esc(hint)}</small>` : ''}</span>
    </label>`;
}

export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox' && !el.dataset.multi) out[el.name] = el.checked;
    else if (el.type !== 'checkbox' && el.type !== 'file') out[el.name] = el.value.trim();
  }
  return out;
}

// URL-friendly id from the English name (falls back to a random id for Arabic-only names)
export function slugify(text) {
  const s = String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return s || `item-${Math.random().toString(36).slice(2, 8)}`;
}

export function pageHead(title, { back = '', actions = '' } = {}) {
  return `
    <div class="page-head">
      <div class="page-head-title">
        ${back ? `<a class="icon-btn" href="${back}" aria-label="رجوع">${ic.back}</a>` : ''}
        <h1>${esc(title)}</h1>
      </div>
      ${actions ? `<div class="page-head-actions">${actions}</div>` : ''}
    </div>`;
}

export function thumb(url, fallbackIcon = ic.image, fullUrl = '') {
  return url
    ? `<span class="thumb"><img src="${esc(url)}" ${fullUrl ? `data-full="${esc(fullUrl)}"` : ''} alt="" loading="lazy"></span>`
    : `<span class="thumb thumb--empty">${fallbackIcon}</span>`;
}

export const loadingView = () => `<div class="view-loading"><span class="spinner spinner--lg"></span><span>جارٍ التحميل…</span></div>`;
export const errorView = (err) => `
  <div class="empty-box">
    ${ic.alert}<p>${esc(friendlyError(err))}</p>
    <button class="btn btn--primary" type="button" onclick="location.reload()">إعادة المحاولة</button>
  </div>`;
